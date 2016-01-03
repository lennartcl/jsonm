var MAX_MEMO_DICT_SIZE = 2000;
var TYPE_ARRAY = 0;
var TYPE_VALUE = 1;
var TYPE_STRING = 2;
var NON_TYPE_START = 3;

module.exports.Unpacker = function() {
    var dict = [];
    var dictOffset = NON_TYPE_START;
    
    return {
        parse: parse,
        unpack: unpack,
        getDictOptions: getDictOptions,
    };
    
    function getDictOptions() {
        return {
            dictOffset: dictOffset,
            dictLength: dict.length
        };
    }
    
    function parse(json) {
        return unpack(JSON.parse(json));
    }
    
    function unpack(packed) {
        var newDictStart = packed.pop();
        var result = unpackObject(packed);
        
        if (dict.length - newDictStart > MAX_MEMO_DICT_SIZE) {
            var newOffset = dictOffset = dict.length - (MAX_MEMO_DICT_SIZE / 2);
            // Wait until old requests end, then collect garbage
            setTimeout(gc.bind(null, newOffset), 120000);
        }
        
        return result;
    }
    
    function gc(newOffset) {
        dict = dict.slice(newOffset - dictOffset);
        dictOffset = newOffset;
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
            return dict[value - dictOffset];
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