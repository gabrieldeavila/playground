import { json, jsonParseLinter } from "@codemirror/lang-json";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { lintGutter, linter } from "@codemirror/lint";
import { EditorView } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import CodeMirror from "@uiw/react-codemirror";
import { memo } from "react";

import { Select } from "@/ui/components/primitives/select";
import { Textarea } from "@/ui/components/primitives/textarea";
import type { RequestBody } from "@/types/interface/request.interface";

const jsonEditorTheme = EditorView.theme(
  {
    "&.cm-editor": {
      backgroundColor: "var(--color-bg-elevated)",
      color: "var(--color-text)",
      fontSize: "var(--text-xs)",
    },
    ".cm-content": {
      caretColor: "var(--color-primary)",
      fontFamily:
        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      padding: "12px 0",
    },
    ".cm-gutters": {
      backgroundColor: "var(--color-surface)",
      borderRight: "1px solid var(--color-border)",
      color: "var(--color-text-muted)",
    },
    ".cm-activeLine": {
      backgroundColor:
        "color-mix(in srgb, var(--color-primary) 7%, transparent)",
    },
    ".cm-activeLineGutter": {
      backgroundColor:
        "color-mix(in srgb, var(--color-primary) 10%, transparent)",
      color: "var(--color-text)",
    },
    ".cm-selectionBackground, ::selection": {
      backgroundColor:
        "color-mix(in srgb, var(--color-primary) 28%, transparent)",
    },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: "var(--color-primary)",
    },
    ".cm-focused": {
      outline: "none",
    },
    ".cm-matchingBracket": {
      backgroundColor:
        "color-mix(in srgb, var(--color-primary) 18%, transparent)",
      outline:
        "1px solid color-mix(in srgb, var(--color-primary) 45%, transparent)",
    },
    ".cm-diagnostic-error": {
      borderBottom: "2px wavy var(--color-danger)",
    },
    ".cm-diagnostic": {
      backgroundColor: "var(--color-bg-elevated)",
      border: "1px solid var(--color-border)",
      color: "var(--color-text)",
    },
    ".cm-diagnostic-error::before": {
      color: "var(--color-danger)",
    },
  },
  { dark: true },
);

const jsonSyntaxHighlighting = syntaxHighlighting(
  HighlightStyle.define([
    { tag: tags.propertyName, color: "var(--color-primary)" },
    {
      tag: tags.string,
      color: "color-mix(in srgb, var(--color-success) 72%, var(--color-text))",
    },
    {
      tag: tags.number,
      color: "color-mix(in srgb, var(--color-warning) 78%, var(--color-text))",
    },
    { tag: [tags.bool, tags.null], color: "var(--color-primary)" },
    { tag: tags.punctuation, color: "var(--color-text-muted)" },
  ]),
);

type BodyEditorProps = {
  body: RequestBody;
  onChange: (body: RequestBody) => void;
};

export const BodyEditor = memo(function BodyEditor({
  body,
  onChange,
}: BodyEditorProps) {
  return (
    <div className="space-y-3">
      <Select
        aria-label="Body type"
        value={body.type}
        onChange={(event) =>
          onChange({
            ...body,
            type: event.target.value as RequestBody["type"],
          })
        }
      >
        <option value="none">No body</option>
        <option value="json">JSON</option>
        <option value="text">Text</option>
      </Select>
      {body.type === "json" && (
        <div className="overflow-hidden rounded-md border border-(--color-border) bg-(--color-background)">
          <CodeMirror
            aria-label="JSON request body"
            value={body.content}
            height="256px"
            extensions={[
              json(),
              linter(jsonParseLinter()),
              lintGutter(),
              jsonEditorTheme,
              jsonSyntaxHighlighting,
            ]}
            onChange={(value) => onChange({ ...body, content: value })}
            className="text-xs"
            basicSetup={{
              lineNumbers: true,
              foldGutter: true,
              bracketMatching: true,
              closeBrackets: true,
              highlightActiveLine: true,
            }}
          />
        </div>
      )}
      {body.type === "text" && (
        <Textarea
          aria-label="Text request body"
          value={body.content}
          onChange={(event) =>
            onChange({ ...body, content: event.target.value })
          }
          className="min-h-64 resize-none font-mono text-xs leading-6"
        />
      )}
    </div>
  );
});
