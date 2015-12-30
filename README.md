# jsonm

jsonm packs your json and uses memoization powers!

# Examples

```
[
  {"a":"A","b":"B"},
  {"a":"C","b":"D"},
  {"a":"E","b":"F"}
]
```

becomes

```
[
  0,
  0,
  ["a","b","A","B"],
  [0,1,"C","D"],
  [0,1,"E","F"]
]
```

becomes

```
[0,0,[0,1,2,3],[0,1,4,5],[0,1,6,7]]
```

vs

```
[2,"a","b","A","B","C","D","E","F"]
```

# See also

- JSONH: https://github.com/WebReflection/JSONH
- JSONC: https://github.com/tcorral/JSONC