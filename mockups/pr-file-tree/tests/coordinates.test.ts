import test from 'node:test';
import assert from 'node:assert/strict';
import diffs from '../diffs.json' with {type:'json'};
import {rowCoordinates,hunkGaps} from '../coordinates.ts';
test('actual imports Change2 retains both source coordinate systems and its unchanged gap',()=>{const file=diffs.files.find(f=>f.path==='src/storage/imports.ts')!,h=file.hunks[1]!;assert.deepEqual(h.rows.map(rowCoordinates).map(c=>[c.before,c.after,c.mark]),[['24','26',' '],['25','27',' '],['26','28',' '],['27','','−'],['','29','+'],['28','30',' '],['29','31',' '],['30','32',' ']]);const gap=hunkGaps(file.hunks)[2]!;assert.equal(gap.beforeStart,31);assert.equal(gap.afterStart,33);assert.equal(gap.beforeCount,1);assert.equal(gap.afterCount,1);assert.match(gap.label,/unchanged/i);assert.equal(hunkGaps([{beforeStart:1,beforeCount:3,afterStart:1,afterCount:3},{beforeStart:4,beforeCount:2,afterStart:4,afterCount:2}])[1],null);});
