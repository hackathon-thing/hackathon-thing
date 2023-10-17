import { useMyHackathons } from "@/hooks/data/hackathons";
import { useTheme } from "@/hooks/useTheme";
import useUrlState from "@/hooks/useUrlState";
import { Button, Popover, Spinner, Text } from "@geist-ui/core";
import { ChevronUpDown } from "@geist-ui/react-icons";
import { Hackathon } from "@prisma/client";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar, { NavbarTabs } from "./Navbar";

export default function HackathonLayout({
  children
}: {
  children: React.ReactNode;
}) {
  console.log("Call to HackathonLayout");

  const { hackathon: activeHackathonSlug, feature: f } = useUrlState([
    "hackathon",
    "feature"
  ]);

  const { hackathons, isLoading, isError } = useMyHackathons();

  const activeHackathon = hackathons.find(
    (h: Hackathon) => h.slug === activeHackathonSlug
  );

  const [feature, setFeature] = useState<string>();

  const [breadcrumbs, setBreadcrumbs] = useState<
    { value: React.ReactNode; href?: string }[]
  >([]);

  const { theme } = useTheme();

  useEffect(() => {
    setFeature(f);

    setBreadcrumbs(
      f
        ? [
            {
              value: NavbarTabs.find((t) => t.value === f)?.label
            }
          ]
        : []
    );
  }, [f]);

  return (
    <div
      style={{
        width: "calc(100vw - (100vw - 100%))",
        height: "100vh",
        display: "flex",
        flexDirection: "column"
      }}
    >
      <Head>
        <title>{activeHackathon?.name} - Hackathon.zip</title>
      </Head>
      <Navbar
        breadcrumbs={[
          {
            value: (
              <Popover
                content={
                  !isLoading ? (
                    ((
                      <>
                        <Popover.Item title>
                          <span>{activeHackathon?.name}</span>
                        </Popover.Item>
                        {hackathons
                          .filter(
                            (h: Hackathon) => h.slug !== activeHackathonSlug
                          )
                          .map((h: Hackathon) => (
                            <Popover.Item>
                              <Link href={`/${h.slug}/${feature || ""}`}>
                                {h.name}
                              </Link>
                            </Popover.Item>
                          ))}
                      </>
                    ) as any)
                  ) : (
                    <Spinner />
                  )
                }
              >
                <Button icon={<ChevronUpDown />} iconRight auto scale={2 / 3}>
                  {isLoading ? <Spinner /> : activeHackathon?.name}
                </Button>
              </Popover>
            )
          },
          ...breadcrumbs
        ]}
      />

      <div
        className={`${
          theme === "light" ? "bg-slate-50" : "bg-slate-950"
        } w-[calc(100vw-(100vw-100%))] h-auto flex-grow`}
      >
        {children}
      </div>
      <div
        className={`${
          theme === "light" ? "bg-slate-50" : "bg-slate-950"
        } text-center p-2`}
      >
        <Text p small className="max-w-[750px] m-auto">
          Built by hackathon organizers for hackathon organizers; open sourced
          at{" "}
          <Link href="https://github.com/hackathon-zip" target="_blank">
            github.com/hackathon-zip
          </Link>
          .
        </Text>
      </div>
    </div>
  );
}
