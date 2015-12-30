/*global describe it beforeEach afterEach*/
"use strict";
"use server";

var jsonm = require("./jsonm");
var assert = require("assert");

describe("jsonm", function() {
    var packer;
    var unpacker;
    
    this.timeout(15000);
    
    beforeEach(function(next) {
        packer = new jsonm.Packer();
        unpacker = new jsonm.Unpacker();
        next();
    });
    
    it("packs small ints as values", function() {
        var input = { foo: 1 };
        var packed = packer.pack(input);
        assert.deepEqual(packed, [[0, 1], 0, "foo", 1]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs large ints as values", function() {
        var input = { foo: 1000 };
        var packed = packer.pack(input);
        assert.deepEqual(packed, [[0, 1], 0, "foo", 1000]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs arrays with a -1", function() {
        var input = [0, 1, 2];
        var packed = packer.pack(input);
        assert.deepEqual(packed, [[-1, 0, 1, 2], 0, 0, 1, 2]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs floats just fine", function() {
        var input = 1.5;
        var packed = packer.pack(input);
        assert.deepEqual(packed, [0, 0, 1.5]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs multi-key objects", function() {
        var input = { foo: 1, bar: 2 };
        var packed = packer.pack(input);
        assert.deepEqual(packed, [[0, 2, 1, 3], 0, "foo", 1, "bar", 2]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
});