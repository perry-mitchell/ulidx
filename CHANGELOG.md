# ulidx changelog

## v2.4.0
_2024-08-02_

 * [#42](https://github.com/perry-mitchell/ulidx/pull/42) Upgrade dependencies
 * [#40](https://github.com/perry-mitchell/ulidx/pull/40) Mark sideEffects as `false`
 * **Bugfix**:
   * [#41](https://github.com/perry-mitchell/ulidx/pull/41) Fix CommonJS types

## v2.3.0
_2024-02-06_

 * [#28](https://github.com/perry-mitchell/ulidx/issues/28) `ulidToUUID` and `uuidToULID` conversion helpers for ULID/UUID

## v2.2.1
_2023-10-10_

 * **Bugfixes**:
   * [#33](https://github.com/perry-mitchell/ulidx/pull/33): Use prepare instead of postinstall for git hooks

## v2.2.0
_2023-10-10_

 * [#30](https://github.com/perry-mitchell/ulidx/pull/30): `MIN_ULID` / `MAX_ULID` constants

## v2.1.0
_2023-07-23_

 * [#13](https://github.com/perry-mitchell/ulidx/issues/13): First-party support for Cloudflare workers
   * `worker` export definition
 * React-Native export definition

## v2.0.0
_2023-06-04_

 * Multiple builds for different environments:
   * Node ESM
   * Node CJS
   * Browser ESM
   * Browser CJS
 * [#24](https://github.com/perry-mitchell/ulidx/pull/24): Add `globalThis` to support Vercel Edge runtime

## v1.0.0
_2023-05-03_

 * ESM
   * CommonJS/ESM builds
 * Node 16 minimum
 * **Bugfixes**:
   * [#19](https://github.com/perry-mitchell/ulidx/issues/19): `decodeTime` fails on lower-case ULIDs

## v0.5.0
_2023-02-12_

 * `fixULIDBase32` method for cleaning up ULIDs by checking their Base32 encoding

## v0.4.0
_2022-12-31_

 * `isValid` utility for checking for valid ULIDs

## v0.3.0
_2022-01-01_

 * **Bugfixes**:
   * [#4](https://github.com/perry-mitchell/ulidx/issues/4): `ulid` error in Node REPL

## v0.2.0
_2021-09-24_

 * `decodeTime` helper

## v0.1.0
_2021-06-05_

 * Initial release

