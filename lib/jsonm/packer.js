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
        
        return [packObject(object), newDictStart].concat(dict.slice(newDictStart));

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
                result = dictLength++;
                dictMap["_" + value] = result;
                dict[result] = value;
            }
            return result;
        }
    }
};