import {prepareFacts as prepareSourceFacts} from '../../src/review-graph/preparation/run.ts';
export {prepareFacts as prepareSourceFacts} from '../../src/review-graph/preparation/run.ts';
export {decodePinnedText,parseTreeRecords} from '../../src/review-graph/read/git-snapshot.ts';
import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const [repository, base, head, output] = process.argv.slice(2);
    if (!repository || !base || !head || !output)
        throw new Error('usage: repository base head persistent-output.json');
    const facts = await prepareSourceFacts(repository, base, head);
    writeFileSync(output, JSON.stringify(facts, null, 2) + '\n');
    console.log(JSON.stringify({
        files: facts.files.length, contextFiles: facts.contextFiles.length, units: facts.units.length, coverage: facts.coverage
    }));
}
