import { useMemo, useState } from "react";
import type React from "react";
import { motion } from "framer-motion";
import { ArrowUpRightIcon, DownloadSimpleIcon, FileArrowUpIcon, GithubLogoIcon, MagicWandIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { FluidButton } from "@/components/fluid/FluidButton";
import { FluidCopy } from "@/components/fluid/FluidCopy";
import { FluidInput } from "@/components/fluid/FluidInput";
import { FluidPanel } from "@/components/fluid/FluidPanel";
import { FluidSwitch } from "@/components/fluid/FluidSwitch";
import { FluidTabs } from "@/components/fluid/FluidTabs";
import { FluidTextarea } from "@/components/fluid/FluidTextarea";
import { convertInput, createMetaMarkdown, type ConversionMeta, type ConversionResult } from "@/lib/converter";
import { difficultyTiers, type DifficultyTier } from "@/lib/sheets";
import { cn } from "@/lib/utils";

const defaultMeta: ConversionMeta = {
  title: "Converted Sheet",
  artist: "Unknown",
  game: "Roblox Virtual Piano",
  category: "Pop",
  tempo: 100,
  length: "00:00",
  transpose: 0,
  source: "Converter submission",
  tags: ["submission"],
};

export function ConverterPage() {
  const [text, setText] = useState("C4 D4 E4 G4 A4\nC5 B4 A4 G4");
  const [transpose, setTranspose] = useState(0);
  const [sustain, setSustain] = useState(true);
  const [groupChords, setGroupChords] = useState(true);
  const [includeTiming, setIncludeTiming] = useState(false);
  const [fileName, setFileName] = useState("converted-sheet-files.txt");
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [artistFolder, setArtistFolder] = useState("unknown");
  const [folderSlug, setFolderSlug] = useState("converted-sheet");
  const [variantTier, setVariantTier] = useState<DifficultyTier>("Normal");
  const [meta, setMeta] = useState<ConversionMeta>(defaultMeta);
  const [variantMarkdown, setVariantMarkdown] = useState("");
  const [error, setError] = useState("");

  const metaMarkdown = useMemo(() => createMetaMarkdown(meta), [meta]);
  const variantFile = `${variantTier.toLowerCase()}.md`;

  const editedMarkdown = useMemo(() => {
    if (!result) return "";
    const safeArtist = artistFolder.trim() || "unknown";
    const safeFolder = folderSlug.trim() || result.folderSlug;
    return `# src/content/sheets/${safeArtist}/${safeFolder}/_meta.md\n\n${metaMarkdown.trimEnd()}\n\n# src/content/sheets/${safeArtist}/${safeFolder}/${variantFile}\n\n${variantMarkdown.trimEnd()}\n`;
  }, [artistFolder, folderSlug, metaMarkdown, result, variantFile, variantMarkdown]);

  const editedNoteCount = useMemo(() => variantMarkdown.split(/\s+/).filter(Boolean).length, [variantMarkdown]);

  async function handleConvert(input: string | ArrayBuffer, name = "converted-sheet.md") {
    setError("");
    try {
      const converted = await convertInput(input, name, { transpose, sustain, groupChords, includeTiming });
      setResult(converted);
      setMeta(converted.meta);
      setArtistFolder(slugify(converted.meta.artist));
      setFolderSlug(converted.folderSlug);
      setVariantTier("Normal");
      setVariantMarkdown(converted.variantMarkdown);
      setFileName(`${converted.folderSlug}-files.txt`);
    } catch (conversionError) {
      setError(conversionError instanceof Error ? conversionError.message : "Could not convert that file.");
    }
  }

  function updateMeta<K extends keyof ConversionMeta>(field: K, value: ConversionMeta[K]) {
    setMeta((current) => ({ ...current, [field]: value }));
    if (field === "artist" && artistFolder === "unknown" && typeof value === "string") {
      setArtistFolder(slugify(value));
    }
    if (field === "title" && (!folderSlug || folderSlug === result?.folderSlug) && typeof value === "string") {
      setFolderSlug(slugify(value));
    }
  }

  function downloadMarkdown() {
    if (!result) return;
    const blob = new Blob([editedMarkdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="min-h-[calc(100dvh-4rem)] bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1180px] min-w-0">
        <div className="pb-5">
          <h1 className="text-3xl font-semibold sm:text-4xl">Converter</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Drop in a MIDI or paste notes. The converter maps MIDI pitches into Roblox virtual piano keys, then gives you the files for GitHub.</p>
        </div>

        <div className="mt-2 grid min-w-0 gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
          <FluidPanel className="min-w-0 overflow-hidden bg-card p-4 sm:p-5 lg:self-start">
            <div className="grid gap-4">
              <motion.label
                className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl bg-background/60 p-5 text-center ring-1 ring-border/40 transition-colors hover:bg-background"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.99 }}
                transition={{ type: "spring", stiffness: 520, damping: 36 }}
              >
                <FileArrowUpIcon className="mb-3 size-8 text-muted-foreground" />
                <span className="font-semibold">Upload MIDI or text</span>
                <span className="mt-1 text-sm text-muted-foreground">.mid, .midi, .txt, or .md</span>
                <input
                  className="sr-only"
                  type="file"
                  accept=".mid,.midi,text/plain,.txt,.md"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const value = /\.midi?$/i.test(file.name) ? await file.arrayBuffer() : await file.text();
                    await handleConvert(value, file.name);
                  }}
                />
              </motion.label>

              <Field label="Paste notes">
                <FluidTextarea value={text} onChange={(event) => setText(event.target.value)} className="min-h-24 font-mono" spellCheck={false} />
              </Field>

              <div className="grid grid-cols-[1fr_auto] gap-3">
                <Field label="Transpose">
                  <FluidInput type="number" value={transpose} onChange={(event) => setTranspose(Number(event.target.value))} />
                </Field>
                <div className="self-end">
                  <FluidButton className="h-11" onClick={() => handleConvert(text, "pasted-sheet.md")}>
                    <MagicWandIcon />
                    Generate
                  </FluidButton>
                </div>
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}

              <div className="grid gap-2 rounded-2xl bg-background/35 p-2">
                <FluidSwitch enabled={sustain} onChange={setSustain} label="Sustain" hint="Mark long notes with -" />
                <FluidSwitch enabled={groupChords} onChange={setGroupChords} label="Chords" hint="Group same-time notes in brackets" />
                <FluidSwitch enabled={includeTiming} onChange={setIncludeTiming} label="Timing hints" hint="Add rough rest markers" />
              </div>
            </div>
          </FluidPanel>

          <FluidPanel className="min-w-0 bg-card p-4 sm:p-5">
            {result ? (
              <div className="space-y-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">Converted sheet</p>
                    <h2 className="mt-1 truncate text-2xl font-semibold">{meta.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {editedNoteCount} notes · {meta.length} · {meta.tempo} bpm
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <FluidCopy value={editedMarkdown} />
                    <FluidButton variant="outline" size="sm" onClick={downloadMarkdown}>
                      <DownloadSimpleIcon />
                      Download
                    </FluidButton>
                  </div>
                </div>

                {result.warnings.length ? (
                  <div className="grid gap-2 rounded-2xl bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-200">
                    {result.warnings.map((warning) => (
                      <div key={warning} className="flex gap-2">
                        <WarningCircleIcon className="mt-0.5 size-4 shrink-0" />
                        <span>{warning}</span>
                      </div>
                    ))}
                  </div>
                ) : null}

                <Section title="Song info">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Title">
                      <FluidInput value={meta.title} onChange={(event) => updateMeta("title", event.target.value)} />
                    </Field>
                    <Field label="Artist or composer">
                      <FluidInput value={meta.artist} onChange={(event) => updateMeta("artist", event.target.value)} />
                    </Field>
                    <Field label="Category">
                      <FluidInput value={meta.category} onChange={(event) => updateMeta("category", event.target.value)} />
                    </Field>
                    <Field label="Game">
                      <FluidInput value={meta.game} onChange={(event) => updateMeta("game", event.target.value)} />
                    </Field>
                    <Field label="Target length">
                      <FluidInput value={meta.length} onChange={(event) => updateMeta("length", event.target.value)} />
                    </Field>
                    <Field label="Tempo">
                      <FluidInput type="number" value={meta.tempo} onChange={(event) => updateMeta("tempo", Number(event.target.value))} />
                    </Field>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-[140px_1fr]">
                    <Field label="Transpose">
                      <FluidInput type="number" value={meta.transpose} onChange={(event) => updateMeta("transpose", Number(event.target.value))} />
                    </Field>
                    <Field label="Tags">
                      <FluidInput value={meta.tags.join(", ")} onChange={(event) => updateMeta("tags", event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean))} />
                    </Field>
                  </div>
                </Section>

                <Section title="Sheet text" right={<FluidTabs items={[...difficultyTiers]} value={variantTier} onChange={setVariantTier} />}>
                  <FluidTextarea value={variantMarkdown} onChange={(event) => setVariantMarkdown(event.target.value)} className="min-h-80 font-mono leading-6" spellCheck={false} />
                </Section>

                <details className="group rounded-2xl bg-background/35 p-3 ring-1 ring-border/40">
                  <summary className="cursor-pointer select-none text-sm font-medium text-muted-foreground transition group-open:text-foreground">GitHub file names</summary>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Field label="Artist folder">
                      <FluidInput value={artistFolder} onChange={(event) => setArtistFolder(slugify(event.target.value))} />
                    </Field>
                    <Field label="Song folder">
                      <FluidInput value={folderSlug} onChange={(event) => setFolderSlug(slugify(event.target.value))} />
                    </Field>
                    <Field label="Sheet file">
                      <FluidInput value={variantFile} readOnly />
                    </Field>
                    <Field label="Source">
                      <FluidInput value={meta.source} onChange={(event) => updateMeta("source", event.target.value)} />
                    </Field>
                  </div>
                </details>

                <FluidButton asChild className="w-full">
                  <a href={`https://github.com/jasperdevs/VirtualPianoPedia/new/main/src/content/sheets/${encodeURIComponent(artistFolder || "unknown")}/${encodeURIComponent(folderSlug || result.folderSlug)}?filename=_meta.md`} target="_blank" rel="noreferrer">
                    <GithubLogoIcon />
                    Start on GitHub
                    <ArrowUpRightIcon />
                  </a>
                </FluidButton>
              </div>
            ) : (
              <div className="flex min-h-[430px] flex-col items-center justify-center rounded-2xl bg-muted/25 px-6 text-center">
                <MagicWandIcon className="mb-5 size-12 text-muted-foreground" />
                <h2 className="text-2xl font-semibold">No sheet yet</h2>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">Upload MIDI or generate from pasted notes to edit the output.</p>
              </div>
            )}
          </FluidPanel>
        </div>
      </div>
    </section>
  );
}

function Section({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-background/25 p-3 ring-1 ring-border/40">
      <div className={cn("mb-3 flex gap-3", right ? "flex-col sm:flex-row sm:items-center sm:justify-between" : "items-center")}>
        <h3 className="text-sm font-semibold">{title}</h3>
        {right}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
