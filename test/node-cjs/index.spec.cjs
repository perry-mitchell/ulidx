const { expect } = require("chai");
const sinon = require("sinon");
const {
    MAX_ULID,
    MIN_ULID,
    decodeTime,
    detectPRNG,
    encodeTime,
    fixULIDBase32,
    isValid,
    monotonicFactory,
    ulid
} = require("../../dist/node/index.cjs");

describe("ulid", function() {
    describe("decodeTime", function() {
        it("should return correct timestamp", function() {
            const timestamp = Date.now();
            const id = ulid(timestamp);
            expect(decodeTime(id)).to.equal(timestamp);
        });

        it("should return correct timestamp for README example", function() {
            const id = "01ARYZ6S41TSV4RRFFQ69G5FAV";
            expect(decodeTime(id)).to.equal(1469918176385);
        });

        it("should support decoding lower-case ULIDs", function() {
            const id = "01aryz6s41tsv4rrffq69g5fav";
            expect(decodeTime(id)).to.equal(1469918176385);
        });

        it("should accept the maximum allowed timestamp", function() {
            expect(decodeTime("7ZZZZZZZZZZZZZZZZZZZZZZZZZ")).to.equal(281474976710655);
        });

        describe("should reject", function() {
            it("malformed strings of incorrect length", function() {
                expect(() => {
                    decodeTime("FFFF");
                }).to.throw(/Malformed ULID/);
            });

            it("strings with timestamps that are too high", function() {
                expect(() => {
                    decodeTime("80000000000000000000000000");
                }).to.throw(/Malformed ULID: timestamp too large/);
            });
        });
    });

    describe("detectPRNG", function() {
        it("should return a function", function() {
            expect(detectPRNG()).to.be.a("function");
        });

        describe("returned function", function() {
            beforeEach(function() {
                this.prng = detectPRNG();
            });

            it("should produce a number", function() {
                expect(this.prng()).to.be.a("number");
                expect(this.prng()).to.satisfy(num => !isNaN(num));
            });

            it("should be between 0 and 1", function() {
                expect(this.prng()).to.satisfy(num => num >= 0 && num <= 1);
            });
        });
    });

    describe("encodeTime", function() {
        it("should return expected encoded result", function() {
            expect(encodeTime(1469918176385, 10)).to.equal("01ARYZ6S41");
        });

        it("should change length properly", function() {
            expect(encodeTime(1470264322240, 12)).to.equal("0001AS99AA60");
        });

        it("should truncate time if not enough length", function() {
            expect(encodeTime(1470118279201, 8)).to.equal("AS4Y1E11");
        });

        describe("should throw an error", function() {
            it("if time greater than (2 ^ 48) - 1", function() {
                expect(() => {
                    encodeTime(Math.pow(2, 48), 8);
                }).to.throw(/Cannot encode a time larger than/);
            });

            it("if time is not a number", function() {
                expect(() => {
                    encodeTime("test");
                }).to.throw(/Time must be a number/);
            });

            it("if time is infinity", function() {
                expect(() => {
                    encodeTime(Infinity);
                }).to.throw(/Cannot encode a time larger than/);
            });

            it("if time is negative", function() {
                expect(() => {
                    encodeTime(-1);
                }).to.throw(/Time must be positive/);
            });

            it("if time is a float", function() {
                expect(() => {
                    encodeTime(100.1);
                }).to.throw(/Time must be an integer/);
            });
        });
    });

    describe("fixULIDBase32", function() {
        it("should return the same ULID if no typos or hyphens are present", function() {
            expect(fixULIDBase32("01ARYZ6S41TSV4RRFFQ69G5FAV")).to.equal(
                "01ARYZ6S41TSV4RRFFQ69G5FAV"
            );
        });

        it("should return the correct ULID with typos fixed", function() {
            expect(fixULIDBase32("oLARYZ6S41TSV4RRFFQ69G5FAV")).to.equal(
                "01ARYZ6S41TSV4RRFFQ69G5FAV"
            );
        });

        it("should return the correct ULID with hyphens removed", function() {
            expect(fixULIDBase32("01ARYZ6-S41TSV4RRF-FQ69G5FAV")).to.equal(
                "01ARYZ6S41TSV4RRFFQ69G5FAV"
            );
        });

        it("should return the correct ULID with typos fixed and hyphens removed", function() {
            expect(fixULIDBase32("oLARYZ6-S41TSV4RRF-FQ69G5FAV")).to.equal(
                "01ARYZ6S41TSV4RRFFQ69G5FAV"
            );
        });
    });

    describe("isValid", function() {
        it("should return true for valid ULIDs (uppercase)", function() {
            expect(isValid("01ARYZ6S41TSV4RRFFQ69G5FAV")).to.be.true;
        });

        it("should return true for valid ULIDs (lowercase)", function() {
            expect(isValid("01aryz6s41tsv4rrffq69g5fav")).to.be.true;
        });

        it("should return false for invalid ULIDs (wrong length)", function() {
            expect(isValid("01ARYZ6S41TSV4RRFFQ69G5FA")).to.be.false;
        });

        it("should return false for invalid ULIDs (wrong characters)", function() {
            expect(isValid("01ARYZ6S41TSV4RRFFQ69G5FA!")).to.be.false;
        });

        it("should return false for invalid ULIDs (wrong type)", function() {
            expect(isValid(123)).to.be.false;
        });
    });

    describe("monotonicFactory", function() {
        it("outputs a function", function() {
            expect(monotonicFactory()).to.be.a("function");
        });

        describe("returned function", function() {
            before(function() {
                this.prng = sinon.stub().returns(0.96);
            });

            describe("without seedTime", function() {
                before(function() {
                    this.clock = sinon.useFakeTimers({
                        now: 1469918176385,
                        toFake: ["Date"]
                    });
                    this.ulid = monotonicFactory(this.prng);
                });

                after(function() {
                    this.clock.restore();
                });

                it("first call", function() {
                    expect(this.ulid()).to.equal("01ARYZ6S41YYYYYYYYYYYYYYYY");
                });

                it("second call", function() {
                    expect(this.ulid()).to.equal("01ARYZ6S41YYYYYYYYYYYYYYYZ");
                });

                it("third call", function() {
                    expect(this.ulid()).to.equal("01ARYZ6S41YYYYYYYYYYYYYYZ0");
                });

                it("fourth call", function() {
                    expect(this.ulid()).to.equal("01ARYZ6S41YYYYYYYYYYYYYYZ1");
                });
            });
        });
    });

    describe("ulid", function() {
        it("should return correct length", function() {
            expect(ulid()).to.have.a.lengthOf(26);
        });

        it("should return expected encoded time component result", function() {
            expect(ulid(1469918176385).substring(0, 10)).to.equal("01ARYZ6S41");
        });
    });

    describe("constants", function () {
        it("should export MIN_ULID", function () {
            expect(MIN_ULID).to.equal("00000000000000000000000000");
        });

        it("should export MAX_ULID", function () {
            expect(MAX_ULID).to.equal("7ZZZZZZZZZZZZZZZZZZZZZZZZZ");
        });
    });
});
