jsonm
=====

jsonm is a performant, safe way to compress JSON messages,
in similar vein to [jsonh](https://github.com/WebReflection/JSONH)
and [jsonc](https://github.com/tcorral/JSONC). jsonm makes messages up
to several orders of magnitude smaller by eliminating common property
names and values, and using memoization.

## Examples

```
[
    { "firstName": "John", "lastName": "Doe" },
    { "firstName": "Anna", "lastName": "Smith" },
    { "firstName": "Agent", "lastName": "Smith", isAlias: true }
]
```

becomes

```
[0,
    [ "firstName", "lastName", "John", "Doe" ],
    [ 3, 4, "Anna", "Smith" ],
    [ 3, 4, "Agent", 8, "isAlias", true ]
]
```

Note how common substrings `"firstName"`, `"lastName"`, and `"John"` are not
repeated but replaced by a dictionary index.

The dictionary is built up on the fly and re-used for future messages sent.
When sending the same message again it'll be even smaller:


```
[1,[3,4,5,6],[3,4,7,8],[3,4,9,8]]
```

Other messages that come after that also benefit from the dictionary:


```
[
    { "firstName": "Bryan", "lastName": "Fuller" },
    { "firstName": "John", "lastName": "Adams" },
    { "firstName": "Tim", "lastName": "Peterson" }
]
```

becomes

```
[2,[3,4,"Bryan","Fuller"],[3,4,5,"Adams"],[3,4,"Tim","Peterson"]]
```

## Usage

jsonm is designed for sending messages between a sender and a receiver.
The sender packs messages and the receiver unpacks them.

_Sender, packing a message:_

```
var packer = new jsonm.Packer();
var packed = packer.pack(message);
```

_Receiver, unpacking a message:_

```
var unpacker = new jsonm.Unpacker();
unpacker.unpack(message);
```

Note that both the packer and unpacker maintain a stateful dictionary.
Don't lose them! But when the connection ends just start over with a new
packer and unpacker.

## Related Projects

- JSONH: https://github.com/WebReflection/JSONH
- JSONC: https://github.com/tcorral/JSONC

These projects pack uniform JavaScript objects, eliminating the
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

JSONH and JSONM don't apply memoization and only help with uniform data.
Unlike jsom, however, they are stateless, which can make it easier to use
them in some cases.
