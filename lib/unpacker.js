var OLD_MESSAGE = -1;
var TYPE_ARRAY = 0;
var TYPE_VALUE = 1;
var TYPE_STRING = 2;
var MIN_DICT_INDEX = 3;

exports.Unpacker = function() {
    var dict = [];
    var dictIndex = MIN_DICT_INDEX;
    var maxDictSize = 2000;
    var sequenceId = -1;
    var pendingUnpacks = [];
    
    return {
        /**
         * Unpack an packed object to its original input.
         * (If this was a string, a string is returned.)
         * 
         * @param {Object} packed
         * @param {Function} [callback]
         * @param {Error} callback.err
         * @param {Object} callback.result
         * @returns {Object}
         */
        unpack: unpack,
        /**
         * Unpack an object to a string.
         * 
         * @ignore
         * 
         * @param {Object} packed
         * @returns {String}
         */
        unpackString: unpackString,
        /**
         * @ignore
         */
        $getDict: function() {
            return dict;
        },
        /**
         * Set the maximum dictionary size. Must match the dictionary size
         * used by the packer.
         * 
         * @param value  New dictionary size, default 2000.
         */
        setMaxDictSize: function(value) {
            maxDictSize = value;
        }
    };
    
    function unpack(packed, callback) {
        if (typeof packed === "string")
            return unpack(JSON.parse(packed));
        if (!packed)
            return callback ? callback(null, packed) : packed;
        
        // Prepare input
        var remoteSequenceId = packed.pop();
        if (remoteSequenceId === 0) {
            dictIndex = MIN_DICT_INDEX;
        }
        else if (remoteSequenceId !== sequenceId + 1) {
            if (callback && remoteSequenceId > sequenceId + 1) {
                // Try after receiving earlier messages
                packed.push(remoteSequenceId);
                return pendingUnpacks.push(unpack.bind(null, packed, callback));
            }
            
            var error = new Error("Message unpacked out of sequence");
            error.code = "EOLD";
            if (!callback)
                throw error;
            return callback(error);
        }
        sequenceId = remoteSequenceId;
        
        // Unpack
        var result = unpackObject(packed);
        packed.push(OLD_MESSAGE);
        
        // Return results
        if (callback)
            callback(null, result);
        
        if (pendingUnpacks.length) {
            var pending = pendingUnpacks.slice();
            pendingUnpacks = [];
            pending.forEach(function(f) { f(); });
        }
        
        if (!callback)
            return result;
    }
    
    function unpackString(packed) {
        return packed[0] === TYPE_STRING
            ? unpack(packed)
            : JSON.stringify(unpack(packed));
    }
    
    function unpackObject(object) {
        if (typeof object != "object" || object == null)
            return unpackValue(object);
        if (!object)
            return object;
        
        switch (object[0]) {
            case TYPE_ARRAY:
                object.shift();
                return object.map(unpackObject);
            case TYPE_STRING:
                object.shift();
                return object.map(unpackObject).join("\n");
            case TYPE_VALUE:
                return unpackValue(object[1]);
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
            return dict[value];
        }
        if (typeof value === "string") {
            if (/^[0-9\.]/.test(value)) {
                var parsed = parseFloat(value);
                if (!isNaN(parsed)) {
                    addToDict(parsed);
                    return parsed;
                }
            }
        }
        if (value && value[0] === "~")
            value = value.substr(1);
        addToDict(value);
        return value;
    }
        
    function addToDict(value) {
        dict[dictIndex] = value;
        dictIndex++;
        if (dictIndex >= maxDictSize + MIN_DICT_INDEX)
            dictIndex = MIN_DICT_INDEX;
        
    }
};