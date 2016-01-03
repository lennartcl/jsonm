var TYPE_ARRAY = 0;
var TYPE_VALUE = 1;
var TYPE_STRING = 2;
var NON_TYPE_START = 3;

module.exports.Packer = function(json) {
    
    var dict = [];
    var dictMap = {};
    var unpackerDictStart = NON_TYPE_START;
    var dictStart = NON_TYPE_START;
    
    return {
        pack: pack,
        stringify: stringify,
        setDictOptions: setDictOptions,
    };
    
    function setDictOptions(options) {
        options = options || {};
        unpackerDictStart = options.dictLength || NON_TYPE_START;
        
        if (dictStart > dict.dictStart) {
            for (var i = dict.dictStart; i < dictStart; i++)
                delete dict[i];
            dict.dictStart = dictStart;
        
            dictMap = {};
            dict.forEach(function(value, index) {
                dictMap["_" + value] = index + dictStart;
            });
        }
    }
    
    function stringify(object, replacer, space) {
        return JSON.stringify(pack(object), replacer, space);
    }
    
    function pack(object) {
        var result = packObject(object);
        return Array.isArray(result)
            ? result.concat([unpackerDictStart])
            : [TYPE_VALUE, result, unpackerDictStart];

        function packObject(object) {
            if (Array.isArray(object))
                return [TYPE_ARRAY].concat(object.map(packObject));
            if (typeof object !== "object")
                return packValue(object);
                
            var keys = [];
            var values = [];
            for (var key in object) {
                keys.push(packValue(key));
                
                var value = object[key];
                if (typeof value === "object") {
                    values.push(packObject(value));
                }
                else if (typeof value === "number" || typeof value === "string") {
                    values.push(packValue(value));
                }
                else {
                    values.push(value);
                }
            }
            return keys.concat(values);
        }
                
        function packValue(value) {
            var result = dictMap["_" + value];
            if (result == null) {
                dictMap["_" + value] = dictStart + dict.length;
                dict.push(value);
                if (typeof value === "number")
                    return String(value);
                if (value[0] === "~" || /^[0-9\.]/.test(value))
                    return "~" + value;
                return value;
            }
            return result;
        }
    }
};