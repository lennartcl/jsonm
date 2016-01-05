var TYPE_ARRAY = 0;
var TYPE_VALUE = 1;
var TYPE_STRING = 2;
var MIN_DICT_INDEX = 3;

module.exports.Packer = function(json) {
    
    var dict = [];
    var dictMap = {};
    var dictIndex = MIN_DICT_INDEX;
    var sequenceId = -1;
    var maxDictSize;
    
    return {
        pack: pack,
        packString: packString,
        stringify: stringify,
        $getDict: function() {
            return dict.slice(MIN_DICT_INDEX);
        }
    };
    
    function stringify(object, replacer, space) {
        return JSON.stringify(pack(object), replacer, space);
    }
    
    function packString(string, unpackerConfig) {
        var json;
        try {
            json = JSON.parse(string);
        }
        catch (e) {}
        if (!json) {
            var result = pack(string.split("\n"), unpackerConfig);
            result[0] = TYPE_STRING;
            return result;
        }
        return pack(json, unpackerConfig);
    }
    
    function pack(object, unpackerConfig) {
        var remoteSequenceId = unpackerConfig[0];
        maxDictSize = unpackerConfig[1];
        if (sequenceId !== remoteSequenceId) {
            dict = [];
            dictMap = {};
            dictIndex = MIN_DICT_INDEX;
            sequenceId = -1;
        }
        
        var result = packObject(object);
        return Array.isArray(result)
            ? result.concat([++sequenceId])
            : [TYPE_VALUE, result, ++sequenceId];

        function packObject(object) {
            if (Array.isArray(object))
                return [TYPE_ARRAY].concat(object.map(packObject));
            if (typeof object !== "object")
                return packValue(object);
                
            var results = [];
            
            // Keys
            for (var key in object) {
                results.push(packValue(key));
            }
            
            // Values
            for (var key in object) {
                var value = object[key];
                if (typeof value === "object") {
                    results.push(packObject(value));
                }
                else if (typeof value === "number" || typeof value === "string") {
                    results.push(packValue(value));
                }
                else {
                    results.push(value);
                }
            }
            return results;
        }
                
        function packValue(value) {
            var mapKey = typeof value === "number" ? value : "_" + value;
            var result = dictMap[mapKey];
            if (result == null) {
                addToDict(mapKey, value);
                
                if (typeof value === "number")
                    return String(value);
                if (value[0] === "~" || /^[0-9\.]/.test(value))
                    return "~" + value;
                return value;
            }
            return result;
        }
        
        function addToDict(mapKey, value) {
            if (dict[dictIndex] != null) {
                var deleteKey = typeof dict[dictIndex] === "number" ? dict[dictIndex] : "_" + dict[dictIndex];
                delete dictMap[deleteKey];
            }
            dictMap[mapKey] = dictIndex;
            dict[dictIndex] = value;
            dictIndex++;
            
            if (dictIndex > maxDictSize)
                dictIndex = MIN_DICT_INDEX;
        }
    }
};