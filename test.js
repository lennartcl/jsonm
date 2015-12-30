/*global describe it beforeEach afterEach*/
"use strict";
"use server";

var jsonm = require("./jsonm");

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
        packer.pack({ foo: 1 });
    });
});