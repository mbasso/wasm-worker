import fetchMock from 'fetch-mock';
import worker from '../src/worker';
import ACTIONZ from '../src/actions';
import bytes from './bytes';

describe('worker', () => {
  beforeEach(() => {
    fetchMock.mock(/bytes.wasm/, new Response(bytes, {
      status: 200,
      statusText: 'OK',
      headers: {
        'Content-type': 'application/wasm',
      },
    }));
  });

  afterEach(() => {
    fetchMock.restore();
  });

  // we need this test because we cannot mock fetch in integrations
  // since we are using 2 diffent contexts.
  // so, use only the worker function
  it('should instantiate a module from a url using instantiateStreaming', (done) => {
    // initialize scope, this is automatically injected by ../src/index.js

    /* eslint-disable */
    const ACTIONS = ACTIONZ;
    let moduleInstance = null;
    const getImportObject = undefined;
    const importObject = {
      memoryBase: 0,
      tableBase: 0,
      memory: new WebAssembly.Memory({ initial: 256 }),
      table: new WebAssembly.Table({ initial: 0, element: 'anyfunc' }),
    };

    // helper variables
    const id = 0;
    const action = ACTIONZ.COMPILE_MODULE;

    const _instantiate = WebAssembly.instantiate;
    WebAssembly.instantiate = jasmine.createSpy('instantiate').and.callFake((...params) =>
      _instantiate(...params)
    );
    const _instantiateStreaming = WebAssembly.instantiateStreaming;
    WebAssembly.instantiateStreaming =
      jasmine.createSpy('instantiateStreaming').and.callFake((...params) =>
        _instantiateStreaming(...params)
      );
  

    // assert on post message
    // eslint-disable-next-line
    const self = {
      postMessage: (res) => {
        expect(WebAssembly.instantiateStreaming).toHaveBeenCalled();
        expect(WebAssembly.instantiate).not.toHaveBeenCalled();
        WebAssembly.instantiateStreaming = _instantiateStreaming;
        WebAssembly.instantiate = _instantiate;
        expect(res).toBeDefined();
        expect(res.id).toEqual(id);
        expect(res.action).toEqual(action);
        expect(res.result).toEqual(0);
        expect(res.payload).toBeDefined();
        expect(res.payload.exports).toBeDefined();
        expect(res.payload.exports.length).toEqual(2);
        expect(res.payload.exports.indexOf('add')).not.toEqual();
        expect(res.payload.exports.indexOf('div')).not.toEqual();
        done();
      },
    };

    // eval function to string, as we do in the main file
    const func = eval('(' + worker.toString() + ')');
    /* eslint-enable */

    func({
      data: {
        id,
        action,
        payload: 'bytes.wasm',
      },
    });
  });

  it('should instantiate a module from a url using instantiate as fallback', (done) => {
    // initialize scope, this is automatically injected by ../src/index.js

    /* eslint-disable */
    const ACTIONS = ACTIONZ;
    let moduleInstance = null;
    const getImportObject = undefined;
    const importObject = {
      memoryBase: 0,
      tableBase: 0,
      memory: new WebAssembly.Memory({ initial: 256 }),
      table: new WebAssembly.Table({ initial: 0, element: 'anyfunc' }),
    };

    // helper variables
    const id = 0;
    const action = ACTIONZ.COMPILE_MODULE;

    const _instantiate = WebAssembly.instantiate;
    WebAssembly.instantiate = jasmine.createSpy('instantiate').and.callFake((...params) =>
      _instantiate(...params)
    );
    const _instantiateStreaming = WebAssembly.instantiateStreaming;
    WebAssembly.instantiateStreaming = undefined;

    // assert on post message
    // eslint-disable-next-line
    const self = {
      postMessage: (res) => {
        expect(WebAssembly.instantiate).toHaveBeenCalled();
        WebAssembly.instantiateStreaming = _instantiateStreaming;
        WebAssembly.instantiate = _instantiate;
        expect(res).toBeDefined();
        expect(res.id).toEqual(id);
        expect(res.action).toEqual(action);
        expect(res.result).toEqual(0);
        expect(res.payload).toBeDefined();
        expect(res.payload.exports).toBeDefined();
        expect(res.payload.exports.length).toEqual(2);
        expect(res.payload.exports.indexOf('add')).not.toEqual();
        expect(res.payload.exports.indexOf('div')).not.toEqual();
        done();
      },
    };

    // eval function to string, as we do in the main file
    const func = eval('(' + worker.toString() + ')');
    /* eslint-enable */

    func({
      data: {
        id,
        action,
        payload: 'bytes.wasm',
      },
    });
  });
});
