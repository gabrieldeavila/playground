import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import postcss from "rollup-plugin-postcss";
import terser from "@rollup/plugin-terser";
import babel from "rollup-plugin-babel";
import dts from "rollup-plugin-dts";
import sourcemaps from "rollup-plugin-sourcemaps";

const packageJson = require("./package.json");

export default [
  {
    input: "src/index.ts",
    output: [
      // {
      //   file: packageJson.main,
      //   format: "cjs",
      //   sourcemap: true,
      // },
      {
        file: packageJson.module,
        format: "esm",
        sourcemap: true,
        sourcemapExcludeSources: true, // This is optional, but recommended for security reasons
      },
    ],
    external: [
      "react",
      "react-dom",
      "styled-components",
    ],
    plugins: [
      resolve(),
      commonjs(),
      sourcemaps(),
      typescript({ tsconfig: "./tsconfig.json" }),
      postcss(),
      terser(),
      babel({
        extensions: [".js", ".ts", ".tsx"],
        exclude: "node_modules/**",
        presets: [
          [
            "@babel/preset-env",
            {
              targets: "> 0.25%, not dead",
            },
          ],
          "@babel/preset-typescript",
        ],
        plugins: [
          [
            "babel-plugin-styled-components",
            {
              ssr: true,
            },
          ],
        ],
      }),
    ],
  },
  {
    input: "dist/esm/index.d.ts",
    output: [{ file: "dist/index.d.ts", format: "esm" }],
    plugins: [dts()],
    external: [/\.(css|less|scss)$/],
  },
];
