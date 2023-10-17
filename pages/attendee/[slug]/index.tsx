import prisma from "@/lib/prisma";
import { Button, Card, Grid, Text } from "@geist-ui/core";
import type { GetServerSidePropsContext } from "next";

import AttendeeLayout from "@/components/layouts/attendee/AttendeeLayout";
import Markdown from "@/components/Markdown";
import type {
  Attendee,
  AttendeeDashboard,
  AttendeeDashboardCard,
  AttendeeDashboardLink,
  Hackathon
} from "@prisma/client";
import Link from "next/link";
import type { ReactElement } from "react";

export default function Attendee({
  hackathon,
  attendee
}: {
  hackathon:
    | (Hackathon & {
        dashboard:
          | (AttendeeDashboard & {
              cards: (AttendeeDashboardCard & {
                links: AttendeeDashboardLink[];
              })[];
              links: AttendeeDashboardLink[];
            })
          | null;
      })
    | null;
  attendee: Attendee | null;
}): any {
  if (!hackathon) {
    return (
      <>
        <div>404: Hackathon Not Found!</div>
      </>
    );
  }

  return (
    <>
      <div className="w-full">
        <h1>{hackathon?.name}</h1>
        <Grid.Container gap={2}>
          {hackathon?.dashboard?.links.map((link) => (
            <Grid>
              <Link href={link.url}>
                <Button type="success">{link.text}</Button>
              </Link>
            </Grid>
          ))}
        </Grid.Container>
        <Grid.Container gap={1.5} my={1}>
          {hackathon?.dashboard?.cards.map((card) => (
            <Grid xs={12}>
              <Card width="100%">
                <Text h4 my={0}>
                  {card.header}
                </Text>
                <Text>{card.text}</Text>
                {card.links.map((link) => (
                  <Link href={link.url}>
                    <Button>{link.text}</Button>
                  </Link>
                ))}
              </Card>
            </Grid>
          ))}
        </Grid.Container>
        {hackathon?.dashboard && <Markdown code={hackathon?.dashboard?.body} />}
      </div>
    </>
  );
}

Attendee.getLayout = function getLayout(
  page: ReactElement,
  props: { hackathon: Hackathon | null; attendee: Attendee | null }
) {
  return (
    <AttendeeLayout hackathon={props.hackathon} attendee={props.attendee}>
      {page}
    </AttendeeLayout>
  );
};

export const getServerSideProps = (async (
  context: GetServerSidePropsContext
) => {
  if (context.params?.slug) {
    const hackathon = await prisma.hackathon.findFirst({
      where: {
        OR: [
          {
            slug: context.params?.slug.toString()
          },
          {
            customDomain: context.params?.slug.toString()
          }
        ]
      },
      include: {
        dashboard: {
          include: {
            links: true,
            cards: {
              include: {
                links: true
              }
            }
          }
        }
      }
    });
    if (hackathon) {
      const token = context.req.cookies[hackathon?.slug as string];
      let attendee = null;
      if (token) {
        attendee = await prisma.attendee.findFirst({
          where: {
            hackathonId: hackathon.id,
            tokens: {
              some: {
                token: token
              }
            }
          }
        });
      }
      if (attendee) {
        return {
          props: {
            hackathon: hackathon,
            attendee: attendee
          }
        };
      }
    }
  }
  return {
    props: {
      hackathon: null,
      attendee: null
    },
    redirect: {
      destination:
        new URL(("https://example.com" + context.req.url) as string).pathname +
        "/register",
      permanent: false
    }
  };
}) satisfies GetServerSideProps<{
  hackathon: Hackathon | null;
  attendee: Attendee | null;
}>;
