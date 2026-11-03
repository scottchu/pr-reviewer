import ts from 'typescript-analysis';
export type LexicalToken = Readonly<{kind: string; text: string}>;

/** Exact lexical display colors, not semantic interpretation or an execution claim. */
export const lexicalColors = (path: string, text: string): LexicalToken[][] => {
    const {spans} = ts.createClassifier().getEncodedLexicalClassifications(text, ts.EndOfLineState.None, true);
    const rows: LexicalToken[][] = [[]];
    const append = (kind: string, value: string) => {
        for (const [index, part] of value.split('\n').entries()) {
            if (index) rows.push([]);
            if (part) rows.at(-1)!.push({kind, text: part});
        }
    };
    let offset = 0;
    for (let index = 0; index < spans.length; index += 3) {
        const start = spans[index]!;
        const end = start + spans[index + 1]!;
        const classification = spans[index + 2]!;
        if (start < offset || end > text.length) throw new Error(`syntax_span_invalid:${path}`);
        append('plain', text.slice(offset, start));
        const kind = classification === ts.ClassificationType.comment ? 'comment'
            : classification === ts.ClassificationType.keyword ? 'keyword'
            : classification === ts.ClassificationType.stringLiteral ? 'string'
            : classification === ts.ClassificationType.numericLiteral || classification === ts.ClassificationType.bigintLiteral ? 'number' : 'plain';
        append(kind, text.slice(start, end));
        offset = end;
    }
    append('plain', text.slice(offset));
    if (rows.map(row => row.map(token => token.text).join('')).join('\n') !== text) throw new Error(`syntax_bytes_changed:${path}`);
    return rows;
};
