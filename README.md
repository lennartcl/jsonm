jsonm
=====

_"Listen very carefully, I shall say 'zis only once!"_

jsonm is a performant, safe way to compress JSON messages,
in similar vein to [jsonh](https://github.com/WebReflection/JSONH)
and [jsonc](https://github.com/tcorral/JSONC). jsonm makes messages up
to several orders of magnitude smaller by getting rid of repeated
names and values.

## Examples

json packs

```
[
    { "firstName": "Francis", "lastName": "Doe" },
    { "firstName": "Anna", "lastName": "Smith" },
    { "firstName": "Agent", "lastName": "Smith", isAlias: true },
    { "firstName": "Anna", "lastName": "Francis" }
]
```

into 

```
[ 0,
    ["firstName", "lastName", "Francis", "Doe"],
    [3, 4, "Anna", "Smith"],
    [3, 4, "isAlias", "Agent", 8, true],
    [3, 4, 7, 5]
]
```

Note how common substrings like `"firstName"`, `"lastName"`, and `"John"` are not
repeated but replaced by a dictionary index. jsonm also represents objects
using arrays to avoid quotation signs in pure JSON (e.g., `{"3":"Anna"}`)

The dictionary is built up on the fly and re-used for future messages sent.
When sending the same message again it'll be even smaller:


```
[0,[3,4,5,6],[3,4,7,8],[3,4,9,10,8,11],[3,4,7,5],1]
```

Messages coming later also benefit from the dictionary:

```
[
    { "firstName": "Bryan", "lastName": "Fuller" },
    { "firstName": "Anna", "lastName": "Adams" },
    { "firstName": "Tim", "lastName": "Peterson" },
    { "firstName": "Francis", "lastName": "Peterson" }
]
```

becomes

```
[0,[3,4,"Bryan","Fuller"],[3,4,7,"Adams"],[3,4,"Tim","Peterson"],[3,4,5,16]]
```

## Installation

```
$ npm install --save jsonm
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
unpacker.unpack(packed); // returns message
```

Note that both the packer and unpacker maintain a stateful dictionary.
Don't lose them! But when the connection ends just start over with a new
packer and unpacker.

### Working with Strings

jsonm provides `packString()` for dealing with messages in string form.

`packString()` can be used to efficiently pack multi-line strings. For
example, a string `"foo\nbar"` is packed as if `["foo", "bar"]` was packed:

```
var packed = packer.packString("foo\nbar");
unpacker.unpack(packed); // returns "foo\nbar"
```

`packString()` can also efficiently pack JSON objects in string format,
internally parsing and stringifying them:

```
var packed = packer.packString('{"foo":"bar"}');
unpacker.unpack(packed); // returns '{"foo":"bar"}'
```

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
