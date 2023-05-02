import { builtinModules } from "node:module";
import typescript from "@rollup/plugin-typescript";
import pkg from "./package.json" assert { type:"json" };

const base = {
    external: [
        ...builtinModules,
        ...(pkg.dependencies ? Object.keys(pkg.dependencies) : []),
        ...(pkg.devDependencies ? Object.keys(pkg.devDependencies) : []),
        ...(pkg.peerDependencies ? Object.keys(pkg.peerDependencies) : [])
    ]
};

export default [
    {
        ...base,
        input: "source/index.ts",
        output: {
            dir: "dist/cjs",
            format: "cjs"
        },
        plugins: [typescript({
            tsconfig: "tsconfig.cjs.json"
        })],
        preserveModules: true
    },
    {
        ...base,
        input: "source/index.ts",
        output: {
            dir: "dist/esm",
            format: "esm"
        },
        plugins: [typescript({
            tsconfig: "tsconfig.json"
        })],
        preserveModules: true
    }
];
