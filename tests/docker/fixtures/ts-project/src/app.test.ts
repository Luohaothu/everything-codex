import { describe, it } from "node:test";
import * as assert from "node:assert";
import { getUserById, parseConfig, addTimestamp } from "./app";

describe("getUserById", () => {
  it("returns user for valid id", () => {
    const user = getUserById("123");
    assert.ok(user);
    assert.strictEqual(user.id, "123");
  });

  it("returns null for empty id", () => {
    const user = getUserById("");
    assert.strictEqual(user, null);
  });
});

describe("parseConfig", () => {
  it("parses valid JSON", () => {
    const result = parseConfig('{"key": "value"}');
    assert.strictEqual(result.key, "value");
  });

  it("returns empty object for invalid JSON", () => {
    const result = parseConfig("not json");
    assert.deepStrictEqual(result, {});
  });
});

describe("addTimestamp", () => {
  it("adds timestamp to object", () => {
    const obj: Record<string, unknown> = { name: "test" };
    const result = addTimestamp(obj);
    assert.ok(result.timestamp);
  });

  // ISSUE: this test documents the mutation side-effect
  it("mutates the original object", () => {
    const obj: Record<string, unknown> = {};
    addTimestamp(obj);
    assert.ok(obj.timestamp); // Side effect - might be unexpected
  });
});
