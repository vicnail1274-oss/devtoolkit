# devtoolkit-utils

[![npm version](https://img.shields.io/npm/v/devtoolkit-utils.svg)](https://www.npmjs.com/package/devtoolkit-utils)
[![CI](https://github.com/devtoolkit-cc/devtoolkit-utils/actions/workflows/ci.yml/badge.svg)](https://github.com/devtoolkit-cc/devtoolkit-utils/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-blue.svg)](https://www.typescriptlang.org/)

40+ developer utility functions extracted from [DevToolkit](https://devtoolkit.cc) — zero dependencies, fully typed, tree-shakeable.

## Install

```bash
npm install devtoolkit-utils
```

## Quick Start

```ts
import { base64Encode, md5, convertCase, hexToRgb } from 'devtoolkit-utils';

base64Encode('Hello!');           // "SGVsbG8h"
md5('Hello, World!');             // "65a8e27d8879283831b664bd8b7f0ad4"
convertCase('hello_world', 'camelcase'); // "helloWorld"
hexToRgb('#3b82f6');              // { r: 59, g: 130, b: 246 }
```

## Modules

Import only what you need for optimal tree-shaking:

```ts
import { base64Encode } from 'devtoolkit-utils/encoding';
import { md5 } from 'devtoolkit-utils/hashing';
import { jsonToCsv } from 'devtoolkit-utils/data';
import { convertCase } from 'devtoolkit-utils/conversion';
```

### Encoding (`devtoolkit-utils/encoding`)

| Function | Description |
|----------|-------------|
| `base64Encode(input, urlSafe?)` | Encode string to Base64 (UTF-8 safe) |
| `base64Decode(input, urlSafe?)` | Decode Base64 to string |
| `toUrlSafeBase64(b64)` | Convert standard Base64 to URL-safe |
| `fromUrlSafeBase64(b64)` | Convert URL-safe Base64 to standard |
| `urlEncodeComponent(input)` | Encode URI component |
| `urlDecodeComponent(input)` | Decode URI component |
| `urlEncode(input)` | Encode full URL |
| `urlDecode(input)` | Decode full URL |

### Hashing (`devtoolkit-utils/hashing`)

| Function | Description |
|----------|-------------|
| `md5(input)` | Pure-JS MD5 hash (no dependencies) |
| `hashWithCrypto(algo, text)` | SHA hash via Web Crypto API |
| `computeHash(algo, text)` | Unified hash (MD5 or SHA-1/256/384/512) |

### Data (`devtoolkit-utils/data`)

| Function | Description |
|----------|-------------|
| `jsonFormat(input, indent?)` | Pretty-print JSON |
| `jsonMinify(input)` | Minify JSON |
| `jsonValidate(input)` | Check if string is valid JSON |
| `evaluateJsonPath(obj, path)` | JSONPath query (supports `$`, `.*`, `[n]`) |
| `jsonToCsv(json, delimiter?)` | Convert JSON array to CSV |
| `csvToJson(csv, delimiter?)` | Parse CSV to JSON |

### Conversion (`devtoolkit-utils/conversion`)

| Function | Description |
|----------|-------------|
| `hexToRgb(hex)` | Parse hex color to RGB |
| `rgbToHex(r, g, b)` | RGB to hex string |
| `rgbToHsl(r, g, b)` | RGB to HSL |
| `hslToRgb(h, s, l)` | HSL to RGB |
| `splitWords(text)` | Smart word splitting (camelCase, snake_case, etc.) |
| `convertCase(text, type)` | Convert between 10 case formats |
| `convertFromDecimal(decimal)` | Decimal to binary/octal/hex |
| `convertBase(value, fromBase)` | Convert between number bases |

**Supported case types:** `uppercase`, `lowercase`, `titlecase`, `sentencecase`, `camelcase`, `pascalcase`, `snakecase`, `kebabcase`, `constantcase`, `dotcase`

## Browser & Node.js

All functions work in both environments. The `hashWithCrypto` and `computeHash` functions require the Web Crypto API (`crypto.subtle`), available in modern browsers and Node.js 15+.

## License

MIT
