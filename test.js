/*global describe it beforeEach afterEach*/
"use strict";
"use server";

var jsonm = require("./jsonm");
var assert = require("assert");
var TYPE_ARRAY = 0;
var TYPE_VALUE = 1;

describe("jsonm", function() {
    var packer;
    var unpacker;
    
    this.timeout(15000);
    
    beforeEach(function(next) {
        packer = new jsonm.Packer();
        unpacker = new jsonm.Unpacker();
        next();
    });
    
    it("packs small ints as string values", function() {
        var input = { foo: 1 };
        var packed = packer.pack(input);
        assert.deepEqual(packed, ["foo", "1", 3]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs large ints as string values", function() {
        var input = { foo: 1000 };
        var packed = packer.pack(input);
        assert.deepEqual(packed, ["foo", "1000", 3]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs arrays using a -1", function() {
        var input = [0, 1, 2];
        var packed = packer.pack(input);
        assert.deepEqual(packed, [TYPE_ARRAY, 0, "1", "2", 3]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs floats just fine", function() {
        var input = 1.5;
        var packed = packer.pack(input);
        assert.deepEqual(packed, [TYPE_VALUE, "1.5", 3]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs true just fine", function() {
        var input = true;
        var packed = packer.pack(input);
        assert.deepEqual(packed, [TYPE_VALUE, true, 3]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs arrays with minus 1 just fine", function() {
        var input = [-1];
        var packed = packer.pack(input);
        assert.deepEqual(packed, [TYPE_ARRAY, "-1", 3]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs empty arrays just fine", function() {
        var input = [];
        var packed = packer.pack(input);
        assert.deepEqual(packed, [TYPE_ARRAY, 3]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs number strings just fine", function() {
        var input = "1";
        var packed = packer.pack(input);
        assert.deepEqual(packed, [TYPE_VALUE, "~1", 3]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs dot number strings just fine", function() {
        var input = ".1";
        var packed = packer.pack(input);
        assert.deepEqual(packed, [TYPE_VALUE, "~.1", 3]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs tilde strings just fine", function() {
        var input = "~1";
        var packed = packer.pack(input);
        assert.deepEqual(packed, [TYPE_VALUE, "~~1", 3]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs tilde tilde strings just fine", function() {
        var input = "~~1";
        var packed = packer.pack(input);
        assert.deepEqual(packed, [TYPE_VALUE, "~~~1", 3]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs multi-key objects", function() {
        var input = { foo: 1, bar: 2 };
        var packed = packer.pack(input);
        assert.deepEqual(packed, ["foo", "bar", "1", "2", 3]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs nested, multi-key objects", function() {
        var input = { foo: 1, bar: 2, baz: { qux: 3 } };
        var packed = packer.pack(input);
        assert.deepEqual(packed, ["foo", "bar", "baz", "1", "2", ["qux", "3"], 3]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs nested arrays and objects", function() {
        var input = [{a:[[{b:12}]]}];
        var packed = packer.pack(input);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("uses memoization the second time", function() {
        var input = { foo: 1, bar: 2 };
        var packed = packer.pack(input);
        assert.deepEqual(packed, ["foo", "bar", "1", "2", 3]);
        var unpacked = unpacker.unpack(packed);
        packer.setDictOptions(unpacker.getDictOptions());
        
        packed = packer.pack(input);
        assert.deepEqual(packed, [3, 5, 4, 6, 7]);
        unpacked = unpacker.unpack(packed);
        
        packed = packer.pack(input);
        assert.deepEqual(packed, [3, 5, 4, 6, 7]);
        unpacked = unpacker.unpack(packed);
        
        assert.deepEqual(unpacked, input);
    });
});