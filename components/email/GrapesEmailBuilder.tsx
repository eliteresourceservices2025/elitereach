"use client";

import "grapesjs/dist/css/grapes.min.css";
import { useEffect, useRef } from "react";
import grapesjs, { type Editor } from "grapesjs";
import newsletterPreset from "grapesjs-preset-newsletter";

export function GrapesEmailBuilder({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Editor | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!containerRef.current) return;

    const editor = grapesjs.init({
      container: containerRef.current,
      height: "600px",
      fromElement: false,
      storageManager: false,
      components: value || "<div style='padding:24px;font-family:Arial,sans-serif;'></div>",
      plugins: [newsletterPreset],
    });
    editorRef.current = editor;

    let debounceTimer: ReturnType<typeof setTimeout>;
    editor.on("update", () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const html = editor.runCommand("gjs-get-inlined-html") as unknown as string;
        onChangeRef.current(html);
      }, 500);
    });

    return () => {
      clearTimeout(debounceTimer);
      editor.destroy();
      editorRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="elite-grapes overflow-hidden rounded-lg border border-gray-300">
      <div ref={containerRef} />
    </div>
  );
}
