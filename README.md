# ulidx
> ULID generator for NodeJS and the browser

ULID generator library, based off of the original [ulid](https://github.com/ulid/javascript) for NodeJS and the browser. ULIDs are Universally Unique Lexicographically Sortable Identifiers. This library adheres to [this specification](https://github.com/ulid/spec).

> The original [ulid](https://github.com/ulid/javascript) is no longer maintained, and has several outstanding compatibility-related issues that were never addressed. This library aims to address those and remain compatible in a larger range of environments.

## Installation

Install using npm by running: `npm install ulidx --save`.

`ulidx` provides types and is written entirely in Typescript.

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

## Pseudo-Random Number Generation (PRNG)

`ulidx` will attempt to locate a suitable cryptographically-secure random number generator in the environment where it's loaded. On NodeJS this will be `crypto.randomBytes` and in the browser it will be `crypto.getRandomValues`.

`Math.random()` is **not supported**: The environment _must_ have a suitable crypto random number generator.

## Compatibility

`ulidx` is compatible with the following environments:

 * NodeJS 10 and up
 * Browsers with working `crypto` / `msCrypto` libraries
   * Web workers

### Goals

React-Native support, with synchronous PRNG is a goal of this library. No ETA, however.
