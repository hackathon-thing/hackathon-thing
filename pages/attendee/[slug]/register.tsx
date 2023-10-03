import {
  Button,
  Card,
  Drawer,
  Fieldset,
  Grid,
  Input,
  Page,
  Text,
  useToasts,
} from "@geist-ui/core";
import type {
  InferGetServerSidePropsType,
  GetServerSideProps,
  GetServerSidePropsContext,
  GetServerSidePropsResult,
} from "next";
import prisma from "@/lib/prisma";
import { NextApiRequest } from "next";
import { NextServerOptions } from "next/dist/server/next";

import { useRouter } from "next/router";
import type { Hackathon, Attendee, AttendeeAttribute } from "@prisma/client";
import { Form } from "@/components/Form";
import type { FormElement } from "@/components/Form";
import React, { useState } from "react";
import type { ReactElement } from "react";
import Link from "next/link";
import AttendeeLayout from "@/components/layouts/attendee/AttendeeLayout";

export default function Attendee({
  hackathon,
}: {
  hackathon: (Hackathon & { attendeeAttributes: AttendeeAttribute[] }) | null;
}): any {
  if (!hackathon) {
    return (
      <>
        <div>404: Hackathon Not Found!</div>
      </>
    );
  }

  const { setToast } = useToasts();
  const router = useRouter();
  const transformAPIURL = (path: string) =>
    router.asPath.startsWith("/attendee/")
      ? `/api/attendee/${hackathon?.slug}${path}`
      : `/api/${path}`;

  return (
    <>
      <div>
        <h1>Register</h1>
        <Form
          schema={{
            elements: [
              {
                type: "email",
                label: "Email",
                name: "email",
                placeholder: "fiona@hackathon.zip",
                required: true,
              },
              {
                type: "text",
                label: "Name",
                name: "name",
                placeholder: "Fiona Hackworth",
                required: true,
              },
              ...hackathon.attendeeAttributes.map(
                (x) =>
                  ({
                    ...x,
                    label: x.name,
                    name: x.id,
                  }) as FormElement,
              ),
            ],
          }}
          clearValuesOnSuccesfulSubmit={true}
          submission={{
            type: "controlled",
            onSubmit: async (data) => {
              let res = await fetch(transformAPIURL("/register"), {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  ...data,
                }),
              }).then((r) => r.json());
              if (res.error) {
                setToast({ text: res.error, delay: 2000 });
                return false;
              } else {
                setToast({
                  text: "You're signed up. Please check your email for information about accessing the attendee portal, thanks!",
                  delay: 10000,
                });
                return true;
              }
            },
          }}
        />
      </div>
    </>
  );
}

Attendee.getLayout = function getLayout(
  page: ReactElement,
  props: { hackathon: Hackathon | null; attendee: Attendee | null },
) {
  return (
    <AttendeeLayout hackathon={props.hackathon} attendee={props.attendee}>
      {page}
    </AttendeeLayout>
  );
};

export const getServerSideProps = (async (
  context: GetServerSidePropsContext,
) => {
  if (context.params?.slug) {
    const hackathon = await prisma.hackathon.findUnique({
      where: {
        slug: context.params?.slug.toString(),
      },
      include: {
        attendeeAttributes: true,
      },
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
                token: token,
              },
            },
          },
        });
        if (attendee) {
          context.res.setHeader(
            "location",
            context.resolvedUrl.replace(/\/$/, "").replace("/register", ""),
          );
          context.res.statusCode = 302;
          context.res.end();
          return {
            props: {
              hackathon: null,
              attendee: null,
            },
          };
        }
      }
      return {
        props: {
          hackathon: hackathon,
          attendee: attendee,
        },
      };
    }
  }
  return {
    props: {
      hackathon: null,
      attendee: null,
    },
  };
}) satisfies GetServerSideProps<{
  hackathon: Hackathon | null;
  attendee: Attendee | null;
}>;
