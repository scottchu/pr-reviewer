// Conservative inline-link evidence, not a complete Markdown parser. Containers,
// code, escapes and unsupported link forms never imply semantic relationships.
const markdownTextLines = (content: string): { text: string; line: number }[] => {
  const lines: { text: string; line: number }[] = [];
  let fence: { marker: string; length: number; quoted: boolean } | null = null;
  let inlineTicks = 0;
  for (const [index, original] of content.split('\n').entries()) {
    // Strip blockquote markers only for recognizing code-fence structure. Their
    // contents are conservatively excluded from link analysis altogether.
    const quoted = /^ {0,3}>/.test(original);
    const line = original.replace(/^(?: {0,3}> ?)+/, '');
    const marker = /^ {0,3}(?:[-+*] |\d+[.)] )?(`{3,}|~{3,})(.*)$/.exec(line);
    if (fence) {
      const closing = /^ {0,3}(`{3,}|~{3,})\s*$/.exec(line);
      if (closing && quoted === fence.quoted && closing[1]![0] === fence.marker && closing[1]!.length >= fence.length) fence = null;
      continue;
    }
    if (marker && (marker[1]![0] !== '`' || !marker[2]!.includes('`'))) {
      fence = { marker: marker[1]![0]!, length: marker[1]!.length, quoted };
      inlineTicks = 0;
      continue;
    }
    if (quoted || /^(?: {4}|\t)/.test(line)) continue;
    let text = '';
    for (let i = 0; i < line.length;) {
      if (line[i] === '\\' && !inlineTicks) { text += '  '; i += 2; continue; }
      if (line[i] === '`') {
        let end = i + 1; while (line[end] === '`') end++;
        const length = end - i;
        if (!inlineTicks) inlineTicks = length;
        else if (inlineTicks === length) inlineTicks = 0;
        text += ' '.repeat(length); i = end; continue;
      }
      text += inlineTicks ? ' ' : line[i]; i++;
    }
    lines.push({text,line:index+1});
  }
  return lines;
};
export const inlineDocumentLinks = (content:string):{destination:string;line:number}[] =>
  markdownTextLines(content).flatMap(({text,line})=>[...text.matchAll(/(?<!!)\[[^\]]+\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g)].map(match=>({destination:match[1]!,line})));

export const resolveDocumentDestination = (origin: string, destination: string): { path: string; fragment: string | null } => {
  if (/^[a-z][a-z0-9+.-]*:/i.test(destination) || destination.startsWith('//')) throw new Error('external destination');
  // URI syntax is split before percent-decoding: %23 belongs to a blob path,
  // whereas a literal # starts its fragment. Do not confuse these identities.
  const hash = destination.indexOf('#');
  const rawPath = hash < 0 ? destination : destination.slice(0, hash);
  const relative = decodeURIComponent(rawPath);
  const fragment = hash < 0 ? null : decodeURIComponent(destination.slice(hash + 1));
  if (relative.startsWith('/') || relative.includes('\0') || relative.includes('?')) throw new Error('unsupported or outside repository destination');
  const parts = relative ? origin.split('/').slice(0, -1).concat(relative.split('/')) : origin.split('/');
  const resolved: string[] = [];
  for (const part of parts) {
    if (part === '..') { if (!resolved.length) throw new Error('outside repository destination'); resolved.pop(); }
    else if (part && part !== '.') resolved.push(part);
  }
  return { path: resolved.join('/'), fragment };
};
export const documentHeadingLine = (content: string, fragment: string | null): number => {
  if (!fragment) return 1;
  const heading = markdownTextLines(content).find(({text}) => /^#{1,6} /.test(text) && text.replace(/^#+ /, '').toLowerCase().replace(/[^\p{L}\p{N} _-]/gu, '').replace(/ /g, '-') === fragment);
  if (!heading) throw new Error('heading fragment unresolved');
  return heading.line;
};
