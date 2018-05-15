const TYPE_ARRAY = 0;
const TYPE_VALUE = 1;
const TYPE_STRING = 2;
const MIN_DICT_INDEX = 3;

exports.Packer = function() {
    let dict = [];
    let dictMap = {};
    let dictIndex = MIN_DICT_INDEX;
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
            return dict;
        },
    };
    
    function packString(string, options) {
        if (typeof string !== "string")
            return pack(string, options);
        let json;
        try {
            json = JSON.parse(string);
        }
        catch (e) {
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
                
            const results = [];
            
            // Keys
            for (var key in object) {
                if (!object.hasOwnProperty(key)) continue;
                
                results.push(packValue(key));
            }
            
            const isError = packErrorKeys(object, results);
            
            // Values
            for (var key in object) {
                if (!object.hasOwnProperty(key)) continue;
                
                const value = object[key];
                if (typeof value === "object") {
                    results.push(packObjectOrValue(value, packStringDepth - 1));
                }
                else if (typeof value === "string") {
                    results.push(packStringDepth > 0
                        ? packString(value, { noSequenceId: true})
                        : packValue(value));
                }
                else {
                    results.push(packValue(value));
                }
            }
            if (isError)
                results.push(packObjectOrValue(object.message), packObjectOrValue(object.stack));
            
            return results;
        }
        
        function packErrorKeys(object, results) {
            if (object instanceof Error) {
                results.push(packValue("message"), packValue("stack"));
                return true;
            }
        }
                
        function packValue(value) {
            const mapKey = typeof value === "string" ? `_${value}` : value;
            const result = dictMap[mapKey];
            if (result == null) {
                addToDict(mapKey, value);
                
                if (typeof value === "number")
                    return String(value);
                if (/^[0-9\.]|^~/.test(value))
                    return `~${value}`;
                return value;
            }
            return result;
        }
        
        function addToDict(mapKey, value) {
            if (dict[dictIndex] !== undefined) {
                const deleteKey = typeof dict[dictIndex] === "string" ? `_${dict[dictIndex]}` : dict[dictIndex];
                delete dictMap[deleteKey];
            }
            dictMap[mapKey] = dictIndex;
            dict[dictIndex] = value;
            
            dictIndex++;
            if (dictIndex >= maxDictSize + MIN_DICT_INDEX)
                dictIndex = MIN_DICT_INDEX;
        }
    }
    
    function reset() {
        dict = [];
        dictMap = {};
        dictIndex = MIN_DICT_INDEX;
        sequenceId = -1;
    }
};