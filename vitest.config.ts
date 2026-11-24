import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * Two kinds of test, both run by `npm test`:
 *   *.test.ts   logic: validators, content and manifest parity, the teaching CPU,
 *               the AVR emulator, the compile guard, server judging, model-building
 *               libraries, house data, camera framing. Run in Node.
 *   *.test.tsx  UI: components rendered into jsdom with Testing Library, driven the
 *               way a user would (click, type, keyboard). No real browser and no
 *               WebGL: 3D canvases are not rendered in these tests.
 */
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx", "scripts/**/*.test.ts"],
    environment: "node",
    setupFiles: ["./src/test/setup.ts"],
  },
});
