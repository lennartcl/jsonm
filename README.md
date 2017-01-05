jsonm
=====

_"Listen very carefully, I shall say 'zis only once!"_

jsonm is a fast and safe way to compress JSON messages using memoization.
jsonm makes messages up to several orders of magnitude smaller by getting rid
of repeated names and values.

jsonm is best friends with **websocket** libraries like [socket.io](http://socket.io/).
Modern browsers can **gzip** messages sent over websockets, and jsonm can make them
even smaller for maximum responsiveness of web applications.

## Installation

```
$ npm install --save jsonm
```

In the client, jsonm works well with webpack or browserify.
Our npm distribution also includes a prepackaged client-side version in build/jsonm.js.

## Compression Examples

jsonm packs

```
[
    { "firstName": "Francis", "lastName": "Doe" },
    { "firstName": "Anna", "lastName": "Smith" },
    { "firstName": "Agent", "lastName": "Smith", "isAlias": true },
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

By avoiding repetition, jsonm can for example help decrease the size of messages
sent from a web server to the client. It effectively leaves out all information
the client already knows about.

## Usage

jsonm is designed for sending messages between a sender and a receiver.
The sender packs messages and the receiver unpacks them.

_Sender, packing a message:_

```
const packer = new jsonm.Packer();
let packedMessage = packer.pack(message);
```

_Receiver, unpacking a message:_

```
const unpacker = new jsonm.Unpacker();
let message = unpacker.unpack(packedMessage);
```

Note that both the packer and unpacker maintain a stateful dictionary.
Don't lose them! When the connection ends, create a new packer or call
`packer.reset()`.

```
let packer = new jsonm.Packer();
packer.pack(message);
// ... disconnected!
packer.reset();
```

### Working with Strings

jsonm provides `packString()` for dealing with messages in string form.

`packString()` can be used to efficiently pack multi-line strings. For
example, a string `"foo\nbar"` is packed as if `["foo", "bar"]` was packed:

```
let packed = packer.packString("foo\nbar");
unpacker.unpack(packed); // returns "foo\nbar"
```

`packString()` can also efficiently pack JSON objects in string format,
internally parsing and stringifying them:

```
let packed = packer.packString('{"foo":"bar"}');
unpacker.unpack(packed); // returns '{"foo":"bar"}'
```

## Related Projects

- JSONC: https://github.com/tcorral/JSONC
- JSONH: https://github.com/WebReflection/JSONH
- JSONR: https://github.com/dogada/RJSON

These projects pack uniform JavaScript objects, eliminating the
need for repeating the keys of each object. As an example, JSONH can pack

```
[
    { "firstName": "John", "lastName": "Doe", "isAlias": false },
    { "firstName": "Anna", "lastName": "Smith", "isAlias": false },
    { "firstName": "Agent", "lastName": "Smith", "isAlias": true }
]
```

into

```
[3,"firstName","lastName","isAlias","John","Doe",false,"Anna","Smith",false,"Agent","Smith",true]
```

JSONC, JSONH, and JSONR don't apply memoization and only help with uniform data
or data with a recurring scheme. Unlike jsom, however, they are stateless, which
can make it easier to use them in some cases.

# License

MIT
