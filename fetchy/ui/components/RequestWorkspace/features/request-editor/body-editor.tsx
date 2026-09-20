import { json, jsonParseLinter } from "@codemirror/lang-json";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { lintGutter, linter } from "@codemirror/lint";
import { EditorView } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import CodeMirror from "@uiw/react-codemirror";
import { memo, useState } from "react";
import { FiAlignLeft } from "react-icons/fi";

import { Button } from "@/ui/components/primitives/button";
import { Select } from "@/ui/components/primitives/select";
import { Textarea } from "@/ui/components/primitives/textarea";
import { cn } from "@/ui/helpers/cn";
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

type JsonCodeEditorProps = {
  value: string;
  readOnly?: boolean;
  ariaLabel: string;
  height?: string;
  className?: string;
  onChange?: (value: string) => void;
};

export const JsonCodeEditor = memo(function JsonCodeEditor({
  value,
  readOnly = false,
  ariaLabel,
  height = "256px",
  className,
  onChange,
}: JsonCodeEditorProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-border bg-(--color-background)",
        className,
      )}
    >
      <CodeMirror
        aria-label={ariaLabel}
        value={value}
        height={height}
        readOnly={readOnly}
        extensions={[
          json(),
          ...(!readOnly ? [linter(jsonParseLinter()), lintGutter()] : []),
          jsonEditorTheme,
          jsonSyntaxHighlighting,
        ]}
        className="h-full text-xs"
        onChange={onChange}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          bracketMatching: true,
          closeBrackets: !readOnly,
          highlightActiveLine: !readOnly,
        }}
      />
    </div>
  );
});

type BodyEditorProps = {
  body: RequestBody;
  onChange: (body: RequestBody) => void;
};

export const BodyEditor = memo(function BodyEditor({
  body,
  onChange,
}: BodyEditorProps) {
  const [formatError, setFormatError] = useState<string | null>(null);

  const handleFormatJson = () => {
    try {
      const formattedJson = JSON.stringify(JSON.parse(body.content), null, 2);
      onChange({ ...body, content: formattedJson });
      setFormatError(null);
    } catch {
      setFormatError("The request body contains invalid JSON.");
    }
  };

  const handleBodyChange = (content: string) => {
    if (formatError) setFormatError(null);
    onChange({ ...body, content });
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
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
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-text-muted">JSON body</span>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<FiAlignLeft aria-hidden="true" />}
              onClick={handleFormatJson}
            >
              Format JSON
            </Button>
          </div>
          <JsonCodeEditor
            ariaLabel="JSON request body"
            value={body.content}
            height="100%"
            className="min-h-0 flex-1"
            onChange={handleBodyChange}
          />
          {formatError && (
            <p role="alert" className="text-xs text-danger">
              {formatError}
            </p>
          )}
        </div>
      )}
      {body.type === "text" && (
        <Textarea
          aria-label="Text request body"
          value={body.content}
          onChange={(event) =>
            onChange({ ...body, content: event.target.value })
          }
          className="min-h-64 flex-1 resize-none font-mono text-xs leading-6"
        />
      )}
    </div>
  );
});
