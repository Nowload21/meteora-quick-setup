import esbuild from "esbuild";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
import { NodeModulesPolyfillPlugin } from "@esbuild-plugins/node-modules-polyfill";
import { cpSync, mkdirSync, rmSync } from "node:fs";

const watch = process.argv.includes("--watch");

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist", { recursive: true });

const shared = {
  bundle: true,
  format: "iife",
  target: "chrome120",
  sourcemap: watch ? "inline" : false,
  minify: !watch,
  logLevel: "info",
  define: {
    global: "globalThis",
    "process.env.NODE_ENV": watch ? '"development"' : '"production"',
    "process.env.ANCHOR_BROWSER": "true"
  }
};

const mainOptions = {
  ...shared,
  entryPoints: { "main-world": "src/main-world.ts" },
  outdir: "dist",
  inject: ["src/buffer-shim.js"],
  plugins: [
    NodeGlobalsPolyfillPlugin({ buffer: true, process: true }),
    NodeModulesPolyfillPlugin()
  ]
};

const extensionOptions = {
  ...shared,
  entryPoints: {
    "content-bridge": "src/content-bridge.ts",
    background: "src/background.ts",
    popup: "src/popup.ts"
  },
  outdir: "dist"
};

cpSync("public", "dist", { recursive: true });

if (watch) {
  const main = await esbuild.context(mainOptions);
  const extension = await esbuild.context(extensionOptions);
  await Promise.all([main.watch(), extension.watch()]);
  console.log("Meteora Quick Setup: watch actif");
} else {
  await Promise.all([esbuild.build(mainOptions), esbuild.build(extensionOptions)]);
  console.log("Meteora Quick Setup construit dans dist/");
}
