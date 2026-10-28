import type { PreparationAliases, StructuralUnit } from '../domain/types.ts';
const familiarFile = (path: string, id: string) => ({
    'src/application/review.ts': 'review-file', 'src/application/local-access.ts': 'helper-file', 'tests/application.test.ts': 'application-test-file', 'tests/gateway.test.ts': 'gateway-test-file', 'tests/review.e2e.ts': 'test-file'
} as Record<string, string>)[path] ?? 'file:' + id;
const familiarUnit = (unit: StructuralUnit, fallback: string) => {
    if (unit.kind === 'function' && unit.anchor.path === 'src/application/review.ts' && ['request', 'refresh'].includes(unit.name))
        return unit.name;
    if (unit.kind === 'function' && unit.anchor.path === 'src/application/local-access.ts' && unit.name === 'accessHeaders')
        return 'helper';
    return fallback;
};
export const pr25Aliases: PreparationAliases = { fileId: familiarFile, unitId: familiarUnit, headerId: (owner, fallback) => owner === 'request' ? 'header-value' : fallback, headerScope: owner => owner === 'request' ? 'Direct request construction only' : 'Direct headers.Authorization construction only', reviewId: 'pr25', reviewName: 'PR25', graphId: 'pr25-generated-graph' };
