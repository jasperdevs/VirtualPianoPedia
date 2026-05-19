import { Link, Navigate, useParams } from "react-router-dom";
import type React from "react";
import { ArrowLeft, Copy, Github, Gauge, Music2, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getSheet } from "@/lib/sheets";

export function SheetPage() {
  const { slug } = useParams();
  const sheet = slug ? getSheet(slug) : undefined;

  if (!sheet) return <Navigate to="/" replace />;

  const rawUrl = `https://github.com/jasperdevs/RVPS/blob/main/src/content/sheets/${sheet.slug}.md`;

  return (
    <section className="container py-10">
      <Button asChild variant="ghost" className="-ml-3 mb-6">
        <Link to="/">
          <ArrowLeft />
          Back
        </Link>
      </Button>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="mb-5 flex flex-wrap gap-2">
            <Badge>{sheet.difficulty}</Badge>
            <Badge variant="secondary">{sheet.category}</Badge>
            <Badge variant="outline">{sheet.game}</Badge>
          </div>
          <h1 className="max-w-4xl text-4xl font-semibold tracking-normal sm:text-5xl">{sheet.title}</h1>
          <p className="mt-3 font-serif text-2xl italic text-muted-foreground">{sheet.artist}</p>

          <div className="mt-8 overflow-hidden rounded-lg border bg-card">
            <div className="flex items-center justify-between gap-3 border-b bg-muted/50 px-4 py-3">
              <span className="font-mono text-sm text-muted-foreground">{sheet.slug}.md</span>
              <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(sheet.body)}>
                <Copy />
                Copy
              </Button>
            </div>
            <pre className="max-h-[720px] overflow-auto p-5 font-mono text-sm leading-7 text-foreground">{sheet.body}</pre>
          </div>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardContent className="space-y-4 pt-5">
              <Info icon={<Gauge />} label="Difficulty" value={sheet.difficulty} />
              <Info icon={<Timer />} label="Tempo" value={`${sheet.tempo} bpm`} />
              <Info icon={<Music2 />} label="Transpose" value={String(sheet.transpose)} />
              <Separator />
              <Button asChild className="w-full">
                <a href={rawUrl} target="_blank" rel="noreferrer">
                  <Github />
                  Edit on GitHub
                </a>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </section>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="[&_svg]:size-4">{icon}</span>
        {label}
      </div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
