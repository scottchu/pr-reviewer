import { test, expect } from "bun:test";
import { createRegistry } from "../src/integration/registry.ts";
test("01 managed routes deduplicate, fence late emissions, revoke and reconnect", () => {
  const registry = createRegistry();
  let calls = 0;
  const lease = registry.register(
    "view",
    "r",
    () => true,
    () => calls++,
  );
  expect(() =>
    registry.register(
      "view",
      "r",
      () => true,
      () => calls++,
    ),
  ).toThrow("duplicate_route");
  lease.emit();
  expect(calls).toBe(1);
  lease.dispose();
  lease.emit();
  expect(calls).toBe(1);
  let allowed = false;
  const next = registry.register(
    "view",
    "r",
    () => allowed,
    () => calls++,
  );
  next.emit();
  expect(calls).toBe(1);
  allowed = true;
  next.emit();
  expect(calls).toBe(2);
  registry.revoke("r");
  next.emit();
  expect(calls).toBe(2);
  expect(registry.diagnostics()).toHaveLength(0);
});
