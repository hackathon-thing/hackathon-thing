import {
    addDomainToVercel,
    removeDomainFromVercelProject
} from "@/lib/domains";
import prisma from "@/lib/prisma";
import { permitParams } from "@/lib/utils";
import { getAuth } from "@clerk/nextjs/server";
import { Hackathon } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    console.log("hackathons update");
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    try {
        const newData = req.body;
        const { slug } = req.query;

        if (newData.startDate || newData.endDate) {
            if (newData.timezone) {
                // times are submitted in the hackathon's timezone
                const tz = newData.timezone;
                const startDate = new Date(newData.startDate);
                const endDate = new Date(newData.endDate);
                // convert to UTC
                newData.startDate = startDate.toLocaleString("en-US", {
                    timeZone: tz
                });
                newData.endDate = endDate.toLocaleString("en-US", {
                    timeZone: tz
                });
            }
            // convert to ISO-8601 format
            newData.startDate = new Date(newData.startDate).toISOString();
            newData.endDate = new Date(newData.endDate).toISOString();
        }

        const hackathon = await prisma.hackathon.update({
            data: {
                ...permitParams<Hackathon>(
                    [
                        "name",
                        "location",
                        "startDate",
                        "endDate",
                        "slug",
                        "bannerUrl",
                        "broadcastEnabled",
                        "checkInEnabled",
                        "financeEnabled",
                        "hcbId",
                        "integrateEnabled",
                        "logoUrl",
                        "registerEnabled",
                        "scheduleEnabled",
                        "shipEnabled",
                        "website",
                        "leadsEnabled",
                        "sponsorsEnabled",
                        "customDomain",
                        "timezone"
                    ],
                    newData
                )
            },
            where: {
                slug: slug as string
            }
        });

        if (!newData.customDomain && hackathon.customDomain) {
            await removeDomainFromVercelProject(hackathon.customDomain);
        } else if (newData.customDomain && !hackathon.customDomain) {
            await addDomainToVercel(newData.customDomain);
        } else if (
            newData.customDomain &&
            hackathon.customDomain &&
            newData.customDomain !== hackathon.customDomain
        ) {
            await removeDomainFromVercelProject(hackathon.customDomain);
            await addDomainToVercel(newData.customDomain);
        }

        res.redirect(`/${hackathon.slug}`);
    } catch (error) {
        console.error(error);
        return res.status(400).json({ error });
    }
}
