/**
 * The browser side of progress: local storage, and the calls to the progress API.
 * fetch is replaced per test; being signed out must never look like an error.
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchServerCompleted, readLocalCompleted, submitCompletion, writeLocalCompleted } from "./progress";

const reply = (status: number, body: unknown) => vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } }));
const snapshot = { schemaVersion: 1 as const, lessonKey: "medicine/the_cell", examined: [] };

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("local progress", () => {
  it("round-trips and de-duplicates", () => {
    writeLocalCompleted(["a/b", "a/b", "c/d"]);
    expect(readLocalCompleted().sort()).toEqual(["a/b", "c/d"]);
  });

  it("survives corrupted storage", () => {
    localStorage.setItem(Object.keys(localStorage)[0] ?? "forma:completed", "{not json");
    expect(Array.isArray(readLocalCompleted())).toBe(true);
  });
});

describe("server progress", () => {
  it("returns the saved keys when signed in", async () => {
    vi.stubGlobal("fetch", reply(200, { keys: ["medicine/the_cell"], signedIn: true }));
    expect(await fetchServerCompleted()).toEqual(["medicine/the_cell"]);
  });

  it("returns nothing when signed out, the network fails, or the body is odd", async () => {
    vi.stubGlobal("fetch", reply(200, { keys: [], signedIn: false }));
    expect(await fetchServerCompleted()).toEqual([]);
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
    expect(await fetchServerCompleted()).toEqual([]);
    vi.stubGlobal("fetch", reply(200, { keys: "nope" }));
    expect(await fetchServerCompleted()).toEqual([]);
  });

  it("a completion is saved only when the server says so", async () => {
    vi.stubGlobal("fetch", reply(200, { saved: true }));
    expect(await submitCompletion("medicine/the_cell", snapshot)).toMatchObject({ saved: true });
    vi.stubGlobal("fetch", reply(200, { saved: false, signedIn: false }));
    expect(await submitCompletion("medicine/the_cell", snapshot)).toMatchObject({ saved: false });
  });

  it("a rejected completion is reported as rejected, a server error as not saved", async () => {
    vi.stubGlobal("fetch", reply(422, { message: "The checks did not pass." }));
    expect(await submitCompletion("medicine/the_cell", snapshot)).toMatchObject({ saved: false, rejected: true });
    vi.stubGlobal("fetch", reply(500, {}));
    expect(await submitCompletion("medicine/the_cell", snapshot)).toMatchObject({ saved: false });
  });

  it("posts the lesson key and snapshot as JSON", async () => {
    const f = reply(200, { saved: true });
    vi.stubGlobal("fetch", f);
    await submitCompletion("medicine/the_cell", snapshot);
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/v1/progress");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toMatchObject({ lessonKey: "medicine/the_cell", snapshot });
  });
});
