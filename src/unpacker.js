const OLD_MESSAGE = -99;
const TYPE_ARRAY = 0;
const TYPE_VALUE = 1;
const TYPE_STRING = 2;
const MIN_DICT_INDEX = 3;

exports.Unpacker = function() {
    const dict = [];
    let dictIndex = MIN_DICT_INDEX;
    let maxDictSize = 2000;
    let sequenceId = -1;
    let pendingUnpacks = [];
    
    return {
        /**
         * Unpack an packed object to its original input.
         * 
         * In case you expect messages to be passed in out of order,
         * please pass a callback function.
         * 
         * @param {Object} packed
         * @param {Function} [callback]
         * @param {Error} callback.err
         * @param {Object} callback.result
         * @returns {Object}
         */
        unpack,
        
        /**
         * Unpack an object to a string.
         * 
         * @ignore
         * 
         * @param {Object} packed
         * @returns {String}
         */
        $unpackString: unpackString,
        
        /**
         * Set the maximum dictionary size. Must match the dictionary size
         * used by the packer.
         * 
         * @param value  New dictionary size, default 2000.
         */
        setMaxDictSize(value) {
            maxDictSize = value;
        },
        
        /**
         * @ignore
         */
        $getDict() {
            return dict;
        },
    };
    
    function unpack(packed, callback = null) {
        if (callback)
            return unpackAsync(packed, true, callback);
        
        let result;
        unpackAsync(packed, false, (err, _result) => {
            if (err) throw err;
            result = _result;
        });
        return result;
    }
    
    function unpackAsync(packed, waitForSequence, callback) {
        if (typeof packed === "string")
            return unpackAsync(JSON.parse(packed), waitForSequence, callback);
        if (!packed)
            return callback(null, packed);
        if (typeof packed[packed.length - 1] != "number")
            throw callback(new Error("Packed value expected"));
        
        // Prepare input
        const remoteSequenceId = packed.pop();
        if (remoteSequenceId === 0) {
            dictIndex = MIN_DICT_INDEX;
        }
        else if (remoteSequenceId !== sequenceId + 1) {
            if (waitForSequence && remoteSequenceId > sequenceId + 1) {
                // Try after receiving earlier messages
                packed.push(remoteSequenceId);
                return pendingUnpacks.push(unpack.bind(null, packed, callback));
            }
            
            return callback(Object.assign(
                new Error("Message unpacked out of sequence or already unpacked"), { code: "EOLD" }
            ));
        }
        sequenceId = remoteSequenceId;
        
        // Unpack
        const result = unpackObject(packed);
        packed.push(OLD_MESSAGE);
        
        // Return results
        callback(null, result);
        
        if (pendingUnpacks.length) {
            const pending = pendingUnpacks.slice();
            pendingUnpacks = [];
            pending.forEach(f => f());
        }
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
        
        const result = {};
        for (var i = 0; i < object.length; i++) {
            object[i] = typeof object[i] === "object"
                ? unpackObject(object[i])
                : unpackValue(object[i]);
        }
        const keys = object.length / 2;
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
                const parsed = parseFloat(value);
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