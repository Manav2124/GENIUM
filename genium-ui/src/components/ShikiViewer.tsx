"use client";

import { createHighlighter } from "shiki";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ShikiViewer({
  code,
  lang = "tsx",
  showLineNumbers = true,
  className,
}: {
  code: string;
  lang?: string;
  showLineNumbers?: boolean;
  className?: string;
}) {
  const [html, setHtml] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const { resolvedTheme } = useTheme();
  useEffect(() => {
    let mounted = true;
    async function highlight() {
      try {
        setIsLoading(true);
        const shikiTheme =
          resolvedTheme === "dark" ? "dark-plus" : "github-light";
        const highlighter = await createHighlighter({
          langs: [
            "tsx",
            "typescript",
            "javascript",
            "jsx",
            "json",
            "css",
            "scss",
            "html",
            "markdown",
            "python", // Added python for the example in the image
            "text" // Added text for the example in the image
          ],
          themes: ["dark-plus", "github-light"],
        });
        const highlightedHtml = highlighter.codeToHtml(code, {
          lang: lang === "tsx" ? "typescript" : lang,
          theme: shikiTheme,
        });
        if (mounted) {
          setHtml(highlightedHtml);
          setIsLoading(false);
        }
      } catch (error) {
        if (mounted) {
          setHtml(`<pre><code>${code}</code></pre>`);
          setIsLoading(false);
        }
      }
    }
    highlight();
    return () => {
      mounted = false;
    };
  }, [code, lang, resolvedTheme]);
  const addLineNumbers = (html: string) => {
    if (!showLineNumbers) return html;
    const lines = code.split("\n");
    const lineNumbers = lines.map((_, i) => `<span>${i + 1}</span>`).join("");
    return html.replace(
      /<pre[^>]*>([\s\S]*)<\/pre>/,
      `<pre class="line-numbers"><span class="line-numbers-rows">${lineNumbers}</span>$1</pre>`
    );
  };
  return (
    <>
      <style>{`
        .shiki-viewer { border-radius: 0.5rem; overflow: hidden; border: 1px solid hsl(var(--border)); }
        .shiki-viewer pre { margin: 0; padding: 1rem; overflow-x: auto; background: transparent; font-size: 0.875rem; line-height: 1.5; white-space: pre; }
        .shiki-viewer code { background: transparent; padding: 0; border-radius: 0; font-family: inherit; font-size: inherit; line-height: inherit; white-space: pre; }
        .shiki-viewer .line-numbers { display: flex; }
        .shiki-viewer .line-numbers .line-numbers-rows { display: flex; flex-direction: column; padding-right: 0.2rem; margin-right: 0.2rem; border-right: 1px solid hsl(var(--border)); text-align: right; color: hsl(var(--muted-foreground)); font-size: 0.8755rem; user-select: none; }
        .shiki-viewer .line-numbers .line-numbers-rows > span { display: block; min-width: 2rem; }
      `}</style>
      <div className={cn("shiki-viewer", className)}>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-pulse text-muted-foreground">
              Loading code...
            </div>
          </div>
        ) : (
          <div dangerouslySetInnerHTML={{ __html: addLineNumbers(html) }} />
        )}
      </div>
    </>
  );
}