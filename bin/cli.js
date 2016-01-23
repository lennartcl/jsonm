#!/usr/bin/env node
/**
 * jsonm command-line interface.
 * 
 * For testing purposes only. jsonm is designed for use with
 * multiple messages, getting increasing benefit from memoization
 * over time. This CLI tool only compresses one message.
 */
var optimist = require("optimist");
var fs = require("fs");
var jsonm = require("../jsonm");

var args = optimist
    .alias('p', 'pack')
    .describe('p', 'pack JSON')
    .alias('u', 'unpack')
    .describe('u', 'Unpack JSON')
    .alias('h', 'help')
    .describe('help', 'Show help')
    .argv;

if (args.help || (!args.pack && !args.unpack)) {
    optimist.showHelp();
    process.exit();
}

var source = args.pack || args.unpack;
if (source === true)
    source = "/dev/stdin";
var file = JSON.parse(fs.readFileSync(source, "utf8"));
var result = args.pack ? jsonm.Packer().pack(file) : jsonm.Unpacker().unpack(file);

console.log(JSON.stringify(result));