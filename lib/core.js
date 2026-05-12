import fs from "fs";
import { marked } from "marked";
import path from "path";
import { createHighlighter } from "shiki";

/**
 * Core compiler logic
 * @param {Object} config - Configuration options
 */
export async function compileDocs({ input, output, title }) {
  const highlighter = await createHighlighter({
    themes: ["github-light", "github-dark"],
    langs: ["sh", "bash", "javascript", "json", "typescript"],
  });

  marked.use({
    renderer: {
      code({ text, lang }) {
        return highlighter.codeToHtml(text, {
          lang: lang || "sh",
          themes: { light: "github-light", dark: "github-dark" },
        });
      },
    },
  });

  let markdown = fs.readFileSync(path.resolve(input), "utf-8");

  // Handle GitHub Alerts
  const alertMap = {
    TIP: "\u{1F4A1}", // 💡
    NOTE: "\u2139\uFE0F", // i
    WARNING: "\u26A0\uFE0F", // !
    IMPORTANT: "\u2757", // ❗
    CAUTION: "\u{1F6AB}", // 🚫
  };
  Object.entries(alertMap).forEach(([type, icon]) => {
    const regex = new RegExp(`^> \\[!${type}\\]`, "gm");
    markdown = markdown.replace(regex, `> **${icon} ${type}**`);
  });

  const content = await marked.parse(markdown);

  // biome-ignore format: avoid leading blank line
  const html = 
`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    :root { --bg: #ffffff; --fg: #1f2328; --border: #d0d7de; --code-bg: #f6f8fa; }
    @media (prefers-color-scheme: dark) {
      :root { --bg: #0d1117; --fg: #e6edf3; --border: #30363d; --code-bg: #161b22; }
    }
    body { font-family: -apple-system, system-ui, sans-serif; background: var(--bg); color: var(--fg); padding: 2rem; display: flex; justify-content: center; }
    .markdown-body { max-width: 800px; width: 100%; }
    pre.shiki { padding: 16px; overflow: auto; border-radius: 6px; border: 1px solid var(--border); background: var(--code-bg) !important; }
    @media (prefers-color-scheme: dark) { .shiki, .shiki span { color: var(--shiki-dark) !important; } }
    @media (prefers-color-scheme: light) { .shiki, .shiki span { color: var(--shiki-light) !important; } }
    code:not(pre code) { padding: 0.2em 0.4em; background: var(--code-bg); border-radius: 6px; font-size: 85%; }
    blockquote { border-left: 4px solid var(--border); padding: 0 1em; color: #6e7781; margin: 1em 0; }
  </style>
</head>
<body><article class="markdown-body">${content}</article></body>
</html>`;

  const outDir = path.dirname(path.resolve(output));
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.resolve(output), html);
}
