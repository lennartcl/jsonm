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
        var packed = packer.pack(input);
        assert.deepEqual(packed, ["foo", "1", 0]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs large ints as string values", function() {
        var input = { foo: 1000 };
        var packed = packer.pack(input);
        assert.deepEqual(packed, ["foo", "1000", 0]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs arrays using a -1", function() {
        var input = [0, 1, 2];
        var packed = packer.pack(input);
        assert.deepEqual(packed, [TYPE_ARRAY, 0, "1", "2", 0]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs floats just fine", function() {
        var input = 1.5;
        var packed = packer.pack(input);
        assert.deepEqual(packed, [TYPE_VALUE, "1.5", 0]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs true just fine", function() {
        var input = true;
        var packed = packer.pack(input);
        assert.deepEqual(packed, [TYPE_VALUE, true, 0]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs arrays with minus 1 just fine", function() {
        var input = [-1];
        var packed = packer.pack(input);
        assert.deepEqual(packed, [TYPE_ARRAY, "-1", 0]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs empty arrays just fine", function() {
        var input = [];
        var packed = packer.pack(input);
        assert.deepEqual(packed, [TYPE_ARRAY, 0]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs number strings just fine", function() {
        var input = "1";
        var packed = packer.pack(input);
        assert.deepEqual(packed, [TYPE_VALUE, "~1", 0]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs dot number strings just fine", function() {
        var input = ".1";
        var packed = packer.pack(input);
        assert.deepEqual(packed, [TYPE_VALUE, "~.1", 0]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs tilde strings just fine", function() {
        var input = "~1";
        var packed = packer.pack(input);
        assert.deepEqual(packed, [TYPE_VALUE, "~~1", 0]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs tilde tilde strings just fine", function() {
        var input = "~~1";
        var packed = packer.pack(input);
        assert.deepEqual(packed, [TYPE_VALUE, "~~~1", 0]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs multi-key objects", function() {
        var input = { foo: 1, bar: 2 };
        var packed = packer.pack(input);
        assert.deepEqual(packed, ["foo", "bar", "1", "2", 0]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs nested, multi-key objects", function() {
        var input = { foo: 1, bar: 2, baz: { qux: 3 } };
        var packed = packer.pack(input);
        assert.deepEqual(packed, ["foo", "bar", "baz", "1", "2", ["qux", "3"], 0]);
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
        assert.deepEqual(packed, ["foo", "bar", "1", "2", 0]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);

        packed = packer.pack(input);
        assert.deepEqual(packed, [3, 4, 5, 6, 1]);
        assert.deepEqual(unpacker.$getDict(), [,,,"foo", "bar", 1, 2]);
        unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
        
        packed = packer.pack(input);
        assert.deepEqual(packed, [3, 4, 5, 6, 2]);
        unpacked = unpacker.unpack(packed);
        
        assert.deepEqual(unpacked, input);
    });
    
    it("handles strings and ints with the same value", function() {
        var input = { foo: 1, bar: "1" };
        var packed = packer.pack(input);
        assert.deepEqual(packed, ["foo", "bar", "1", "~1", 0]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
        assert(unpacked.foo === 1);
        assert(unpacked.bar === "1");
    });
    
    it("packs multi-line strings as normal values", function() {
        var input = "hello there\nthis is\r\na multi-line string";
        var packed = packer.pack(input);
        assert.deepEqual(packed, [TYPE_VALUE, "hello there\nthis is\r\na multi-line string", 0]);
        
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs multi-line strings as separate values in string packing mode", function() {
        var input = "hello there\nthis is\r\na multi-line string";
        var packed = packer.packString(input);
        assert.deepEqual(packed, [TYPE_STRING, "hello there", "this is\r", "a multi-line string", 0]);
        
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("copes with calling unpack multiple times", function() {
        var input = { foo: 1 };
        var packed = packer.pack(input);
        assert.deepEqual(packed, ["foo", "1", 0]);
        
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacker.$getDict(), [,,,"foo", 1]);
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
        var packed = packer.packString(input);
        assert.deepEqual(packed, ["foo", "bar", "1", "2", 0]);
        
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, JSON.parse(input));
    });
    
    it("packs JSON strings and can unpack them as string", function() {
        var input = '{"foo":1,"bar":2}';
        var packed = packer.packString(input);
        assert.deepEqual(packed, ["foo", "bar", "1", "2", 0]);
        
        var unpacked = unpacker.unpackString(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("has a symmetrical packString() and unpackString() for strings", function() {
        var input = "hello there\nthis is\r\na multi-line string";
        var packed = packer.packString(input);
        assert.deepEqual(packed, [TYPE_STRING, "hello there", "this is\r", "a multi-line string", 0]);
        
        var unpacked = unpacker.unpackString(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("has no issues going over a very small dictionary size", function() {
        unpacker.setMaxDictSize(6);
        packer.setMaxDictSize(6);
        var input = [1, 2, 3, 4];
        var packed = packer.pack(input);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
        
        input = [7, 8, 1, 2];
        packed = packer.pack(input);
        assert.deepEqual(packed, [TYPE_ARRAY, "7", "8", 3, 4, 1]);
        unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
        
        input = [1, 2, 5, 6, 1, 5];
        packed = packer.pack(input);
        assert.deepEqual(packed, [TYPE_ARRAY, 3, 4, "5", "6", "1", 3, 2]);
        unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
        
        input = { 5: 5, 10: 11, 12: 13 };
        packed = packer.pack(input);
        assert.deepEqual(packed, ["~5", "~10", "~12", 3, "11", "13", 3]);
        unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
        
        input = { 5: 5, 10: 11, 12: 14 };
        packed = packer.pack(input);
        assert.deepEqual(packed, [6, 7, 8, "5", 3, "14", 4]);
        unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("has no issues going over the dictionary size", function() {
        unpacker.setMaxDictSize(99);
        packer.setMaxDictSize(99);
        for (var i = 0; i < 500; i++) {
            var input = { foo: 50, bar: 60, baz: i, qux: i + 1 };
            var packed = packer.pack(input);
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
                var packed = packer.pack(input);
                var unpacked = unpacker.unpack(packed);
                assert.deepEqual(unpacked, input);
            }
        }
        
        sendMessages();
        packer = new jsonm.Packer();
        sendMessages();
    });
    
    it("errors when the packer is reset during a message", function() {
        var input = { foo: 50, bar: 60 };
        var packed = packer.pack(input);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
        
        packed = packer.pack(input);
        unpacker = new jsonm.Unpacker();
        try {
            unpacked = unpacker.unpack(packed);
        }
        catch (e) {
            return;
        }
        assert(false);
    });
    
    it("handles small messages with more values than the dictionary size", function() {
        unpacker.setMaxDictSize(5);
        packer.setMaxDictSize(5);
        var input = [1,2,3,4,5,1,2,3,4,5,6];
        var packed = packer.pack(input);
        assert.deepEqual(packed, [TYPE_ARRAY, "1", "2", "3", "4", "5", 3, 4, 5, 6, 7, "6", 0]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);

        packed = packer.pack(input);
        unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("handles small messages with more values than the dictionary size (2)", function() {
        unpacker.setMaxDictSize(4);
        packer.setMaxDictSize(4);
        var input = [1,2,3,4,1,2,3,4,1];
        var packed = packer.pack(input);
        assert.deepEqual(packed, [TYPE_ARRAY, "1", "2", "3", "4", 3, 4, 5, 6, 3, 0]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);

        packed = packer.pack(input);
        unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("handles small messages with more values than the dictionary size (3)", function() {
        unpacker.setMaxDictSize(3);
        packer.setMaxDictSize(3);
        var input = [1,2,3,4,1,2,3,4,1];
        var packed = packer.pack(input);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);

        packed = packer.pack(input);
        unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("handles large messages with more values than the dictionary size", function() {
        unpacker.setMaxDictSize(50);
        packer.setMaxDictSize(50);
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
        var packed = packer.pack(input);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);

        packed = packer.pack(input);
        unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs null", function() {
        var input = null;
        var packed = packer.pack(input);
        assert.deepEqual(packed, null);
        var unpacked = unpacker.unpack(packed);
        assert(unpacked === null, JSON.stringify(unpacked));
    });
    
    it("packs null inside an object", function() {
        var input = { foo: null };
        var packed = packer.pack(input);
        assert.deepEqual(packed, ["foo", null, 0]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input, JSON.stringify(unpacked));
        assert(unpacked.foo === null);
    });
    
    it("packs undefined", function() {
        var input = undefined;
        var packed = packer.pack(input);
        assert.deepEqual(packed, undefined);
        var unpacked = unpacker.unpack(packed);
        assert(unpacked === undefined, JSON.stringify(unpacked));
    });
    
    it("packs undefined inside an object", function() {
        var input = { foo: undefined };
        var packed = packer.pack(input);
        assert.deepEqual(packed, ["foo", undefined, 0]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input, JSON.stringify(unpacked));
        assert(unpacked.foo === undefined);
    });
    
    it("packs empty string", function() {
        var input = "";
        var packed = packer.pack(input);
        assert.deepEqual(packed, [TYPE_VALUE, "", 0]);
        var unpacked = unpacker.unpack(packed);
        assert.equal(unpacked, "");
    });
    
    it("packs empty string inside an object", function() {
        var input = { foo: "" };
        var packed = packer.pack(input);
        assert.deepEqual(packed, ["foo", "", 0]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input, JSON.stringify(unpacked));
        assert(unpacked.foo === "");
    });
    
    it("packs multiple empty strings inside an object", function() {
        var input = { foo: "", bar: "" };
        var packed = packer.pack(input);
        assert.deepEqual(packed, ["foo", "bar", "", 5, 0]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input, JSON.stringify(unpacked));
        assert(unpacked.foo === "");
    });
    
    it("copes with calling packString on a non-string, why not", function() {
        var input = 5;
        var packed = packer.packString(input);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("copes with calling packString on a null, why not", function() {
        var input = null;
        var packed = packer.packString(input);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("unpacks objects in strings", function() {
        var input = 42;
        var packedString = JSON.stringify(packer.pack(input));
        assert.deepEqual(packedString, '[1,"42",0]');
        var unpacked = unpacker.unpack(packedString);
        assert.deepEqual(unpacked, input, JSON.stringify(unpacked));
    });
    
    it("ignores properties from prototypes", function() {
        function Foo() {}
        Foo.prototype.bar = 5;
        var input = new Foo();
        input.baz = 3;
        var packed = packer.pack(input);
        assert.deepEqual(packed, ["baz","3",0]);
        var unpacked = unpacker.unpack(packed);
        assert(!unpacked.bar);
        assert.equal(unpacked.baz, 3);
    });
    
    it("keeps message and stack in errors", function() {
        var input = new Error("Hello thar");
        var packed = packer.pack(input);
        var unpacked = unpacker.unpack(packed);
        assert.equal(unpacked.message, "Hello thar");
        assert(unpacked.stack);
    });
    
    it("copes with messages in the wrong order", function(next) {
        var input1 = { id: 1, text: "foo" };
        var packed1 = packer.pack(input1);
        var input2 = { id: 2, text: "foo" };
        var packed2 = packer.pack(input2);
        var input3 = { id: 3, text: "foo" };
        var packed3 = packer.pack(input3);
        
        unpacker.unpack(packed3, function(err, unpacked3) {
            if (err) return next(err);
            assert.deepEqual(unpacked3, input3);
            next();
        });
        
        unpacker.unpack(packed2, function(err, unpacked2) {
            if (err) return next(err);
            assert.deepEqual(unpacked2, input2);
        });
        
        var unpacked1 = unpacker.unpack(packed1);
        assert.deepEqual(unpacked1, input1);
    });
    
    it("packs strings 1 level deep", function() {
        var input = ["foo\nbar", { deeper: "baz\nqux" }];
        var packed = packer.pack(input, { packStringDepth: 1 });
        assert.deepEqual(packed, [TYPE_ARRAY, [TYPE_STRING, "foo", "bar"], ["deeper", "baz\nqux"], 0]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs strings 2 levels deep", function() {
        var input = ["foo\nbar", { deeper: "baz\nqux" }];
        var packed = packer.pack(input, { packStringDepth: 2 });
        assert.deepEqual(packed, [TYPE_ARRAY, [TYPE_STRING, "foo", "bar"], ["deeper", [TYPE_STRING, "baz", "qux"]], 0]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("copes with null input to unpacker", function() {
        assert.equal(unpacker.unpack(null), null);
    });
    
    it("packs arrays with nulls", function() {
        var input = [1,2,null,4,5,null,6];
        var packed = packer.pack(input);
        assert.deepEqual(packed, [TYPE_ARRAY, "1", "2", null, "4", "5", 5, "6", 0]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs arrays with true and false", function() {
        var input = [true,false,true,false];
        var packed = packer.pack(input);
        assert.deepEqual(packed, [TYPE_ARRAY, true, false, 3, 4, 0]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
    });
    
    it("packs objects with null and true and false", function() {
        var input = { null: null, true: true, false: false };
        var packed = packer.pack(input);
        assert.deepEqual(packed, ["null", "true", "false", null, true, false, 0]);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(unpacked, input);
        
        var packed2 = packer.pack(input);
        assert.deepEqual(packed2, [3, 4, 5, 6, 7, 8, 1]);
        var unpacked2 = unpacker.unpack(packed2);
        assert.deepEqual(unpacked2, input);
    });
    
    it("packs error objects with false property values", function() {
        var error = new Error("Hello thar");
        error.killed = false;
        var input = [error, false, 1, 1];
        var packed = packer.pack(input);
        var unpacked = unpacker.unpack(packed);
        assert.equal(unpacked[0].message, "Hello thar");
        assert(unpacked[0].stack);
        assert.equal(unpacked[0].killed, false);
        assert.equal(unpacked[1], false);
        assert.equal(unpacked[2], 1);
        assert.equal(unpacked[3], 1);
    });
});