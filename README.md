# ulidx
> ULID generator for NodeJS and the browser

[![ulidx](https://img.shields.io/npm/v/ulidx?color=blue&label=ulidx&logo=npm&style=flat-square)](https://www.npmjs.com/package/ulidx) ![Tests status](https://github.com/perry-mitchell/ulidx/actions/workflows/test.yml/badge.svg) ![GitHub](https://img.shields.io/github/license/perry-mitchell/ulidx) ![Dependents (via libraries.io)](https://img.shields.io/librariesio/dependents/npm/ulidx) [![monthly downloads](https://img.shields.io/npm/dm/ulidx.svg)](https://www.npmjs.com/package/ulidx) [![total downloads](https://img.shields.io/npm/dt/ulidx.svg?label=total%20downloads)](https://www.npmjs.com/package/ulidx)

ULID generator library, based off of the original [ulid](https://github.com/ulid/javascript) for NodeJS and the browser. ULIDs are Universally Unique Lexicographically Sortable Identifiers. This library adheres to [this specification](https://github.com/ulid/spec).

> The original [ulid](https://github.com/ulid/javascript) is no longer maintained, and has several outstanding compatibility-related issues that were never addressed. This library aims to address those and remain compatible in a larger range of environments.

## Installation

Install using npm by running: `npm install ulidx --save`.

`ulidx` provides types and is written entirely in Typescript. It provides both ESM and CommonJS outputs.

## Usage

Import `ulid` to generate new ULIDs:

```typescript
import { ulid } from "ulidx";

ulid(); // 01F7DKCVCVDZN1Z5Q4FWANHHCC
```

### Time seed

You can also provide a time seed which will consistently give you the same string for the time component.

> This is useful for migrating to ulid.

```typescript
ulid(1469918176385); // 01ARYZ6S41TSV4RRFFQ69G5FAV
```

### Monotonic ULID factory

To generate monotonically increasing ULIDs, create a monotonic counter using the factory:

```typescript
import { monotonicFactory } from "ulidx";

const ulid = monotonicFactory();

// Strict ordering for the same timestamp, by incrementing the least-significant random bit by 1
ulid(150000); // 000XAL6S41ACTAV9WEVGEMMVR8
ulid(150000); // 000XAL6S41ACTAV9WEVGEMMVR9
ulid(150000); // 000XAL6S41ACTAV9WEVGEMMVRA
ulid(150000); // 000XAL6S41ACTAV9WEVGEMMVRB
ulid(150000); // 000XAL6S41ACTAV9WEVGEMMVRC

// Even if a lower timestamp is passed (or generated), it will preserve sort order
ulid(100000); // 000XAL6S41ACTAV9WEVGEMMVRD
```

### Decode ULID Time

Import `decodeTime` to extract the timestamp embedded in a ULID:

```typescript
import { decodeTime } from "ulidx";

// Extract milliseconds since UNIX Epoch from ULID
decodeTime("01ARYZ6S41TSV4RRFFQ69G5FAV"); // 1469918176385
```

### Validate ULID

Import `isValid` to check if a string is a valid ULID:

```typescript
import { isValid } from "ulidx";

isValid("01ARYZ6S41TSV4RRFFQ69G5FAV"); // true
isValid("01ARYZ6S41TSV4RRFFQ69G5FA"); // false
```

### Crockford's Base32 (Typos tolerance and Hyphened ULIDs)

Import `fixULIDBase32` to fix typos and remove hyphens in a ULID:

```typescript
import { fixULIDBase32 } from "ulidx";

fixULIDBase32("oLARYZ6-S41TSV4RRF-FQ69G5FAV"); // 01ARYZ6S41TSV4RRFFQ69G5FAV
```

## Pseudo-Random Number Generation (PRNG)

`ulidx` will attempt to locate a suitable cryptographically-secure random number generator in the environment where it's loaded. On NodeJS this will be `crypto.randomBytes` and in the browser it will be `crypto.getRandomValues`.

`Math.random()` is **not supported**: The environment _must_ have a suitable crypto random number generator.

## Compatibility

`ulidx` is compatible with the following environments:

 * NodeJS 16 and up
   * Node REPL
 * Browsers with working `crypto` / `msCrypto` libraries
   * Web workers
 * React-Native ¹
 * Edge compute
   * Cloudflare Workers ²
   * Vercel Edge

 ¹ React-Native is supported if `crypto.getRandomValues()` is polyfilled. [`react-native-get-random-values`](https://github.com/LinusU/react-native-get-random-values) is one such library that should work well with `ulidx`. It should be imported before `ulidx` is used.

 ² `ulidx` is not _fully_ compatible with Cloudflare Workers due to their [problematic stance on getting the current time](https://developers.cloudflare.com/workers/learning/security-model#step-1-disallow-timers-and-multi-threading). It is recommended to only use monotonic factories in this runtime.

### Browser

`ulidx` provides browser bundles in both ESM and CommonJS varieties. Importing should be automatic, but you can import them directly:

 * `dist/browser/index.js` - Browser ESM build
 * `dist/browser/index.cjs` - Browser CommonJS build

Unlike version 1.x, these browser builds cannot simply be injected into the browser. They must be included in a build system of some kind, like Rollup or Webpack.

Note that you can use the Node-based builds in the browser if you use such an aforementioned tool, but you will need to stub `node:crypto` to do so. Consider the following example in Webpack using a plugin:

```javascript
{
    // ...

    plugins: [
        new NormalModuleReplacementPlugin(/node:/, (resource) => {
            resource.request = resource.request.replace(/^node:/, "");
        })
    ]

    // ...
}
```
