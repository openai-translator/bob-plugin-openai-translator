import { defineConfig } from "rollup";
import copy from 'rollup-plugin-copy'
import typescript from "@rollup/plugin-typescript";

export default defineConfig({
  input: "src/main.ts",
  output: {
    file: "dist/main.js",
    format: "cjs",
  },
  cache: true,
  plugins: [
    copy({
      targets: [
        { src: 'public/icon.png', dest: 'dist' },
        { src: 'public/info.json', dest: 'dist' }
      ]
    }),
    typescript(),
  ],
});