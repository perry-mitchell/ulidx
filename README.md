# ulid-workers

> Zero dependency ULID generator for Cloudflare Workers

ULID generator library for [Cloudflare Workers](https://developers.cloudflare.com/workers/), based off of the fork [ulidx](https://github.com/perry-mitchell/ulidx) which in turn was based on the original [ulid](https://github.com/ulid/javascript) for NodeJS and the browser.

ULIDs are Universally Unique Lexicographically Sortable Identifiers. This library adheres to [this specification](https://github.com/ulid/spec).

> The original [ulid](https://github.com/ulid/javascript) is no longer maintained, and has several outstanding compatibility-related issues that were never addressed. This library aims to address those and remain compatible in a larger range of environments.

## Installation

Install using npm by running: `npm install ulid-workers --save`.

`ulid-workers` provides types and is written entirely in Typescript.

## Usage

Import `ulid-workers` to generate new ULIDs:

```typescript
import { ulid } from "ulid-workers";

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
import { monotonicFactory } from "ulid-workers";

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
import { decodeTime } from "ulid-workers";

// Extract milliseconds since UNIX Epoch from ULID
decodeTime("01ARYZ6S41TSV4RRFFQ69G5FAV"); // 1469918176385
```

## Pseudo-Random Number Generation (PRNG)

The Cloudflare Workers Runtime implements the [Web Crypto API](https://developers.cloudflare.com/workers/runtime-apis/web-crypto) (with some caveats). It does not provide Node's crypto module. Therefore, our Pseudo Random Number Generator (PRNG) uses `crypto.getRandomValues`.

## Date Seed for ULID Time

From the [Workers' docs](https://developers.cloudflare.com/workers/learning/security-model#step-1-disallow-timers-and-multi-threading):

> In Workers, you can get the current time using the JavaScript Date API, for example by calling `Date.now()`. However, the time value returned by this is not really the current time. Instead, it is the **time at which the network message was received** which caused the application to begin executing. While the application executes, time is locked in place.

For this reason we recommend you use the [monotonic ULID factory](#monotonic-ulid-factory).

## Compatibility

`ulid-workers` is compatible with Cloudflare Workers and Durable Objects.

### Goals

If it ain't broke don't fix it.
