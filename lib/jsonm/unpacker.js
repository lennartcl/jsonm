var MAX_MEMO_DICT_SIZE = 3000;
var TYPE_ARRAY = -1

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
        var result = unpackObject(object);
        
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
    
    function unpackObject(object) {
        if (object[0] === TYPE_ARRAY) {
            object.shift();
            return object.map(unpackObject);
        }
        
        if (typeof object != "object")
            return unpackValue(object);
        
        var result = {};
        var keys = object.length / 2;
        for (var i = 0; i < keys; i++) {
            var key = object[i];
            var key2 = dict[key];
            var value = object[key + keys];
            var value2 = typeof value === "object"
                ? unpackObject(value)
                : unpackValue(value); 
            
            result[key2] = value2;
        }
        return result;
    }
    
    function unpackValue(value) {
        if (typeof value === "string") {
            return parseFloat(value);
        }
        else if (typeof value === "number") {
            return dict[value];
        }
        return value;
    }
};