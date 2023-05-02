import { builtinModules } from "node:module";
import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import pkg from "./package.json" assert { type:"json" };

const EXTENSIONS = [".js", ".ts"];

export default {
    external: [
        ...builtinModules,
        ...(pkg.dependencies ? Object.keys(pkg.dependencies) : [])
    ],
    input: "source/index.ts",
    output: [
        {
            dir: "dist/cjs",
            format: "cjs",
            entryFileNames: "[name].cjs"
        },
        {
            dir: "dist/esm",
            format: "esm"
        }
    ],
    plugins: [typescript({
        tsconfig: "tsconfig.json"
    }), resolve({ extensions: EXTENSIONS })]
};
