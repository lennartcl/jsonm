module.exports.Packer = function(json) {
    var dict = [];
    dict.dictStart = 0;
    
    return {
        pack: pack,
    };
    
    function pack(json, options) {
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
        
        return {
            json: memoObject(json),
            dict: dict.slice(newDictStart),
            dictStart: newDictStart
        };
    
        function memoObject(json) {
            if (Array.isArray(json))
                return json.map(memoObject);
            var result = {};
            for (var key in json) {
                var key2 = memoValue(key);
                var value = json[key];
                var value2;
                if (typeof value === "object") {
                    value2 = memoObject(value);
                }
                else if (typeof value === "number"
                    || (typeof value === "string" && value.length > 5)) {
                    value2 = memoValue(value);
                }
                else {
                    value2 = value;
                }
                result[key2] = value2;
            }
            return result;
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