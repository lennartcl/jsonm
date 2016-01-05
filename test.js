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
        unpacker = new jsonm.Unpacker();
        packer = new jsonm.Packer();
        next();
    });
    
    it("packs small ints as string values", function() {
        var input = { foo: 1 };
        var packed = packer.pack(input, unpacker.getPackerConfig());
        assert.deepEqual(packed, ["foo", "1", 0]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs large ints as string values", function() {
        var input = { foo: 1000 };
        var packed = packer.pack(input, unpacker.getPackerConfig());
        assert.deepEqual(packed, ["foo", "1000", 0]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs arrays using a -1", function() {
        var input = [0, 1, 2];
        var packed = packer.pack(input, unpacker.getPackerConfig());
        assert.deepEqual(packed, [TYPE_ARRAY, 0, "1", "2", 0]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs floats just fine", function() {
        var input = 1.5;
        var packed = packer.pack(input, unpacker.getPackerConfig());
        assert.deepEqual(packed, [TYPE_VALUE, "1.5", 0]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs true just fine", function() {
        var input = true;
        var packed = packer.pack(input, unpacker.getPackerConfig());
        assert.deepEqual(packed, [TYPE_VALUE, true, 0]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs arrays with minus 1 just fine", function() {
        var input = [-1];
        var packed = packer.pack(input, unpacker.getPackerConfig());
        assert.deepEqual(packed, [TYPE_ARRAY, "-1", 0]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs empty arrays just fine", function() {
        var input = [];
        var packed = packer.pack(input, unpacker.getPackerConfig());
        assert.deepEqual(packed, [TYPE_ARRAY, 0]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs number strings just fine", function() {
        var input = "1";
        var packed = packer.pack(input, unpacker.getPackerConfig());
        assert.deepEqual(packed, [TYPE_VALUE, "~1", 0]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs dot number strings just fine", function() {
        var input = ".1";
        var packed = packer.pack(input, unpacker.getPackerConfig());
        assert.deepEqual(packed, [TYPE_VALUE, "~.1", 0]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs tilde strings just fine", function() {
        var input = "~1";
        var packed = packer.pack(input, unpacker.getPackerConfig());
        assert.deepEqual(packed, [TYPE_VALUE, "~~1", 0]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs tilde tilde strings just fine", function() {
        var input = "~~1";
        var packed = packer.pack(input, unpacker.getPackerConfig());
        assert.deepEqual(packed, [TYPE_VALUE, "~~~1", 0]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs multi-key objects", function() {
        var input = { foo: 1, bar: 2 };
        var packed = packer.pack(input, unpacker.getPackerConfig());
        assert.deepEqual(packed, ["foo", "bar", "1", "2", 0]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs nested, multi-key objects", function() {
        var input = { foo: 1, bar: 2, baz: { qux: 3 } };
        var packed = packer.pack(input, unpacker.getPackerConfig());
        assert.deepEqual(packed, ["foo", "bar", "baz", "1", "2", ["qux", "3"], 0]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs nested arrays and objects", function() {
        var input = [{a:[[{b:12}]]}];
        var packed = packer.pack(input, unpacker.getPackerConfig());
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("uses memoization the second time", function() {
        var input = { foo: 1, bar: 2 };
        var packed = packer.pack(input, unpacker.getPackerConfig());
        assert.deepEqual(packed, ["foo", "bar", "1", "2", 0]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);

        packed = packer.pack(input, unpacker.getPackerConfig());
        assert.deepEqual(packed, [3, 4, 5, 6, 1]);
        assert.deepEqual(unpacker.$getDict(), ["foo", "bar", 1, 2]);
        unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
        
        packed = packer.pack(input, unpacker.getPackerConfig());
        assert.deepEqual(packed, [3, 4, 5, 6, 2]);
        unpacked = unpacker.unpack(packed);
        
        assert.deepEqual(unpacked, input);
    });
    
    it("handles strings and ints with the same value", function() {
        var input = { foo: 1, bar: "1" };
        var packed = packer.pack(input, unpacker.getPackerConfig());
        assert.deepEqual(packed, ["foo", "bar", "1", "~1", 0]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
        assert(unpacked.foo === 1);
        assert(unpacked.bar === "1");
    });
    
    it("packs multi-line strings as normal values", function() {
        var input = "hello there\nthis is\r\na multi-line string";
        var packed = packer.pack(input, unpacker.getPackerConfig());
        assert.deepEqual(packed, [TYPE_VALUE, "hello there\nthis is\r\na multi-line string", 0]);
        
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs multi-line strings as separate values in string packing mode", function() {
        var input = "hello there\nthis is\r\na multi-line string";
        var packed = packer.packString(input, unpacker.getPackerConfig());
        assert.deepEqual(packed, [TYPE_STRING, "hello there", "this is\r", "a multi-line string", 0]);
        
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("copes with calling unpack multiple times", function() {
        var input = { foo: 1 };
        var packed = packer.pack(input, unpacker.getPackerConfig());
        assert.deepEqual(packed, ["foo", "1", 0]);
        
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacker.$getDict(), ["foo", 1]);
        assert.deepEqual(unpacked, input);
        
        try {
            unpacked = unpacker.unpack(packed);
        }
        catch (e) {
            assert.equal(e.code, "EOLD");
        }
    });
    
    it("packs JSON strings", function() {
        var input = '{"foo":1,"bar":2}';
        var packed = packer.packString(input, unpacker.getPackerConfig());
        assert.deepEqual(packed, ["foo", "bar", "1", "2", 0]);
        
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, JSON.parse(input));
    });
    
    it("packs JSON strings and can unpack them as string", function() {
        var input = '{"foo":1,"bar":2}';
        var packed = packer.packString(input, unpacker.getPackerConfig());
        assert.deepEqual(packed, ["foo", "bar", "1", "2", 0]);
        
        var unpacked = unpacker.unpackString(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("has a symmetrical packString() and unpackString() for strings", function() {
        var input = "hello there\nthis is\r\na multi-line string";
        var packed = packer.packString(input, unpacker.getPackerConfig());
        assert.deepEqual(packed, [TYPE_STRING, "hello there", "this is\r", "a multi-line string", 0]);
        
        var unpacked = unpacker.unpackString(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("has no issues going over the dictionary size", function() {
        unpacker.setMaxDictSize(99);
        for (var i = 0; i < 500; i++) {
            var input = { foo: 50, bar: 60, baz: i, qux: i + 1 };
            var packed = packer.pack(input, unpacker.getPackerConfig());
            var unpacked = unpacker.unpack(packed);
            assert.deepEqual(unpacked, input);
            assert(unpacker.$getDict().length <= 120, unpacker.$getDict().length);
            assert(packer.$getDict().length <= 120, packer.$getDict().length);
        }
    });
    
    it("handles the packer being reset", function() {
        function sendMessages() {
            for (var i = 0; i < 100; i++) {
                var input = { foo: 50, bar: 60, baz: i, qux: i + 1 };
                var packed = packer.pack(input, unpacker.getPackerConfig());
                var unpacked = unpacker.unpack(packed);
                assert.deepEqual(unpacked, input);
            }
        }
        
        sendMessages();
        packer = new jsonm.Packer();
        sendMessages();
    });
    
    it("copes with the unpacker being reset before a message", function() {
        var input = { foo: 50, bar: 60 };
        var packed = packer.pack(input, unpacker.getPackerConfig());
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
        
        unpacker = new jsonm.Unpacker();
        packed = packer.pack(input, unpacker.getPackerConfig());
        unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("errors when the packer is reset during a message", function() {
        var input = { foo: 50, bar: 60 };
        var packed = packer.pack(input, unpacker.getPackerConfig());
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
        
        packed = packer.pack(input, unpacker.getPackerConfig());
        unpacker = new jsonm.Unpacker();
        try {
            unpacked = unpacker.unpack(packed);
        }
        catch (e) {
            return;
        }
        assert(false);
    });
    
    it("handles messages with more values than the dictionary size", function() {
        unpacker.setMaxDictSize(50);
        var input = [];
        for (var i = 0; i < 50; i++) {
            input.push(i);
        }
        for (var i = 0; i < 49; i++) {
            input.push(i);
        }
        for (var i = 0; i < 51; i++) {
            input.push(i);
        }
        for (var i = 0; i < 120; i++) {
            input.push(i);
        }
        var packed = packer.pack(input, unpacker.getPackerConfig());
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);

        packed = packer.pack(input, unpacker.getPackerConfig());
        unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
});