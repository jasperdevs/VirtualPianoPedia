import { useMemo, useState } from "react";
import type React from "react";
import { motion } from "framer-motion";
import { ArrowUpRightIcon, DownloadSimpleIcon, FileArrowUpIcon, GithubLogoIcon, MagicWandIcon, PlayIcon } from "@phosphor-icons/react";
import { FluidButton } from "@/components/fluid/FluidButton";
import { FluidCopy } from "@/components/fluid/FluidCopy";
import { FluidInput } from "@/components/fluid/FluidInput";
import { FluidPanel } from "@/components/fluid/FluidPanel";
import { FluidSwitch } from "@/components/fluid/FluidSwitch";
import { FluidTextarea } from "@/components/fluid/FluidTextarea";
import { SheetPlayer } from "@/components/SheetPlayer";
import { convertInput, type ConversionResult } from "@/lib/converter";

export function ConverterPage() {
  const [text, setText] = useState("C4 D4 E4 G4 A4\nC5 B4 A4 G4");
  const [transpose, setTranspose] = useState(0);
  const [sustain, setSustain] = useState(true);
  const [groupChords, setGroupChords] = useState(true);
  const [includeTiming, setIncludeTiming] = useState(false);
  const [fileName, setFileName] = useState("converted-sheet.txt");
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [folderSlug, setFolderSlug] = useState("");
  const [variantFile, setVariantFile] = useState("normal.md");
  const [metaMarkdown, setMetaMarkdown] = useState("");
  const [variantMarkdown, setVariantMarkdown] = useState("");
  const [error, setError] = useState("");

  const editedMarkdown = useMemo(() => {
    if (!result) return "";
    const safeFolder = folderSlug.trim() || result.folderSlug;
    const safeVariantFile = variantFile.trim() || "normal.md";
    return `# src/content/sheets/${safeFolder}/_meta.md\n\n${metaMarkdown.trimEnd()}\n\n# src/content/sheets/${safeFolder}/${safeVariantFile}\n\n${variantMarkdown.trimEnd()}\n`;
  }, [folderSlug, metaMarkdown, result, variantFile, variantMarkdown]);

  const editedNoteCount = useMemo(() => variantMarkdown.split(/\s+/).filter(Boolean).length, [variantMarkdown]);

  async function handleConvert(input: string | ArrayBuffer, name = "converted-sheet.md") {
    setError("");
    try {
      const converted = await convertInput(input, name, { transpose, sustain, groupChords, includeTiming });
      setResult(converted);
      setFolderSlug(converted.folderSlug);
      setVariantFile("normal.md");
      setMetaMarkdown(converted.metaMarkdown);
      setVariantMarkdown(converted.variantMarkdown);
      setFileName(`${converted.folderSlug}-files.txt`);
    } catch (conversionError) {
      setError(conversionError instanceof Error ? conversionError.message : "Could not convert that file.");
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
        <div className="border-b border-border/70 pb-5">
          <div className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Tool</div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Converter</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Drop MIDI or paste notes, preview the result, then edit the GitHub files.</p>
        </div>

      <div className="mt-5 grid min-w-0 gap-5 lg:grid-cols-[400px_minmax(0,1fr)]">
        <div className="min-w-0 space-y-5">
          <FluidPanel className="overflow-hidden border border-border/70 bg-card p-4 sm:p-5">
            <motion.label
              className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl bg-background/60 p-5 text-center ring-1 ring-border/50 transition-colors hover:bg-background"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.99 }}
              transition={{ type: "spring", stiffness: 520, damping: 36 }}
            >
              <FileArrowUpIcon className="mb-3 size-9 text-muted-foreground" />
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

            <div className="mt-4 grid gap-3">
              <Field label="Transpose">
                <FluidInput type="number" value={transpose} onChange={(event) => setTranspose(Number(event.target.value))} />
              </Field>
              <div className="grid gap-2 rounded-2xl bg-background/35 p-2">
                <FluidSwitch enabled={sustain} onChange={setSustain} label="Sustain" hint="Keep held notes longer" />
                <FluidSwitch enabled={groupChords} onChange={setGroupChords} label="Chords" hint="Merge notes that start together" />
                <FluidSwitch enabled={includeTiming} onChange={setIncludeTiming} label="Timing hints" hint="Show rough rests" />
              </div>
            </div>
          </FluidPanel>

          <FluidPanel className="overflow-hidden border border-border/70 bg-card p-4 sm:p-5">
            <Field label="Paste notes">
              <FluidTextarea value={text} onChange={(event) => setText(event.target.value)} className="min-h-28 font-mono" />
            </Field>
            <FluidButton className="mt-4 w-full" onClick={() => handleConvert(text, "pasted-sheet.md")}>
              <MagicWandIcon />
              Generate sheet
            </FluidButton>
            {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
          </FluidPanel>
        </div>

        <FluidPanel className="min-w-0 border border-border/70 bg-card p-4 sm:p-5">
          {result ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">{result.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {editedNoteCount} notes · {result.duration}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <FluidCopy value={editedMarkdown} />
                  <FluidButton variant="outline" size="sm" onClick={downloadMarkdown}>
                    <DownloadSimpleIcon />
                    Download
                  </FluidButton>
                </div>
              </div>
              <SheetPlayer sheet={variantMarkdown} />
              <div className="grid gap-3">
                <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
                  <Field label="Folder">
                    <FluidInput value={folderSlug} onChange={(event) => setFolderSlug(event.target.value)} />
                  </Field>
                  <Field label="Sheet file">
                    <FluidInput value={variantFile} onChange={(event) => setVariantFile(event.target.value)} />
                  </Field>
                </div>
                <Field label="_meta.md">
                  <FluidTextarea value={metaMarkdown} onChange={(event) => setMetaMarkdown(event.target.value)} className="min-h-40 font-mono" />
                </Field>
                <Field label={variantFile || "normal.md"}>
                  <FluidTextarea value={variantMarkdown} onChange={(event) => setVariantMarkdown(event.target.value)} className="min-h-52 font-mono" />
                </Field>
              </div>
              <FluidButton asChild className="w-full">
                <a href={`https://github.com/jasperdevs/VirtualPianoPedia/new/main/src/content/sheets/${encodeURIComponent(folderSlug || result.folderSlug)}?filename=_meta.md`} target="_blank" rel="noreferrer">
                  <GithubLogoIcon />
                  Create folder on GitHub
                  <ArrowUpRightIcon />
                </a>
              </FluidButton>
            </div>
          ) : (
            <div className="flex min-h-[430px] flex-col items-center justify-center rounded-2xl bg-muted/25 px-6 text-center">
              <PlayIcon className="mb-5 size-12 text-muted-foreground" />
              <h2 className="text-2xl font-semibold tracking-tight">No sheet yet</h2>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">Upload MIDI or generate from pasted notes to preview and edit the output.</p>
            </div>
          )}
        </FluidPanel>
      </div>
      </div>
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
