var MAX_MEMO_DICT_SIZE = 3000;

module.exports.Unpacker = function() {
    var dict = [];
    
    return {
        unpack: unpack,
    };
    
    function unpack(packed) {
        var object = packed[0];
        var dictStart = packed[1] || 0;
        
        for (var i = 0; i < packed.length; i++)
            dict[i + dictStart - 2] = packed[i];
        var result = unmemo(object);
        
        if (dict.length - dictStart > MAX_MEMO_DICT_SIZE) {
            var oldStart = dictStart;
            var newStart = dictStart = dict.length - (MAX_MEMO_DICT_SIZE / 2);
            setTimeout(function gc() {
                for (var i = oldStart; i < newStart; i++)
                    delete dict[i];
            }, 120000); // Wait until old requests end
        }
        
        return result;
    }
    
    function unmemo(json) {
        if (Array.isArray(json))
            return json.map(unmemo);
        var result = {};
        for (var key in json) {
            var key2 = dict[key];
            var value = json[key];
            var value2; 
            if (typeof value === "object") {
                value2 = unmemo(value);
            }
            else if (typeof value === "number") {
                value2 = dict[value];
            }
            else {
                value2 = value;
            }
            
            result[key2] = value2;
        }
        return result;
    }
};