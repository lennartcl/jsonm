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
        $gc: gc
    };
    
    function gc(newOffset, newLength) {
        if (newOffset < dictOffset) {
            newLength -= dictOffset - newOffset;
            newOffset = dictOffset;
        }
        
        if (dictOffset === newOffset && dict.length === newLength)
            return;
        
        var offset = newOffset - dictOffset;
        var endOffset = offset + newLength;
        dict = dict.slice(offset, endOffset);
        dictOffset = newOffset;
    
        dictMap = {};
        dict.forEach(function(value, index) {
            var key = typeof value === "number" ? value : "_" + value;
            dictMap[key] = index + dictOffset;
        });
    }
    
    function stringify(object, replacer, space) {
        return JSON.stringify(pack(object), replacer, space);
    }
    
    function pack(object, unpackerConfig) {
        if (unpackerConfig)
            gc(unpackerConfig[0], unpackerConfig[1]);
        else
            gc(dictOffset, 0);
        
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
            var key = typeof value === "number" ? value : "_" + value;
            var result = dictMap[key];
            if (result == null) {
                dictMap[key] = dictOffset + dict.length;
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