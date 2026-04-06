/**
 * One-off: MDX (markdown-only) → standalone HTML with Mermaid.
 * Usage: node scripts/export-mdx-standalone-html.mjs [input.mdx] [output.html]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";
import { marked } from "marked";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const mdxPath = path.resolve(root, process.argv[2] || "_content/articles/chain-elasticsearch-agents-eks-mcp-agent-builder.mdx");
const outPath = path.resolve(root, process.argv[3] || "chain-elasticsearch-agents-eks-mcp-agent-builder-standalone.html");

const src = fs.readFileSync(mdxPath, "utf8");
const { data, content } = matter(src);

// Map Labs asset paths to existing PNGs in chained-agents-eks-mcp/images/
const imgMap = {
  "step-01-service-map.png": "04-service-map-or-errors.png",
  "step-02-mcp-connector.png": "05-eks-mcp.png",
  "step-03-k8s-agent.png": "02-k8s-troubleshooter-agent.png",
  "step-04-observability-agent.png": "01-observability-agent-v2.png",
  "step-05-workflow-tool.png": "03-workflow-tool-parent-agent.png",
  "step-06-errors.png": "06-demo-services-service-map-or-errors.png",
  "header.jpg": "04-service-map-or-errors.png",
};

function fixAssets(html) {
  const prefix = "/assets/images/chain-elasticsearch-agents-eks-mcp-agent-builder/";
  let out = html;
  for (const [k, v] of Object.entries(imgMap)) {
    out = out.split(`${prefix}${k}`).join(`chained-agents-eks-mcp/images/${v}`);
  }
  return out;
}

let md = content.replace(/```mermaid\n([\s\S]*?)\n```/g, (_, code) => {
  return `\n\n<pre class="mermaid">${code.trim()}</pre>\n\n`;
});

const bodyHtml = marked.parse(md);
const inner = fixAssets(bodyHtml);

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");

const title = data.title || "Article";
const desc = data.description || "";
const date = data.date || "";
const tags = Array.isArray(data.tags) ? data.tags.map((t) => t.slug).filter(Boolean).join(", ") : "";

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}" />
  <style>
    :root { --bg:#fafaf9; --text:#1c1917; --muted:#57534e; --border:#e7e5e4; --accent:#b45309; --code:#f5f5f4; }
    @media (prefers-color-scheme: dark) {
      :root { --bg:#0c0a09; --text:#fafaf9; --muted:#a8a29e; --border:#292524; --accent:#fbbf24; --code:#1c1917; }
    }
    * { box-sizing: border-box; }
    body { margin:0; font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; font-size:1.0625rem; line-height:1.65; color:var(--text); background:var(--bg); }
    .wrap { width:100%; max-width:100%; margin:0; padding:2rem clamp(1rem,3vw,2.5rem) 4rem; }
    header { padding-bottom:1.5rem; margin-bottom:2rem; border-bottom:1px solid var(--border); }
    h1 { font-size: clamp(1.65rem, 4vw, 2.1rem); font-weight:700; line-height:1.25; margin:0 0 0.5rem; }
    .meta { font-size:0.9rem; color:var(--muted); margin:0; }
    article h2 { font-size:1.35rem; margin:2.25rem 0 0.75rem; font-weight:650; }
    article h3 { font-size:1.1rem; margin:1.5rem 0 0.5rem; font-weight:600; }
    article p { margin:0.75rem 0; }
    article ul { margin:0.75rem 0; padding-left:1.35rem; }
    a { color:var(--accent); }
    code { font-family: ui-monospace, monospace; font-size:0.92em; background:var(--code); padding:0.12em 0.35em; border-radius:4px; }
    pre:not(.mermaid) { background:var(--code); border:1px solid var(--border); border-radius:8px; padding:1rem 1.1rem; overflow-x:auto; font-size:0.84rem; }
    pre code { background:none; padding:0; }
    pre.mermaid { background:transparent; border:none; padding:1rem; overflow-x:auto; display:flex; justify-content:center; }
    article img { max-width:100%; height:auto; border:1px solid var(--border); border-radius:8px; display:block; margin:1rem 0; }
    footer { margin-top:3rem; padding-top:1.5rem; border-top:1px solid var(--border); font-size:0.9rem; color:var(--muted); }
  </style>
</head>
<body>
  <div class="wrap">
    <header>
      <h1>${esc(title)}</h1>
      <p class="meta">${esc(date)}${tags ? ` · ${esc(tags)}` : ""}</p>
    </header>
    <article>${inner}</article>
    <footer>
      <p>Generated from <code>${esc(path.basename(mdxPath))}</code>. Re-run: <code>node scripts/export-mdx-standalone-html.mjs</code></p>
    </footer>
  </div>
  <script type="module">
    import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs";
    mermaid.initialize({
      startOnLoad: true,
      theme: window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "default",
    });
  </script>
</body>
</html>`;

fs.writeFileSync(outPath, html, "utf8");
console.log("Wrote", path.relative(root, outPath));
