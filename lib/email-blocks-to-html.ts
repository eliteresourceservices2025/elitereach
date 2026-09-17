type Block = Record<string, unknown> & { type: string };

function esc(text: unknown): string {
  return String(text ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function renderBlock(block: Block): string {
  switch (block.type) {
    case "heading": {
      const level = Number(block.level) || 2;
      const tag = level === 1 ? "h1" : level === 3 ? "h3" : "h2";
      return `<${tag}>${esc(block.content)}</${tag}>`;
    }
    case "text": {
      const content = String(block.content ?? "");
      // Sequenzy's "text" blocks with variant "paragraph"/"lead" often already contain inline HTML.
      return content.trim().startsWith("<") ? content : `<p>${esc(content)}</p>`;
    }
    case "list": {
      const tag = block.variant === "numbered" ? "ol" : "ul";
      const items = Array.isArray(block.items) ? (block.items as { content: string }[]) : [];
      return `<${tag}>${items.map((i) => `<li>${esc(i.content)}</li>`).join("")}</${tag}>`;
    }
    case "steps": {
      const items = Array.isArray(block.items) ? (block.items as { title: string; description?: string }[]) : [];
      return `<ol>${items
        .map((i) => `<li><strong>${esc(i.title)}</strong>${i.description ? ` — ${esc(i.description)}` : ""}</li>`)
        .join("")}</ol>`;
    }
    case "features": {
      const items = Array.isArray(block.items) ? (block.items as { title: string; description?: string }[]) : [];
      return `<ul>${items
        .map((i) => `<li><strong>${esc(i.title)}</strong>${i.description ? `: ${esc(i.description)}` : ""}</li>`)
        .join("")}</ul>`;
    }
    case "badge":
      return `<p style="font-size:12px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;color:#8a2be2;">${esc(block.text)}</p>`;
    case "button":
      return buttonHtml(String(block.text ?? "Learn more"), String(block.url ?? "#"));
    case "cta":
      return [
        `<h3>${esc(block.title)}</h3>`,
        `<p>${esc(block.description)}</p>`,
        buttonHtml(String(block.buttonText ?? "Learn more"), String(block.buttonUrl ?? "#")),
      ].join("");
    case "hero":
      return [
        block.eyebrow ? `<p style="font-size:12px;font-weight:600;text-transform:uppercase;color:#8a2be2;">${esc(block.eyebrow)}</p>` : "",
        `<h1>${esc(block.heading)}</h1>`,
        block.subheading ? `<p>${esc(block.subheading)}</p>` : "",
        block.buttonText ? buttonHtml(String(block.buttonText), String(block.buttonUrl ?? "#")) : "",
      ].join("");
    case "divider":
      return `<hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;" />`;
    case "spacer":
      return `<div style="height:${Number(block.height) || 16}px;"></div>`;
    case "image":
      return `<img src="${esc(block.src)}" alt="${esc(block.alt)}" style="max-width:100%;height:auto;" />`;
    default:
      return "";
  }
}

function buttonHtml(text: string, url: string): string {
  return `<p style="text-align:center;margin:24px 0;"><a href="${esc(url)}" style="display:inline-block;background:#8a2be2;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">${esc(text)}</a></p>`;
}

/** Flattens Sequenzy's generated visual blocks into a simple HTML fragment for editing in a rich-text editor. */
export function blocksToHtml(blocks: Block[]): string {
  return blocks.map(renderBlock).filter(Boolean).join("\n");
}
