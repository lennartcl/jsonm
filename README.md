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
    [ 2, 3, "Anna", "Smith" ],
    [ 2, 3, "Agent", 7, "isAlias", true ]
]
```

becomes

```
[0,[2,3,4,5],[2,3,6,7],[2,3,8,7]]
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
[0,[2,3,"Bryan","Fuller"],[2,3,4,"Adams"],[2,3,"Tim","Peterson"]]
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