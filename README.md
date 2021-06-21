# dependencies-resolver

detective node dependencies automatic without package.json 

## install

```
npm install dependencies-resolver ## yarn add dependencies-resolver
```

## usage

```
import requireResolver from "dependencies-resolver"
await requireResolver('PATH')
```

## params

Search dependencies and install

@param path — search path

@param attach — attach dependencies

@param npmClient — package install client

@param excludeOption — options excluded from package.json

@param extend — filter suffix of searching files

@return — <dependencies,version> installed
