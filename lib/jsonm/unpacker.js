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
        getPackerConfig: getPackerConfig,
        $gc: gc,
        $getDict: function() {
            return dict;
        },
        $setMaxDictSize: function(value) {
            MAX_MEMO_DICT_SIZE = value;
        }
    };
    
    function getPackerConfig() {
        return [dictOffset, dict.length];
    }
    
    function parse(json) {
        return unpack(JSON.parse(json));
    }
    
    function unpack(packed) {
        var newDictStart = packed[packed.length - 1];
        packed = packed.slice(0, packed.length - 1);
        if (newDictStart < dict.length + dictOffset)
            dict = dict.slice(0, newDictStart - dictOffset);
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
        if (typeof object != "object")
            return unpackValue(object);
        
        switch (object[0]) {
            case TYPE_ARRAY:
                object.shift();
                return object.map(unpackObject);
            case TYPE_VALUE:
                return unpackValue(object[1]);
            case TYPE_STRING:
                return object.map(unpackObject).join("\n");
            default:
        }
        
        var result = {};
        for (var i = 0; i < object.length; i++) {
            object[i] = typeof object[i] === "object"
                ? unpackObject(object[i])
                : unpackValue(object[i]);
        }
        var keys = object.length / 2;
        for (var i = 0; i < keys; i++) {
            result[object[i]] = object[i + keys];
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
                    dict.push(parsed);
                    return parsed;
                }
            }
        }
        if (value[0] === "~")
            value = value.substr(1);
        dict.push(value);
        return value;
    }
};