import fetchMock from 'fetch-mock';
import worker from '../src/worker';
import ACTIONZ from '../src/actions';
import bytes from './bytes';

describe('worker', () => {
  beforeEach(() => {
    fetchMock.mock(/bytes.wasm/, new Response(bytes));
  });

  afterEach(() => {
    fetchMock.restore();
  });

  // we need this test because we cannot mock fetch in integrations
  // since we are using 2 diffent contexts.
  // so, use only the worker function
  it('should instantiate a module from a url using compileStreaming', (done) => {
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

    const _compile = WebAssembly.compile;
    WebAssembly.compile = jasmine.createSpy('compile').and.callFake((...params) =>
      _compile(...params)
    );
    const _compileStreaming = WebAssembly.compileStreaming;
    WebAssembly.compileStreaming = jasmine.createSpy('compileStreaming').and.callFake(req =>
      req
        .then(res => res.arrayBuffer())
        .then(res => _compile(res))
    );
  

    // assert on post message
    // eslint-disable-next-line
    const self = {
      postMessage: (res) => {
        expect(WebAssembly.compileStreaming).toHaveBeenCalled();
        expect(WebAssembly.compile).not.toHaveBeenCalled();
        WebAssembly.compileStreaming = _compileStreaming;
        WebAssembly.compile = _compile;
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

  it('should instantiate a module from a url using compile as fallback', (done) => {
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

    const _compile = WebAssembly.compile;
    WebAssembly.compile = jasmine.createSpy('compile').and.callFake((...params) =>
      _compile(...params)
    );
    const _compileStreaming = WebAssembly.compileStreaming;
    WebAssembly.compileStreaming = undefined;

    // assert on post message
    // eslint-disable-next-line
    const self = {
      postMessage: (res) => {
        expect(WebAssembly.compile).toHaveBeenCalled();
        WebAssembly.compileStreaming = _compileStreaming;
        WebAssembly.compile = _compile;
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
