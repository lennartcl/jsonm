var TYPE_ARRAY = 0;
var TYPE_VALUE = 1;
var TYPE_STRING = 2;
var NON_TYPE_START = 3;

module.exports.Packer = function(json) {
    
    var dict = [];
    var dictMap = {};
    var dictOffset = NON_TYPE_START;
    
    return {
        pack: pack,
        stringify: stringify,
        setDictOptions: setDictOptions,
    };
    
    function setDictOptions(options) {
        gc(options.dictOffset, options.dictLength);
    }
    
    function gc(newOffset, newLength) {
        if (dictOffset === newOffset && dict.length === newLength)
            return;
        
        var offset = newOffset - dictOffset;
        var endOffset = offset + newLength - newOffset;
        dict = dict.slice(offset, endOffset);
    
        dictMap = {};
        dict.forEach(function(value, index) {
            dictMap["_" + value] = index + dictOffset;
        });
    }
    
    function stringify(object, replacer, space) {
        return JSON.stringify(pack(object), replacer, space);
    }
    
    function pack(object) {
        var dictStart = dictOffset + dict.length;
        var result = packObject(object);
        return Array.isArray(result)
            ? result.concat([dictStart])
            : [TYPE_VALUE, result, dictStart];

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
                dictMap["_" + value] = dictOffset + dict.length;
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