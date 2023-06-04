import { builtinModules } from "node:module";
import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import alias from "@rollup/plugin-alias";
import pkg from "./package.json" assert { type:"json" };

const EXTENSIONS = [".js", ".ts"];
const MODE = process.env.MODE ? process.env.MODE : "node";

// const externals = MODE === "node" ? [
//     ...builtinModules,
//     ...(pkg.dependencies ? Object.keys(pkg.dependencies) : [])
// ] : [...builtinModules];

const plugins = [
    typescript({
        tsconfig: "tsconfig.json"
    }),
    resolve({ extensions: EXTENSIONS })
];
if (MODE === "browser") {
    plugins.unshift(alias({
        entries: [
            { find: "node:crypto", replacement: "./stub.js" }
        ]
    }));
}

export default {
    external: [...builtinModules],
    input: "source/index.ts",
    output: [
        {
            dir: `dist/${MODE}`,
            format: "cjs",
            entryFileNames: "[name].cjs"
        },
        {
            dir: `dist/${MODE}`,
            format: "esm",
            entryFileNames: "[name].js"
        }
    ],
    plugins
};
