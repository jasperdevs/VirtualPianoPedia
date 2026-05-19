import { useState } from "react";
import type React from "react";
import { ArrowUpRightIcon, ClipboardTextIcon, DownloadSimpleIcon, FileArrowUpIcon, GithubLogoIcon, MagicWandIcon, PlayIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SheetPlayer } from "@/components/SheetPlayer";
import { convertInput, type ConversionResult } from "@/lib/converter";
import { cn } from "@/lib/utils";

export function ConverterPage() {
  const [text, setText] = useState("C4 D4 E4 G4 A4\nC5 B4 A4 G4");
  const [transpose, setTranspose] = useState(0);
  const [sustain, setSustain] = useState(true);
  const [groupChords, setGroupChords] = useState(true);
  const [includeTiming, setIncludeTiming] = useState(false);
  const [fileName, setFileName] = useState("converted-sheet.md");
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState("");

  async function handleConvert(input: string | ArrayBuffer, name = "converted-sheet.md") {
    setError("");
    try {
      const converted = await convertInput(input, name, { transpose, sustain, groupChords, includeTiming });
      setResult(converted);
      setFileName(`${converted.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "converted-sheet"}.md`);
    } catch (conversionError) {
      setError(conversionError instanceof Error ? conversionError.message : "Could not convert that file.");
    }
  }

  function downloadMarkdown() {
    if (!result) return;
    const blob = new Blob([result.markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Convert MIDI into a playable sheet.</h1>
        <p className="mt-4 text-muted-foreground">
          Drop a MIDI file or paste notes. VirtualPianoPedia maps notes, applies transpose, groups chords, previews playback, and outputs PR-ready markdown.
        </p>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-5">
          <section className="rounded-[1.5rem] bg-muted/50 p-4 sm:p-5">
            <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-[1.25rem] bg-background p-6 text-center transition hover:scale-[0.99]">
              <FileArrowUpIcon className="mb-4 size-10 text-muted-foreground" />
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
            </label>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Transpose">
                <Input type="number" value={transpose} onChange={(event) => setTranspose(Number(event.target.value))} />
              </Field>
              <div className="grid gap-2">
                <Toggle enabled={sustain} onChange={setSustain} label="Mark sustain" />
                <Toggle enabled={groupChords} onChange={setGroupChords} label="Group chords" />
                <Toggle enabled={includeTiming} onChange={setIncludeTiming} label="Timing hints" />
              </div>
            </div>
          </section>

          <section className="rounded-[1.5rem] bg-muted/50 p-4 sm:p-5">
            <Field label="Paste notes">
              <Textarea value={text} onChange={(event) => setText(event.target.value)} className="min-h-36 bg-background font-mono" />
            </Field>
            <Button className="mt-4 w-full" onClick={() => handleConvert(text, "pasted-sheet.md")}>
              <MagicWandIcon />
              Generate sheet
            </Button>
            {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
          </section>
        </div>

        <section className="rounded-[1.5rem] bg-muted/50 p-4 sm:p-5">
          {result ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">{result.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {result.noteCount} notes · {result.duration}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(result.markdown)}>
                    <ClipboardTextIcon />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadMarkdown}>
                    <DownloadSimpleIcon />
                    Download
                  </Button>
                </div>
              </div>
              <SheetPlayer sheet={result.sheet} />
              <Textarea value={result.markdown} readOnly className="min-h-[430px] bg-background font-mono" />
              <Button asChild className="w-full">
                <a href="https://github.com/jasperdevs/VirtualPianoPedia/new/main/src/content/sheets" target="_blank" rel="noreferrer">
                  <GithubLogoIcon />
                  Open GitHub PR path
                  <ArrowUpRightIcon />
                </a>
              </Button>
            </div>
          ) : (
            <div className="flex min-h-[680px] flex-col items-center justify-center rounded-[1.25rem] bg-background px-6 text-center">
              <PlayIcon className="mb-5 size-12 text-muted-foreground" />
              <h2 className="text-2xl font-semibold tracking-tight">Awaiting input</h2>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">Upload MIDI or generate from pasted notes to preview, copy, and submit a sheet.</p>
            </div>
          )}
        </section>
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

function Toggle({ enabled, onChange, label }: { enabled: boolean; onChange: (enabled: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className="flex items-center justify-between rounded-lg bg-background px-3 py-2 text-sm transition active:scale-[0.98]"
    >
      {label}
      <span className={cn("h-5 w-9 rounded-full p-0.5 transition", enabled ? "bg-foreground" : "bg-muted")}>
        <span className={cn("block size-4 rounded-full bg-background transition-transform", enabled && "translate-x-4")} />
      </span>
    </button>
  );
}
