import wasmWorker from '../src/index';
import * as utils from '../src/utils';
import bytes from './bytes';
import bytesWithImport from './bytes-imports';

describe('wasm-worker', () => {
  it('should export a function', () => {
    expect(wasmWorker).toBeDefined();
  });

  it('should instantiate a module from a TypedArray', (done) => {
    wasmWorker(bytes)
      .then((module) => {
        expect(module.exports).toBeDefined();
        expect(module.exports.add).toBeDefined();
        expect(module.exports.div).toBeDefined();
        done();
      });
  });

  it('should catch if an invalid module is provided', (done) => {
    wasmWorker(42)
      .catch((module) => {
        expect(module).toBeDefined();
        done();
      });
  });

  it('should call an exported function', (done) => {
    wasmWorker(bytes)
      .then(module =>
        Promise.all([
          module.exports.add(1, 2),
          module.exports.div(4, 2),
        ]),
      )
      .then((results) => {
        expect(results[0]).toEqual(3);
        expect(results[1]).toEqual(2);
        done();
      });
  });

  it('should catch if WebAssembly throw', (done) => {
    const results = [];

    wasmWorker(bytes)
      .then((module) => {
        expect(module.exports.div).toBeDefined();
        return module.exports.div(1, 1).then((result) => {
          results.push(result);
          return module.exports.div(1, 0);
        });
      })
      .catch((ex) => {
        expect(results.length).toEqual(1);
        expect(results[0]).toEqual(1);
        expect(ex).toEqual('RuntimeError: divide by zero');
        done();
      });
  });

  it('should support importObject as option', (done) => {
    wasmWorker(bytesWithImport, {
      getImportObject: () => ({
        imports: {
          add_js: (a, b) => a + b,
        },
      }),
    })
      .then(module =>
        module.exports.add_js(1, 2),
      )
      .then((result) => {
        expect(result).toEqual(3);
        done();
      });
  });

  it('should call getWasmSource when creating a module', (done) => {
    spyOn(utils, 'getWasmSource').and.callThrough();

    wasmWorker(bytes)
      .then((module) => {
        expect(utils.getWasmSource).toHaveBeenCalled();
        expect(module.exports).toBeDefined();
        expect(module.exports.add).toBeDefined();
        expect(module.exports.div).toBeDefined();
        done();
      });
  });

  it('should run a function inside worker', (done) => {
    wasmWorker(bytes, {
      getImportObject: () => ({
        imports: {},
      }),
    })
      .then(wasmModule =>
        wasmModule.run(({
          module,
          instance,
          importObject,
          params
        }) => {
          const err = new Error();
          if (params !== undefined) throw err;
          if (!module instanceof WebAssembly.Module) throw err;
          if (!instance instanceof WebAssembly.Instance) throw err;
          if (importObject.imports === undefined) throw err;

          const sum = instance.exports.add(1, 2);
          return '1 + 2 = ' + sum;
        })
      )
      .then((result) => {
        expect(result).toEqual('1 + 2 = 3');
        done();
      });
  });

  it('should run a function inside worker with params', (done) => {
    wasmWorker(bytes, {
      getImportObject: () => ({
        imports: {},
      }),
    })
      .then(wasmModule =>
        wasmModule.run(({
          module,
          instance,
          importObject,
          params
        }) => {
          const err = new Error();
          if (params === undefined) throw err;
          if (!module instanceof WebAssembly.Module) throw err;
          if (!instance instanceof WebAssembly.Instance) throw err;
          if (importObject.imports === undefined) throw err;

          const sum = instance.exports.add(params[0], params[1]);
          return '1 + 2 = ' + sum;
        }, [1, 2])
      )
      .then((result) => {
        expect(result).toEqual('1 + 2 = 3');
        done();
      });
  });
});
