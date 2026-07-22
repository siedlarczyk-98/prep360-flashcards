export interface AlternativeContent {
  text: string;
  imageUrl?: string;
  imageAlt?: string;
}

const markdownImage = /!\[([^\]]*)\]\((https?:\/\/[^)]+|\/[^)]+)\)/i;
const htmlImage = /<img[^>]+src=["']([^"']+)["'][^>]*>/i;

export function parseAlternative(value: unknown): AlternativeContent {
  if (value && typeof value === "object") {
    const item = value as Record<string, unknown>;
    return {
      text: String(item.texto ?? item.text ?? item.label ?? ""),
      imageUrl: String(item.imagem_url ?? item.image_url ?? item.imagem ?? item.image ?? "") || undefined,
      imageAlt: String(item.imagem_alt ?? item.image_alt ?? item.alt ?? "") || undefined,
    };
  }

  const raw = String(value ?? "");
  const markdown = raw.match(markdownImage);
  if (markdown) return { text: raw.replace(markdown[0], "").trim(), imageUrl: markdown[2], imageAlt: markdown[1] || undefined };
  const html = raw.match(htmlImage);
  if (html) return { text: raw.replace(html[0], "").trim(), imageUrl: html[1] };
  if (/^(https?:\/\/|\/).+\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(raw.trim())) return { text: "", imageUrl: raw.trim() };
  return { text: raw };
}
