import { useState } from "react";
import { ArrowUpRight, Download, FileUp, Github, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { convertInput } from "@/lib/converter";

export function ConverterPage() {
  const [text, setText] = useState("C4 D4 E4 G4 A4\nC5 B4 A4 G4");
  const [transpose, setTranspose] = useState(0);
  const [sustain, setSustain] = useState(true);
  const [groupChords, setGroupChords] = useState(true);
  const [fileName, setFileName] = useState("converted-sheet.md");
  const [output, setOutput] = useState("");

  async function handleConvert(input: string | ArrayBuffer, name = "converted-sheet.md") {
    const result = await convertInput(input, name, { transpose, sustain, groupChords });
    setOutput(result.markdown);
    setFileName(`${result.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "converted-sheet"}.md`);
  }

  function downloadMarkdown() {
    const blob = new Blob([output], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="container py-10">
      <div className="mb-8 max-w-3xl">
        <p className="text-sm font-medium uppercase text-muted-foreground">Converter</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-normal sm:text-5xl">Make a virtual piano sheet fast.</h1>
        <p className="mt-4 text-muted-foreground">
          Drop MIDI or paste note names. RVPS auto-detects MIDI files, maps notes to Roblox virtual piano keys, applies transpose, marks longer held notes, and outputs the markdown file this site needs.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Input</CardTitle>
              <CardDescription>MIDI files work best. Plain note text also works.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center transition hover:bg-muted/50">
                <FileUp className="mb-3 size-8 text-muted-foreground" />
                <span className="font-medium">Drop in a .mid file</span>
                <span className="mt-1 text-sm text-muted-foreground">or click to choose one</span>
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

              <Textarea value={text} onChange={(event) => setText(event.target.value)} className="min-h-44 font-mono" />
              <Button onClick={() => handleConvert(text, "pasted-sheet.md")}>
                <WandSparkles />
                Convert pasted notes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Options</CardTitle>
              <CardDescription>Keep the output simple, then edit the markdown metadata before submitting.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <label className="space-y-2">
                <span className="text-sm font-medium">Transpose</span>
                <Input type="number" value={transpose} onChange={(event) => setTranspose(Number(event.target.value))} />
              </label>
              <label className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                <input type="checkbox" checked={sustain} onChange={(event) => setSustain(event.target.checked)} />
                Sustain marks
              </label>
              <label className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                <input type="checkbox" checked={groupChords} onChange={(event) => setGroupChords(event.target.checked)} />
                Chord brackets
              </label>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Markdown output</CardTitle>
            <CardDescription>Commit this file under <span className="font-mono">src/content/sheets</span>.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={output}
              onChange={(event) => setOutput(event.target.value)}
              placeholder="Converted markdown appears here."
              className="min-h-[520px] font-mono"
            />
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={downloadMarkdown} disabled={!output}>
                <Download />
                Download .md
              </Button>
              <Button asChild variant="outline">
                <a href="https://github.com/jasperdevs/RVPS/new/main/src/content/sheets" target="_blank" rel="noreferrer">
                  <Github />
                  Open GitHub PR
                  <ArrowUpRight />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
