import crypto from "node:crypto";
import { Layerr } from "layerr";
import { PRNG, ULID, ULIDFactory, UUID } from "./types.js";
import { crockfordDecode, crockfordEncode } from "./crockford.js";
import { ULID_REGEX, UUID_REGEX } from "./constants.js";

// These values should NEVER change. The values are precisely for
// generating ULIDs.
const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford's Base32
const ENCODING_LEN = 32; // from ENCODING.length;
const TIME_MAX = 281474976710655; // from Math.pow(2, 48) - 1;
const TIME_LEN = 10;
const RANDOM_LEN = 16;

const ERROR_INFO = Object.freeze({
    source: "ulid"
});

/**
 * Decode time from a ULID
 * @param id The ULID
 * @returns The decoded timestamp
 */
export function decodeTime(id: string): number {
    if (id.length !== TIME_LEN + RANDOM_LEN) {
        throw new Layerr(
            {
                info: {
                    code: "DEC_TIME_MALFORMED",
                    ...ERROR_INFO
                }
            },
            "Malformed ULID"
        );
    }
    const time = id
        .substr(0, TIME_LEN)
        .toUpperCase()
        .split("")
        .reverse()
        .reduce((carry, char, index) => {
            const encodingIndex = ENCODING.indexOf(char);
            if (encodingIndex === -1) {
                throw new Layerr(
                    {
                        info: {
                            code: "DEC_TIME_CHAR",
                            ...ERROR_INFO
                        }
                    },
                    `Time decode error: Invalid character: ${char}`
                );
            }
            return (carry += encodingIndex * Math.pow(ENCODING_LEN, index));
        }, 0);
    if (time > TIME_MAX) {
        throw new Layerr(
            {
                info: {
                    code: "DEC_TIME_CHAR",
                    ...ERROR_INFO
                }
            },
            `Malformed ULID: timestamp too large: ${time}`
        );
    }
    return time;
}

/**
 * Detect the best PRNG (pseudo-random number generator)
 * @param root The root to check from (global/window)
 * @returns The PRNG function
 */
export function detectPRNG(root?: any): PRNG {
    const rootLookup = root || detectRoot();
    const globalCrypto =
        (rootLookup && (rootLookup.crypto || rootLookup.msCrypto)) ||
        (typeof crypto !== "undefined" ? crypto : null);
    if (typeof globalCrypto?.getRandomValues === "function") {
        return (len: number) => {
            const buffer = new Uint8Array(len);
            globalCrypto.getRandomValues(buffer);
            return buffer;
        };
    } else if (typeof globalCrypto?.randomBytes === "function") {
        return (len: number) => globalCrypto.randomBytes(len);
    } else if (crypto?.randomBytes) {
        return (len: number) => crypto.randomBytes(len);
    }
    throw new Layerr(
        {
            info: {
                code: "PRNG_DETECT",
                ...ERROR_INFO
            }
        },
        "Failed to find a reliable PRNG"
    );
}

function detectRoot(): any {
    if (inWebWorker()) return self;
    if (typeof window !== "undefined") {
        return window;
    }
    if (typeof global !== "undefined") {
        return global;
    }
    if (typeof globalThis !== "undefined") {
        return globalThis;
    }
    return null;
}

/**
 * Random string generation using direct mapping from the random bytes (wastes 3 of the 8 bits each, as in the original pair). Uses a loop and string concatenation.
 * @param len Length to generate
 * @param prng The random number function to use
 * @returns A random base32 string
 */
export function encodeRandom(len: number, prng: PRNG): string {
    const rand: Uint8Array | Buffer = prng(len);

    let str = "";
    for (len--; len >= 0; len--) {
        str = str + ENCODING.charAt(rand[len] % 32);
    }
    return str;
}

/**
 * Encode the time portion of a ULID
 * @param now The current timestamp
 * @param len Length to generate
 * @returns The encoded time
 */
export function encodeTime(now: number, len: number): string {
    if (isNaN(now)) {
        throw new Layerr(
            {
                info: {
                    code: "ENC_TIME_NAN",
                    ...ERROR_INFO
                }
            },
            `Time must be a number: ${now}`
        );
    } else if (now > TIME_MAX) {
        throw new Layerr(
            {
                info: {
                    code: "ENC_TIME_SIZE_EXCEED",
                    ...ERROR_INFO
                }
            },
            `Cannot encode a time larger than ${TIME_MAX}: ${now}`
        );
    } else if (now < 0) {
        throw new Layerr(
            {
                info: {
                    code: "ENC_TIME_NEG",
                    ...ERROR_INFO
                }
            },
            `Time must be positive: ${now}`
        );
    } else if (Number.isInteger(now) === false) {
        throw new Layerr(
            {
                info: {
                    code: "ENC_TIME_TYPE",
                    ...ERROR_INFO
                }
            },
            `Time must be an integer: ${now}`
        );
    }
    let mod: number,
        str: string = "";
    for (let currentLen = len; currentLen > 0; currentLen--) {
        mod = now % ENCODING_LEN;
        str = ENCODING.charAt(mod) + str;
        now = (now - mod) / ENCODING_LEN;
    }
    return str;
}

/**
 * Fix a ULID's Base32 encoding -
 * i and l (case-insensitive) will be treated as 1 and o (case-insensitive) will be treated as 0.
 * hyphens are ignored during decoding.
 * @param id The ULID
 * @returns The cleaned up ULID
 */
export function fixULIDBase32(id: string): string {
    return id.replace(/i/gi, "1").replace(/l/gi, "1").replace(/o/gi, "0").replace(/-/g, "");
}

export function incrementBase32(str: string): string {
    let done: string = undefined,
        index = str.length,
        char: string,
        charIndex: number,
        output = str;
    const maxCharIndex = ENCODING_LEN - 1;
    while (!done && index-- >= 0) {
        char = output[index];
        charIndex = ENCODING.indexOf(char);
        if (charIndex === -1) {
            throw new Layerr(
                {
                    info: {
                        code: "B32_INC_ENC",
                        ...ERROR_INFO
                    }
                },
                "Incorrectly encoded string"
            );
        }
        if (charIndex === maxCharIndex) {
            output = replaceCharAt(output, index, ENCODING[0]);
            continue;
        }
        done = replaceCharAt(output, index, ENCODING[charIndex + 1]);
    }
    if (typeof done === "string") {
        return done;
    }
    throw new Layerr(
        {
            info: {
                code: "B32_INC_INVALID",
                ...ERROR_INFO
            }
        },
        "Failed incrementing string"
    );
}

function inWebWorker(): boolean {
    // @ts-ignore
    return typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope;
}

/**
 * Check if a ULID is valid
 * @param id The ULID to test
 * @returns True if valid, false otherwise
 * @example
 *   isValid("01HNZX8JGFACFA36RBXDHEQN6E"); // true
 *   isValid(""); // false
 */
export function isValid(id: string): boolean {
    return (
        typeof id === "string" &&
        id.length === TIME_LEN + RANDOM_LEN &&
        id
            .toUpperCase()
            .split("")
            .every(char => ENCODING.indexOf(char) !== -1)
    );
}

/**
 * Create a ULID factory to generate monotonically-increasing
 *  ULIDs
 * @param prng The PRNG to use
 * @returns A ulid factory
 * @example
 *  const ulid = monotonicFactory();
 *  ulid(); // "01HNZXD07M5CEN5XA66EMZSRZW"
 */
export function monotonicFactory(prng?: PRNG): ULIDFactory {
    const currentPRNG = prng || detectPRNG();
    let lastTime: number = 0,
        lastRandom: string;
    return function _ulid(seedTime?: number): ULID {
        const seed = isNaN(seedTime) ? Date.now() : seedTime;
        if (seed <= lastTime) {
            const incrementedRandom = (lastRandom = incrementBase32(lastRandom));
            return encodeTime(lastTime, TIME_LEN) + incrementedRandom;
        }
        lastTime = seed;
        const newRandom = (lastRandom = encodeRandom(RANDOM_LEN, currentPRNG));
        return encodeTime(seed, TIME_LEN) + newRandom;
    };
}

export function replaceCharAt(str: string, index: number, char: string): string {
    if (index > str.length - 1) {
        return str;
    }
    return str.substr(0, index) + char + str.substr(index + 1);
}

/**
 * Generate a ULID
 * @param seedTime Optional time seed
 * @param prng Optional PRNG function
 * @returns A ULID string
 * @example
 *  ulid(); // "01HNZXD07M5CEN5XA66EMZSRZW"
 */
export function ulid(seedTime?: number, prng?: PRNG): ULID {
    const currentPRNG = prng || detectPRNG();
    const seed = isNaN(seedTime) ? Date.now() : seedTime;
    return encodeTime(seed, TIME_LEN) + encodeRandom(RANDOM_LEN, currentPRNG);
}

/**
 * Convert a ULID to a UUID
 * @param ulid The ULID to convert
 * @returns A UUID string
 */
export function ulidToUUID(ulid: string): UUID {
    const isValid = ULID_REGEX.test(ulid);
    if (!isValid) {
        throw new Layerr({ info: { code: "INVALID_ULID", ...ERROR_INFO } }, "Invalid ULID");
    }
    const uint8Array = crockfordDecode(ulid);
    let uuid = Array.from(uint8Array)
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");
    uuid =
        uuid.substring(0, 8) +
        "-" +
        uuid.substring(8, 12) +
        "-" +
        uuid.substring(12, 16) +
        "-" +
        uuid.substring(16, 20) +
        "-" +
        uuid.substring(20);
    return uuid;
}

/**
 * Convert a UUID to a ULID
 * @param uuid The UUID to convert
 * @returns A ULID string
 */
export function uuidToULID(uuid: string): ULID {
    const isValid = UUID_REGEX.test(uuid);
    if (!isValid) {
        throw new Layerr({ info: { code: "INVALID_UUID", ...ERROR_INFO } }, "Invalid UUID");
    }
    const uint8Array = new Uint8Array(
        uuid
            .replace(/-/g, "")
            .match(/.{1,2}/g)
            .map(byte => parseInt(byte, 16))
    );
    return crockfordEncode(uint8Array);
}
