var TYPE_ARRAY = 0;
var TYPE_VALUE = 1;
var NON_TYPE_START = 2;

module.exports.Packer = function(json) {
    
    var dict = [];
    var unpackerDictStart = NON_TYPE_START;
    dict.dictStart = NON_TYPE_START;
    
    return {
        pack: pack,
        stringify: stringify,
        setDictOptions: setDictOptions,
    };
    
    function setDictOptions(options) {
        options = options || {};
        var dictStart = options.dictStart || 0;
        unpackerDictStart = options.dictLength || 0;
        
        if (dictStart > dict.dictStart) {
            for (var i = dict.dictStart; i < dictStart; i++)
                delete dict[i];
            dict.dictStart = dictStart;
        }
    }
    
    function stringify(object, replacer, space) {
        return JSON.stringify(pack(object), replacer, space);
    }
    
    function pack(object) {
        var dictMap = {};
        dict.forEach(function(value, index) {
            dictMap["_" + value] = index;
        });
        
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
            if (!result) {
                dictMap["_" + value] = result;
                dict.push(value);
                if (typeof value === "number")
                    return String(value);
                if (value[0] === "~" || /^[0-9\.]/.test(value))
                    return "~" + value;
                return value;
            }
            return typeof result;
        }
    }
};