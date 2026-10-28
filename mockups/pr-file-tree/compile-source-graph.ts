import {compileSourceGraph as compare} from '../../src/review-graph/domain/comparison.ts';
import {pr25Aliases} from '../../src/review-graph/preparation/pr25-aliases.ts';
export {nativeLineMap,nativeLineCorresponds} from '../../src/review-graph/domain/comparison.ts';
export type {FactDocument} from '../../src/review-graph/domain/types.ts';
export const compileSourceGraph=(facts:import('../../src/review-graph/domain/types.ts').FactDocument)=>compare(facts,pr25Aliases);
