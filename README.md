### packer

Simple dependency injector container.

###### instalation

``
npm  install @berhalak/packer
``
``
yarn add @berhalak/packer
``


#### Sample

Also see src/test.ts

```javascript
import { Packer } from '@berhalak/packer';

class Upper {
    data: { text: string };
    constructor(text: string) {
        this.data = {
            text
        }
    }
    public toString() {
        return this.data.text.toUpperCase();
    }
}

Packer.register(Upper);

const unpacked = Packer.unpack<Upper>(Packer.pack(new Upper("lower")))

if (unpacked.toString() != "LOWER") {
    throw new Error("Test failed")
}

const unser = Packer.deserialize<Upper>(Packer.serialize(new Upper("lower")))

if (unser.toString() != "LOWER") {
    throw new Error("Test failed")
}

console.log("Test passed");
```
