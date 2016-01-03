/*global describe it beforeEach afterEach*/
"use strict";
"use server";

var jsonm = require("./jsonm");
var assert = require("assert");
var TYPE_ARRAY = 0;
var TYPE_VALUE = 1;
var TYPE_STRING = 2;

describe("jsonm", function() {
    var packer;
    var unpacker;
    
    this.timeout(15000);
    
    beforeEach(function(next) {
        packer = new jsonm.Packer();
        unpacker = new jsonm.Unpacker();
        packer.$pack = packer.pack;
        packer.pack = function(object, unpackerConfig) {
            return this.$pack(object, unpackerConfig || unpacker.getPackerConfig());
        };
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

        packed = packer.pack(input);
        assert.deepEqual(packed, [3, 4, 5, 6, 7]);
        assert.deepEqual(unpacker.$getDict(), ["foo", "bar", 1, 2]);
        unpacked = unpacker.unpack(packed);
        
        packed = packer.pack(input);
        assert.deepEqual(packed, [3, 4, 5, 6, 7]);
        unpacked = unpacker.unpack(packed);
        
        assert.deepEqual(unpacked, input);
    });
    
    it("handles strings and ints with the same value", function() {
        var input = { foo: 1, bar: "1" };
        var packed = packer.pack(input);
        assert.deepEqual(packed, ["foo", "bar", "1", "~1", 3]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
        assert(unpacked.foo === 1);
        assert(unpacked.bar === "1");
    });
    
    it("handles unpacker gc", function() {
        var input = { foo: 1, bar: 2 };
        var packed = packer.pack(input);
        assert.deepEqual(packed, ["foo", "bar", "1", "2", 3]);
        var unpacked = unpacker.unpack(packed);
        
        packed = packer.pack(input);
        assert.deepEqual(packed, [3, 4, 5, 6, 7]);
        unpacked = unpacker.unpack(packed);
        
        unpacker.$gc(5); // gc memoized 3="foo" and 4="1"
        
        packed = packer.pack(input);
        assert.deepEqual(packed, ["foo", "bar", 5, 6, 7]);
        unpacked = unpacker.unpack(packed);
        
        unpacker.$gc(7); // gc memoized 4="bar" and 5="2"
        
        packed = packer.pack(input);
        assert.deepEqual(packed, [7, 8, "1", "2", 9]);
        unpacked = unpacker.unpack(packed);
        
        assert.deepEqual(unpacked, input);
    });
    
    it("handles packer gc", function() {
        var input = { foo: 1, bar: 2 };
        var packed = packer.pack(input);
        assert.deepEqual(packed, ["foo", "bar", "1", "2", 3]);
        var unpacked = unpacker.unpack(packed);
        
        packed = packer.pack(input);
        assert.deepEqual(packed, [3, 4, 5, 6, 7]);
        unpacked = unpacker.unpack(packed);
        
        assert.deepEqual(packer.$getDict(), ["foo", "bar", 1, 2]);
        packer.$gc(5, 2); // gc memoized 3="foo" and 4="bar"
        packed = packer.pack(input);
        assert.deepEqual(packed, ["foo", "bar", 5, 6, 7]);
        unpacked = unpacker.unpack(packed);
        
        assert.deepEqual(packer.$getDict(), [1, 2, "foo", "bar"]);
        packer.$gc(7, 2); // gc memoized 5=1 and 6=2
        packed = packer.pack(input);
        assert.deepEqual(packed, [7, 8, "1", "2", 9]);
        unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs multi-line strings as normal values", function() {
        var input = "hello there\nthis is\r\na multi-line string";
        var packed = packer.pack(input);
        assert.deepEqual(packed, [TYPE_VALUE, "hello there\nthis is\r\na multi-line string", 3]);
        
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs multi-line strings as separate values in string packing mode", function() {
        var input = "hello there\nthis is\r\na multi-line string";
        var packed = packer.packString(input);
        assert.deepEqual(packed, [TYPE_STRING, "hello there", "this is\r", "a multi-line string", 3]);
        
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("supports calling unpack multiple times", function() {
        var input = { foo: 1 };
        var packed = packer.pack(input);
        assert.deepEqual(packed, ["foo", "1", 3]);
        
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacker.$getDict(), ["foo", 1]);
        assert.deepEqual(packed, ["foo", "1", 3]);
        assert.deepEqual(unpacked, input);
        
        unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacker.$getDict(), ["foo", 1]);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs JSON strings", function() {
        var input = '{"foo":1,"bar":2}';
        var packed = packer.packString(input);
        assert.deepEqual(packed, ["foo", "bar", "1", "2", 3]);
        
        var unpackedString = unpacker.unpackString(packed);
        assert.deepEqual(unpackedString, input);
        
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, JSON.parse(input));
    });
    
    it("has a symmetrical packString() and unpackString() for strings", function() {
        var input = "hello there\nthis is\r\na multi-line string";
        var packed = packer.packString(input);
        assert.deepEqual(packed, [TYPE_STRING, "hello there", "this is\r", "a multi-line string", 3]);
        
        var unpacked = unpacker.unpackString(packed);
        assert.deepEqual(unpacked, input);
    });
});