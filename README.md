# wasm-worker

[![Build Status](https://travis-ci.org/mbasso/wasm-worker.svg?branch=master)](https://travis-ci.org/mbasso/wasm-worker)
[![npm version](https://img.shields.io/npm/v/wasm-worker.svg)](https://www.npmjs.com/package/wasm-worker)
[![npm downloads](https://img.shields.io/npm/dm/wasm-worker.svg?maxAge=2592000)](https://www.npmjs.com/package/wasm-worker)
[![MIT](https://img.shields.io/npm/l/wasm-worker.svg)](https://github.com/mbasso/wasm-worker/blob/master/LICENSE.md)
[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://paypal.me/BassoMatteo)

> Move a WebAssembly module into its own thread


_wasm-worker only supports browser environments, since it uses [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers). For use in a NodeJS environment, Web Workers must be polyfilled using a library like [node-webworker-threads](https://github.com/audreyt/node-webworker-threads)._

## Installation

You can install wasm-worker using [npm](https://www.npmjs.com/package/wasm-worker):

```bash
npm install --save wasm-worker
```

If you aren't using npm in your project, you can include wasmWorker using UMD build in the dist folder with `<script>` tag.

## Usage

Once you have installed wasm-worker, supposing a CommonJS environment, you can import and use it in this way:

```js
import wasmWorker from 'wasm-worker';

// supposing an "add.wasm" module that exports a single function "add"
wasmWorker('add.wasm')
  .then(module => {
    return module.exports.add(1, 2);
  })
  .then(sum => {
    console.log('1 + 2 = ' + sum);
  })
  .catch(ex => {
    // ex is a string that represents the exception
    console.error(ex);
  });

// you can also run js functions inside the worker
// to access importObject for example
wasmWorker('add.wasm')
  .then(module => {
    return module.run(({
      // module,
      // importObject,
      instance,
      params
    }) => {
      // here is sync
      const sum = instance.exports.add(...params);
      return '1 + 2 = ' + sum;
    }, [1, 2]);
  })
  .then(result => {
    console.log(result);
  });
```

## API

```js
type JsCallback = (context: {
  module: WebAssembly.Module,
  instance: WebAssembly.Instance,
  importObject: importObject,
  params: any,
}) => any;

type WasmWorkerModule = {
  exports: {
    [export: string]: (...any: Array<any>) => Promise<any>
  },
  // run a js function inside the worker and provides it the given params
  // ⚠️ Caveat: the function you pass cannot rely on its surrounding scope, since it is executed in an isolated context.
  // Please use the "params" parameter to provide some values to the callback
  run: (callback: JsCallback, params?: any) => Promise<any>
};

type Options = {
  // the first 3 properties are used to create the Web Worker
  // https://developer.mozilla.org/en-US/docs/Web/API/Worker/Worker#Parameters
  name: string,
  type: 'classic' | 'module',
  credentials: 'omit' | 'same-origin' | 'include',
  
  // the getImportObject function is used to get the options to instantiate the WebAssembly Module
  // ⚠️ Caveat: the function you pass cannot rely on its surrounding scope, since it is executed in an isolated context.
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/instantiate#Primary_overload_%E2%80%94_taking_wasm_binary_code
  getImportObject: () => importObject,
};

wasmWorker(url: string, options?: Options): Promise<WasmWorkerModule> // browser only
wasmWorker(bufferSource: TypedArray | ArrayBuffer, options?: Options): Promise<WasmWorkerModule>
```

## Browser support

`wasm-worker` uses [fetch](https://developer.mozilla.org/it/docs/Web/API/Fetch_API), [Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) and obviously [WebAssembly](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly) APIs, they are broadly supported by major browser engines but you would like to polyfill them to support old versions.

```js
if (!window.fetch || !window.Worker || !window.WebAssembly) {
    ...
} else {
    ...
}
```

### CSP

If your app has a [Content-Security-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy),
wasm-worker require `worker-src data:` and `script-src data:` in your config.

## Inspiration

This project is inspired by [greenlet](https://github.com/developit/greenlet).

## Change Log

This project adheres to [Semantic Versioning](http://semver.org/).  
Every release, along with the migration instructions, is documented on the Github [Releases](https://github.com/mbasso/wasm-worker/releases) page.

## Authors
**Matteo Basso**
- [github/mbasso](https://github.com/mbasso)
- [@teo_basso](https://twitter.com/teo_basso)

## Copyright and License
Copyright (c) 2018, Matteo Basso.

wasm-worker source code is licensed under the [MIT License](https://github.com/mbasso/wasm-worker/blob/master/LICENSE.md).
