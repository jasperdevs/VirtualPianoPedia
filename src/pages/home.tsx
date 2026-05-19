import { useState } from "react";
import type React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, FileText, Gauge, Search, Timer, WandSparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCategories, sheets } from "@/lib/sheets";
import { cn } from "@/lib/utils";

const difficulties = ["All", "Beginner", "Intermediate", "Advanced"] as const;

export function HomePage() {
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<(typeof difficulties)[number]>("All");
  const categories = getCategories();

  const needle = query.toLowerCase().trim();
  const filteredSheets = sheets.filter((sheet) => {
    const matchesQuery =
      !needle || [sheet.title, sheet.artist, sheet.game, sheet.category, ...sheet.tags].some((value) => value.toLowerCase().includes(needle));
    const matchesDifficulty = difficulty === "All" || sheet.difficulty === difficulty;
    return matchesQuery && matchesDifficulty;
  });

  return (
    <>
      <section className="border-b">
        <div className="container grid min-h-[520px] items-center gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
          <div className="max-w-2xl">
            <Badge variant="outline" className="mb-5">
              Markdown-powered sheet library
            </Badge>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[0.98] tracking-normal sm:text-6xl lg:text-7xl">
              Roblox virtual piano sheets, kept clean.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              RVPS is just sheets: searchable pages generated from GitHub markdown, with a converter for making new submissions fast.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/converter">
                  <WandSparkles />
                  Convert a sheet
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="https://github.com/jasperdevs/RVPS/new/main/src/content/sheets?filename=new-sheet.md" target="_blank" rel="noreferrer">
                  Add on GitHub
                  <ArrowUpRight />
                </a>
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 -z-10 rounded-[2rem] bg-muted" />
            <div className="rounded-[2rem] border bg-card p-4 shadow-border">
              <div className="flex items-center gap-2 border-b pb-3">
                <span className="size-3 rounded-full bg-foreground" />
                <span className="size-3 rounded-full bg-muted-foreground/40" />
                <span className="size-3 rounded-full bg-muted-foreground/20" />
              </div>
              <div className="space-y-3 pt-5 font-mono text-sm leading-7">
                <div className="text-muted-foreground">written-on-the-sky.md</div>
                <div className="rounded-lg bg-muted p-4">
                  <div>---</div>
                  <div>title: Written on the Sky</div>
                  <div>artist: Max Richter</div>
                  <div>difficulty: Intermediate</div>
                  <div>---</div>
                </div>
                <pre className="overflow-hidden rounded-lg bg-background p-4 text-foreground">
{`[6p] a [0tp] a p a [0ts] d
5 o [0rd] o d o [0rd] o
3 p [8wo] p o p [8wa] s`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-12">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase text-muted-foreground">Library</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal">Browse sheets</h2>
          </div>
          <div className="relative w-full lg:w-[360px]">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search songs, artists, tags..." className="pl-9" />
          </div>
        </div>

        <Tabs defaultValue="All" value={difficulty} onValueChange={(value) => setDifficulty(value as typeof difficulty)}>
          <TabsList className="mb-6 flex h-auto flex-wrap justify-start">
            {difficulties.map((item) => (
              <TabsTrigger key={item} value={item}>
                {item}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((category) => (
            <Badge key={category} variant="secondary">
              {category}
            </Badge>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredSheets.map((sheet) => (
            <Link key={sheet.slug} to={`/sheet/${sheet.slug}`} className="group">
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <Badge variant="outline">{sheet.category}</Badge>
                    <ArrowUpRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                  <CardTitle>{sheet.title}</CardTitle>
                  <CardDescription>{sheet.artist}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <Metric icon={<Gauge />} label={sheet.difficulty} />
                    <Metric icon={<Timer />} label={`${sheet.tempo} bpm`} />
                    <Metric icon={<FileText />} label={sheet.length} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {sheet.tags.map((tag) => (
                      <span key={tag} className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

function Metric({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className={cn("flex min-h-16 flex-col justify-between rounded-lg border bg-background p-3 text-muted-foreground")}>
      <div className="[&_svg]:size-4">{icon}</div>
      <div className="text-xs font-medium text-foreground">{label}</div>
    </div>
  );
}
