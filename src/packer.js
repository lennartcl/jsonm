const TYPE_ARRAY = 0;
const TYPE_VALUE = 1;
const TYPE_STRING = 2;
const MIN_DICT_INDEX = 3;

exports.Packer = function() {
    let memoized = [];
    let memoizedMap = new Map();
    let memoizedObjectMap = new Map();
    let memoizedIndex = MIN_DICT_INDEX;
    let sequenceId = -1;
    let maxDictSize = 2000;
    
    return {
        /**
         * Pack an object.
         * 
         * @param {Object} object
         * @param {Object} [options]
         * @param {Number} [options.packStringDepth]
         *                         Object depth at which to apply packString().
         * @returns {Object}
         */
        pack,
        
        /**
         * Pack a string. Efficiently packs multi-line strings and JSON strings.
         * When unpacked, a string is always returned again.
         * 
         * @param {String} string
         * @returns {Object}
         */
        packString,

        /**
         * Reset the memoization dictionary, allowing consumption by
         * new Unpacker instances.
         */
        reset,
        
        /**
         * Set the maximum dictionary size. Must match the dictionary size
         * used by the unpacker.
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
            return memoized;
        },
    };
    
    function packString(string, options) {
        if (typeof string !== "string")
            return pack(string, options);
        let json;
        try {
            json = JSON.parse(string);
        } catch (e) {
            const result = pack(string.split("\n"), options);
            result[0] = TYPE_STRING;
            return result;
        }
        return pack(json, options);
    }
    
    function pack(object, options) {
        if (object == null)
            return object;
            
        const packStringDepth = options && options.packStringDepth;
        const result = packObjectOrValue(object, packStringDepth);

        if (options && options.noSequenceId)
            return result;
        
        return Array.isArray(result)
            ? result.concat([++sequenceId])
            : [TYPE_VALUE, result, ++sequenceId];

        function packObjectOrValue(object, packStringDepth) {
            if (Array.isArray(object))
                return [TYPE_ARRAY].concat(object.map((o) => {
                    return packObjectOrValue(o, packStringDepth - 1);
                }));
            if (typeof object === "string" && packStringDepth >= 0)
                return packString(object, { noSequenceId: true});
            if (typeof object !== "object" || object == null)
                return packValue(object);
            
            return packObject(object, packStringDepth);
        }
        
        function packObject(object, packStringDepth) {
            let results = [];
            
            // Keys
            for (var key in object) {
                if (!object.hasOwnProperty(key)) continue;
                
                results.push(packValue(key));
            }
            
            const isError = tryPackErrorKeys(object, results);
            
            // Values
            for (var key in object) {
                if (!object.hasOwnProperty(key)) continue;
                
                const value = object[key];
                if (typeof value === "object") {
                    results.push(packObjectOrValue(value, packStringDepth - 1));
                } else if (typeof value === "string") {
                    results.push(packStringDepth > 0
                        ? packString(value, { noSequenceId: true})
                        : packValue(value));
                } else {
                    results.push(packValue(value));
                }
            }
            if (isError)
                results.push(packObjectOrValue(object.message), packObjectOrValue(object.stack));
            
            results = tryPackComplexObject(object, results) || results;
            
            return results;
        }
        
        /**
         * Try pack and memoize an Error object.
         * 
         * @returns false if the object was not an Error object
         */
        function tryPackErrorKeys(object, results) {
            if (object instanceof Error) {
                results.push(packValue("message"), packValue("stack"));
                return true;
            }
        }
        
        function tryPackComplexObject(object, results, containsObjects) {
            if (!containsObjects && results.every(r => typeof r === "number")) {
                const key = results.toString();
                
                const existing = memoizedObjectMap.get(key);
                if (existing) return existing;
                
                memoize(results, key);
            }
        }
        
        /**
         * Pack and memoize a scalar value.
         */
        function packValue(value) {
            const result = memoizedMap.get(value);
            if (result == null) {
                memoize(value);
                
                if (typeof value === "number")
                    return String(value);
                if (/^[0-9\.]|^~/.test(value))
                    return `~${value}`;
                return value;
            }
            return result;
        }
        
        /**
         * Memoize a value.
         * 
         * @param value
         * @param [map]
         */
        function memoize(value, objectKey) {
            const oldValue = memoized[memoizedIndex];
            if (oldValue !== undefined) {
                memoizedMap.delete(oldValue);
                memoizedObjectMap.delete(oldValue);
            }
            
            if (objectKey)
                memoizedObjectMap.set(objectKey, memoizedIndex);
            else
                memoizedMap.set(value, memoizedIndex);
            memoized[memoizedIndex] = value;
            
            memoizedIndex++;
            if (memoizedIndex >= maxDictSize + MIN_DICT_INDEX)
                memoizedIndex = MIN_DICT_INDEX;
        }
    }
    
    function reset() {
        memoized = [];
        memoizedMap = new Map();
        memoizedIndex = MIN_DICT_INDEX;
        sequenceId = -1;
    }
};