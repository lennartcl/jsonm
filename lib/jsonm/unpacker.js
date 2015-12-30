var MAX_MEMO_DICT_SIZE = 2000;
var TYPE_ARRAY = -1;
var TYPE_VALUE = -2;

module.exports.Unpacker = function() {
    var dict = [];
    var dictStart = 0;
    
    return {
        unpack: unpack,
        getDictOptions: getDictOptions,
    };
    
    function getDictOptions() {
        return {
            dictLength: dict.length
        };
    }
    
    function unpack(packed) {
        var newDictStart = packed.pop();
        var result = unpackObject(packed);
        
        if (dict.length - newDictStart > MAX_MEMO_DICT_SIZE) {
            var oldStart = newDictStart;
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
        if (object[0] === TYPE_VALUE)
            return unpackValue(object[1]);
        
        var result = {};
        var keys = object.length / 2;
        for (var i = 0; i < keys; i++) {
            var key = unpackValue(object[i]);
            var packedValue = object[i + keys];
            var value = typeof packedValue === "object"
                ? unpackObject(packedValue)
                : unpackValue(packedValue); 
            
            result[key] = value;
        }
        return result;
    }
    
    function unpackValue(value) {
        if (typeof value === "number") {
            return dict[value];
        }
        if (typeof value === "string") {
            if (/^[0-9\.]/.test(value)) {
                var parsed = parseFloat(value);
                if (!isNaN(parsed)) {
                    dict.push(value);
                    return value;
                }
            }
        }
        if (value[0] === "~")
            value = value.substr(1);
        dict.push(value);
        return value;
    }
};