import { Layerr } from "layerr";
import { PRNG, ULID, ULIDFactory } from "./types";

// These values should NEVER change. The values are precisely for
// generating ULIDs.
const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford's Base32
const ENCODING_LEN = ENCODING.length;
const TIME_MAX = Math.pow(2, 48) - 1;
const TIME_LEN = 10;
const RANDOM_LEN = 16;

const ERROR_INFO = Object.freeze({
    source: "ulid"
});

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

export function detectPRNG(root?: any): PRNG {
    const rootLookup = root || detectRoot();
    const globalCrypto =
        (rootLookup && (rootLookup.crypto || rootLookup.msCrypto)) ||
        (typeof crypto !== "undefined" ? crypto : null);
    if (typeof globalCrypto?.getRandomValues === "function") {
        return () => {
            const buffer = new Uint8Array(1);
            globalCrypto.getRandomValues(buffer);
            return buffer[0] / 0xff;
        };
    } else if (typeof globalCrypto?.randomBytes === "function") {
        return () => globalCrypto.randomBytes(1).readUInt8() / 0xff;
    } else {
        try {
            const nodeCrypto = require("crypto");
            return () => nodeCrypto.randomBytes(1).readUInt8() / 0xff;
        } catch (e) {}
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
    return null;
}

export function encodeRandom(len: number, prng: PRNG): string {
    let str = "";
    for (; len > 0; len--) {
        str = randomChar(prng) + str;
    }
    return str;
}

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

export function randomChar(prng: PRNG): string {
    let rand = Math.floor(prng() * ENCODING_LEN);
    if (rand === ENCODING_LEN) {
        rand = ENCODING_LEN - 1;
    }
    return ENCODING.charAt(rand);
}

export function replaceCharAt(str: string, index: number, char: string): string {
    if (index > str.length - 1) {
        return str;
    }
    return str.substr(0, index) + char + str.substr(index + 1);
}

export function ulid(seedTime?: number, prng?: PRNG): ULID {
    const currentPRNG = prng || detectPRNG();
    const seed = isNaN(seedTime) ? Date.now() : seedTime;
    return encodeTime(seed, TIME_LEN) + encodeRandom(RANDOM_LEN, currentPRNG);
}

// isValid() is a function that checks if a given string is a valid ULID.
// checks:
// - is a string
// - every character is in the ENCODING string, and is the correct length
export function isValid(id: string): boolean {
    return (
        typeof id === "string" &&
        id.length === TIME_LEN + RANDOM_LEN &&
        id.split("").every(char => {
            return ENCODING.indexOf(char.toUpperCase()) !== -1;
        })
    );
}
