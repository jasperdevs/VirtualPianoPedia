import { useState } from "react";
import type React from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeftIcon, ClipboardTextIcon, GithubLogoIcon, GaugeIcon, MetronomeIcon, MusicNoteIcon } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SheetPlayer } from "@/components/SheetPlayer";
import { getSheet, tierClass } from "@/lib/sheets";
import { cn } from "@/lib/utils";

export function SheetPage() {
  const { slug } = useParams();
  const sheet = slug ? getSheet(slug) : undefined;
  const [variantIndex, setVariantIndex] = useState(0);

  if (!sheet) return <Navigate to="/" replace />;

  const activeVariant = sheet.variants[variantIndex] ?? sheet.variants[0];
  const rawUrl = `https://github.com/jasperdevs/VirtualPianoPedia/blob/main/src/content/sheets/${sheet.slug}.md`;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <Button asChild variant="ghost" className="-ml-3 mb-8">
        <Link to="/">
          <ArrowLeftIcon />
          Back
        </Link>
      </Button>

      <div className="grid gap-8 lg:grid-cols-[1fr_330px]">
        <div className="min-w-0">
          <div className="mb-5 flex flex-wrap gap-2">
            <Badge>{sheet.category}</Badge>
            <Badge variant="secondary">{sheet.game}</Badge>
            {sheet.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
          <h1 className="max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl">{sheet.title}</h1>
          <p className="mt-3 text-xl text-muted-foreground">{sheet.artist}</p>

          <div className="mt-8 flex flex-wrap gap-2">
            {sheet.variants.map((variant, index) => (
              <button
                key={variant.tier}
                type="button"
                onClick={() => setVariantIndex(index)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition active:scale-[0.98]",
                  variantIndex === index ? tierClass(variant.tier) : "bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                {variant.tier}
              </button>
            ))}
          </div>

          <SheetPlayer sheet={activeVariant.body} className="mt-6" />

          <div className="mt-6 overflow-hidden rounded-[1.25rem] bg-muted/45">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <span className={cn("rounded-md px-2 py-1 text-xs font-medium", tierClass(activeVariant.tier))}>{activeVariant.tier}</span>
              <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(activeVariant.body)}>
                <ClipboardTextIcon />
                Copy
              </Button>
            </div>
            <pre className="max-h-[720px] overflow-auto px-5 pb-5 pt-2 font-mono text-sm leading-7 text-foreground">{activeVariant.body}</pre>
          </div>
        </div>

        <aside className="space-y-3 lg:pt-28">
          <Info icon={<GaugeIcon />} label="Default level" value={sheet.difficulty} />
          <Info icon={<MetronomeIcon />} label="Tempo" value={`${sheet.tempo} bpm`} />
          <Info icon={<MusicNoteIcon />} label="Transpose" value={String(sheet.transpose)} />
          <div className="pt-3">
            <Button asChild className="w-full">
              <a href={rawUrl} target="_blank" rel="noreferrer">
                <GithubLogoIcon />
                Edit on GitHub
              </a>
            </Button>
          </div>
        </aside>
      </div>
    </section>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/55 p-3 text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="[&_svg]:size-4">{icon}</span>
        {label}
      </div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
