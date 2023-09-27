import { resolve } from "path";
import { defineConfig } from "vite";
import dtsPlugin from "vite-plugin-dts";

const globals = {
  "@pixi/core": "PIXI",
  "@pixi/display": "PIXI",
  "@pixi/events": "PIXI",
  "@pixi/math": "PIXI",
  "@pixi/ticker": "PIXI",
  "pixi.js": "pixi.js",
};

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "lib/main.ts"),
      name: "@riskchallenger/pixi-grouping",
    },
    rollupOptions: {
      external: [...Object.keys(globals)],
      output: {
        globals,
      },
    },
  },
  plugins: [dtsPlugin({ include: ["lib"] })],
});
