import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextApiRequest, NextApiResponse } from "next";
import { getHackathon } from "..";
import type { AttendeeAttribute, Hackathon } from "@prisma/client";

type HackathonWithAttributes = Hackathon & {
    attendeeAttributes: AttendeeAttribute[];
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const hackathon = (await getHackathon(req, res, {
        attendeeAttributes: true
    })) as HackathonWithAttributes | null;
    if (!hackathon) return res.status(401).json({ error: "Unauthorized" });
    let newData: any = {};
    Object.keys(req.body).map((x) => {
        let id = x.split("_")[0];
        let property = x.split("_")[1];
        if (!newData[id]) {
            newData[id] = {
                attribute: hackathon.attendeeAttributes.filter(
                    (x) => x.id == id
                )[0]
            };
        }
        newData[id][property] = (req.body as any)[x];
    });

    let toDelete = Object.keys(newData)
        .filter((x: any) => newData[x].enabled.length == 0)
        .map((x: any) => ({
            attributeId: x,
            signupForm: {
                hackathonId: hackathon?.id
            }
        }));
    let toUpdate = Object.keys(newData).filter(
        (x: any) => newData[x].enabled.length != 0
    );
    await prisma.signupFormField.deleteMany({
        where: {
            OR: toDelete
        }
    });

    await prisma.$transaction(
        toUpdate.map((x: any) =>
            prisma.signupFormField.upsert({
                where: {
                    attributeId: x,
                    signupForm: {
                        hackathonId: hackathon?.id
                    }
                },
                create: {
                    attribute: {
                        connect: {
                            id: x
                        }
                    },
                    signupForm: {
                        connectOrCreate: {
                            where: {
                                hackathonId: hackathon.id
                            },
                            create: {
                                hackathonId: hackathon.id
                            }
                        }
                    },
                    label: newData[x].label,
                    order: 1,
                    required: false,
                    plaecholder: newData[x].plaecholder,
                    description: newData[x].description,
                    stage: newData[x].stage
                },
                update: {
                    label: newData[x].label,
                    plaecholder: newData[x].plaecholder,
                    description: newData[x].description,
                    stage: newData[x].stage
                }
            })
        )
    );

    res.json({ newData });
}
