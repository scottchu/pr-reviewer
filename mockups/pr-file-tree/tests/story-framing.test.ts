import test from 'node:test';
import assert from 'node:assert/strict';
import { storyAttentionCamera } from '../story-framing.ts';

const camera = { x: 34, y: -90, zoom: 1.4 };
const area = { left: 280, top: 60, right: 1000, bottom: 700 };
test('visible Story target requires no camera operation', () => {
  assert.equal(storyAttentionCamera(camera, { left: 300, top: 80, right: 450, bottom: 106 }, area), null);
});
test('offscreen Story attention uses the smallest translation at exactly the current zoom', () => {
  assert.deepEqual(storyAttentionCamera(camera, { left: 1100, top: 800, right: 1250, bottom: 826 }, area), { x: -216, y: -216, zoom: 1.4 });
  assert.deepEqual(storyAttentionCamera(camera, { left: 100, top: -20, right: 250, bottom: 6 }, area), { x: 214, y: -10, zoom: 1.4 });
});
test('oversized headers keep their readable leading portion, and unavailable area never moves the camera', () => {
  assert.equal(storyAttentionCamera(camera, { left: 280, top: 60, right: 1800, bottom: 86 }, area), null);
  assert.equal(storyAttentionCamera(camera, area, { ...area, right: 200 }), null);
});
