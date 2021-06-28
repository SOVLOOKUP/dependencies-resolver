# dependencies-resolver

detective, install and simplify dependencies without package.json，exclude node built-in modules automatically

## install

```
npm install dependencies-resolver ## yarn add dependencies-resolver
```

## usage

```
import requireResolver from "dependencies-resolver"
await requireResolver('PATH')

```
> output
[ dependencies-resolver ]  Fetch built-in modules list from npm...
[ dependencies-resolver ]  Resolving dependencies...
[ dependencies-resolver ]  Find dependencies:  
  "@midwayjs/decorator": "^2.11.1",
  "@midwayjs/web": "^2.11.1",
  "@midwayjs/bootstrap": "^2.11.1"
  
[ dependencies-resolver ]  Installing dependencies...
[ dependencies-resolver ]  added 533 packages, and audited 534 packages in 19s
[ dependencies-resolver ]  Deduping dependencies...
[ dependencies-resolver ]  removed 4 packages, changed 2 packages, and audited 530 packages in 3s
```

## params

Search dependencies and install

@param path — search path

@param attach — attach dependencies

@param npmClient — package install client

@param excludeOption — options excluded from package.json

@param extend — filter suffix of searching files

@param {boolean} silent silent info

@return — <dependencies,version> installed
