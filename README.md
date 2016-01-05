# jsonm

jsonm is a performant, safe way to pack and unpack JSON messages.
It makes messages up to several orders of magnitude smaller by
eliminating common property names and values and using memoization.

# Usage

jsonm is designed for a client/server connection. The client
unpacks messages and the server packs them.


Client setup:

```
var unpacker = new jsonm.Unpacker();

```

Server setup, packing a message:

```
var packer = new jsonm.Packer();
var packed = packer.pack(message, config);
```

and the client gets an unpacker to unpack messages:

# Examples

```
var packer = new jsonm.Packer();
packer.pack([
    { "firstName": "John", "lastName": "Doe" },
    { "firstName": "Anna", "lastName": "Smith" },
    { "firstName": "Agent", "lastName": "Smith", isAlias: true }
], config)
```

returns

```
[
    [ "firstName", "lastName", "John", "Doe" ],
    [ 3, 4, "Anna", "Smith" ],
    [ 3, 4, "Agent", 8, "isAlias", true ]
,   0
]
```

where all common substrings are replaced by dictionary indices.
The resulting object can be unpacked using `new jsonm.Unpacker().unpack(string)`.

When the same message is sent again, the dictionary can be reused,
making the message even smaller:

```
[0,[3,4,5,6],[3,4,7,8],[3,4,9,8]]
```

Other messages that come after that also benefit from the existing dictionary:


```
[
    { "firstName": "Bryan", "lastName": "Fuller" },
    { "firstName": "John", "lastName": "Adams" },
    { "firstName": "Tim", "lastName": "Peterson" }
]
```

becomes

```
[0,[3,4,"Bryan","Fuller"],[3,4,5,"Adams"],[3,4,"Tim","Peterson"]]
```

# Related Projects

- JSONH: https://github.com/WebReflection/JSONH
- JSONC: https://github.com/tcorral/JSONC

These projects attempt to pack uniform JavaScript objects, eliminating the
need for repeating the keys of each object. As an example, JSONH can pack


```
[
    { "firstName": "John", "lastName": "Doe", isAlias: false },
    { "firstName": "Anna", "lastName": "Smith", isAlias: false },
    { "firstName": "Agent", "lastName": "Smith", isAlias: true }
]
```

into

```
[3,"firstName","lastName","isAlias","John","Doe",false,"Anna","Smith",false,"Agent","Smith",true]
```
