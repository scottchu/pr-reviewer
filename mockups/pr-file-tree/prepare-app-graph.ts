export {prepareAppGraph} from '../../src/review-graph/preparation/pr25.ts';
import {prepareAppGraph} from '../../src/review-graph/preparation/pr25.ts';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import type {FactDocument} from '../../src/review-graph/domain/types.ts';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const [input, output] = process.argv.slice(2);
    if (!input || !output)
        throw new Error('usage: source-facts.json app-graph.json');
    const bytes = readFileSync(input);
    const graph = prepareAppGraph(JSON.parse(bytes.toString()) as FactDocument, createHash('sha256').update(bytes).digest('hex'));
    writeFileSync(output, JSON.stringify(graph));
    console.log(JSON.stringify({
        rootEntities: graph.entities.length, relations: graph.relations.length, unpaired: graph.unresolved.length
    }));
}
