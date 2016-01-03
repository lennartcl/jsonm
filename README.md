# jsonm

jsonm packs your json and uses memoization powers!

# Examples

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

becomes

```
[0,[3,4,5,6],[3,4,7,8],[3,4,9,8]]
```

and


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


vs

```
[2,"firstName","lastName","isAlias","John","Doe",false,"Anna","Smith",false,"Agent","Smith",true]
```

and

```
[2,"firstName","lastName","Bryan","Fuller","John","Adams","Tim","Peterson"]
```

# See also

- JSONH: https://github.com/WebReflection/JSONH
- JSONC: https://github.com/tcorral/JSONC