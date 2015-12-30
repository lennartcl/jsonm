var TYPE_ARRAY = -1;

module.exports.Packer = function(json) {
    
    var dict = [];
    dict.dictStart = 0;
    
    return {
        pack: pack,
    };
    
    function pack(object, options) {
        options = options || {};
        var dictStart = options.dictStart || 0;
        var dictLength = options.dictLength || 0;
        
        if (dictStart > dict.dictStart) {
            for (var i = dict.dictStart; i < dictStart; i++)
                delete dict[i];
            dict.dictStart = dictStart;
        }
        
        var newDictStart = dictLength;
        var dictMap = {};
        dict.forEach(function(value, index) {
            dictMap["_" + value] = index;
        });
        
        return [memoObject(object), newDictStart].concat(dict.slice(newDictStart));
    
        function memoObject(object) {
            if (Array.isArray(object))
                return [TYPE_ARRAY].join(object.map(memoObject));
            var keys = [];
            var values = [];
            for (var key in object) {
                var key2 = memoValue(key);
                var value = object[key];
                var value2;
                if (typeof value === "object") {
                    value2 = memoObject(value);
                }
                else if (typeof value === "number") {
                    var valueString = String(value);
                    if (valueString.length > 2)
                        value2 = memoValue(value);
                    else
                        value2 = valueString;
                }
                else if (typeof value === "string") {
                    value2 = memoValue(value);
                }
                else {
                    value2 = value;
                }
                keys.push(key2);
                values.push(value2);
            }
            return keys.concat(values);
        }
                
        function memoValue(value) {
            var result = dictMap["_" + value];
            if (!result) {
                result = dictLength++;
                dictMap["_" + value] = result;
                dict[result] = value;
            }
            return result;
        }
    }
};