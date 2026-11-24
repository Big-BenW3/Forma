"use client";
/**
 * Monaco editor for the teaching ISA. This module is only ever loaded through
 * next/dynamic (see ProgramPractice), so Monaco's weight is paid only on the
 * lesson that needs it. Monaco itself is served from /monaco/vs (copied from
 * node_modules by scripts/copy-monaco.mjs), not from a CDN.
 *
 * Assembly errors show as red squiggles; the instruction that will run next
 * while stepping is highlighted.
 */
import { useEffect, useRef } from "react";
import Editor, { loader, type OnMount } from "@monaco-editor/react";
import type { AsmError } from "@/lib/teachisa";

loader.config({ paths: { vs: "/monaco/vs" } });

const LANG = "teachisa";
const OPS = "LOAD|MOV|ADD|SUB|INC|DEC|WRITE|READ|JMP|JZ|JNZ|OUT|OUTC|HALT";

type MonacoNS = Parameters<OnMount>[1];
type EditorInstance = Parameters<OnMount>[0];

function registerLanguage(monaco: MonacoNS) {
  if (monaco.languages.getLanguages().some((l: { id: string }) => l.id === LANG)) return;
  monaco.languages.register({ id: LANG });
  monaco.languages.setMonarchTokensProvider(LANG, {
    ignoreCase: true,
    tokenizer: {
      root: [
        [/;.*$/, "comment"],
        [/^\s*[A-Za-z_]\w*\s*:/, "type.identifier"],
        [new RegExp(`\\b(${OPS})\\b`), "keyword"],
        [/\b[ABCD]\b/, "variable"],
        [/'.'/, "string"],
        [/0x[0-9a-f]+|\d+/i, "number"],
      ],
    },
  });
  monaco.editor.defineTheme("forma", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "c2410c", fontStyle: "bold" },
      { token: "variable", foreground: "1d4ed8" },
      { token: "number", foreground: "0f766e" },
      { token: "string", foreground: "0f766e" },
      { token: "comment", foreground: "8a94a6", fontStyle: "italic" },
      { token: "type.identifier", foreground: "6d28d9", fontStyle: "bold" },
    ],
    colors: { "editor.background": "#fbfaf7", "editorLineNumber.foreground": "#9aa3b2" },
  });
}

export default function CodeEditor({
  value,
  onChange,
  errors,
  nextLine,
  language = LANG,
}: {
  value: string;
  onChange: (v: string) => void;
  errors: Array<Pick<AsmError, "line" | "message">>;
  nextLine?: number;
  /** "teachisa" (default) or any Monaco built-in such as "cpp" */
  language?: string;
}) {
  const editorRef = useRef<EditorInstance | null>(null);
  const monacoRef = useRef<MonacoNS | null>(null);
  const decoRef = useRef<ReturnType<EditorInstance["createDecorationsCollection"]> | null>(null);

  // Squiggles for assembly errors.
  useEffect(() => {
    const monaco = monacoRef.current;
    const model = editorRef.current?.getModel();
    if (!monaco || !model) return;
    monaco.editor.setModelMarkers(
      model,
      "teachisa",
      errors.map((e) => ({
        severity: monaco.MarkerSeverity.Error,
        message: e.message,
        startLineNumber: e.line,
        endLineNumber: e.line,
        startColumn: 1,
        endColumn: model.getLineMaxColumn(Math.min(e.line, model.getLineCount())),
      })),
    );
  }, [errors]);

  // Highlight the instruction that runs next.
  useEffect(() => {
    const ed = editorRef.current;
    const monaco = monacoRef.current;
    if (!ed || !monaco) return;
    decoRef.current?.clear();
    decoRef.current = nextLine
      ? ed.createDecorationsCollection([{ range: new monaco.Range(nextLine, 1, nextLine, 1), options: { isWholeLine: true, className: "forma-next-line" } }])
      : null;
  }, [nextLine]);

  return (
    <Editor
      height="100%"
      language={language}
      theme="forma"
      value={value}
      onChange={(v) => onChange(v ?? "")}
      beforeMount={registerLanguage}
      onMount={(ed, monaco) => {
        editorRef.current = ed;
        monacoRef.current = monaco;
      }}
      loading={<div className="p-4 font-mono text-[12px] text-ink-3">Loading editor…</div>}
      options={{
        fontFamily: '"JetBrains Mono Variable", ui-monospace, Menlo, monospace',
        fontSize: 13,
        lineHeight: 20,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        tabSize: 2,
        renderLineHighlight: "none",
        padding: { top: 10, bottom: 10 },
        overviewRulerLanes: 0,
        wordWrap: "off",
        fixedOverflowWidgets: true,
        ariaLabel: "Program source",
      }}
    />
  );
}
