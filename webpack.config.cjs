const path = require("node:path");
const ResolveTypeScriptPlugin = require("resolve-typescript-plugin");
const { NormalModuleReplacementPlugin } = require("webpack");

module.exports = {
    devtool: false,

    entry: path.resolve(__dirname, "./source/index.ts"),

    mode: "production",

    module: {
        rules: [
            {
                test: /\.[jt]s$/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: [
                            "@babel/preset-typescript",
                            ["@babel/preset-env", {
                                targets: "> 0.25%, not dead",
                                useBuiltIns: false
                            }]
                        ]
                    }
                },
                resolve: {
                    fullySpecified: false
                }
            }
        ]
    },

    output: {
        filename: "index.cjs",
        path: path.resolve(__dirname, "./dist/browser"),
        library: {
            name: "ulidx",
            type: "umd"
        }
    },

    plugins: [
        new NormalModuleReplacementPlugin(/node:/, (resource) => {
            resource.request = resource.request.replace(/^node:/, "");
        }),
    ],

    resolve: {
        extensions: [".ts", ".js"],
        fallback: {
            buffer: false,
            crypto: false
        },
        plugins: [
            // Handle .ts => .js resolution
            new ResolveTypeScriptPlugin()
        ]
    },

    target: "web"
};
