import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getHackathonSlug } from "@/lib/utils";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    try {
        const slug = await getHackathonSlug(req.query.slug as string);
        let attendee = await prisma.attendee.findFirst({
            where: {
                tokens: {
                    some: {
                        token: req.cookies[slug]
                    }
                }
            }
        });
        if (!attendee)
            return res.status(400).json({
                error: "Attendee does not exist."
            });
        let project = await prisma.project.update({
            where: {
                id: req.body.id
            },
            data: {
                collaborators: {
                    disconnect: [{ id: attendee.id }]
                }
            }
        });
        console.log(project);
        return res.json({
            left: true
        });
    } catch (e) {
        console.error(e);
        return res.status(400).json({
            error: "There was an unexpected error, please try again."
        });
    }
}
