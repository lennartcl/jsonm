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
    
    it("packs stuff", function() {
        var input = { foo: 1 };
        var packed = packer.pack(input);
        console.log(packed);
        var unpacked = unpacker.unpack(packed);
        assert.deepEqual(input, unpacked.json);
    });
});