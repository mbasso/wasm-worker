import { getWasmSource } from '../src/utils';
import bytes from './bytes';

describe('utils', () => {
  it('should get wasm source as is if it is not a url', () => {
    expect(getWasmSource(bytes)).toEqual(bytes);
  });

  it('should get wasm source as is if it is an absolute url', () => {
    let url = 'https://localhost:8080';
    expect(getWasmSource(url)).toEqual(url);
    url = 'http://localhost:8080';
    expect(getWasmSource(url)).toEqual(url);
  });

  it('should get wasm source from relative url', () => {
    // location.href = localhost:xxxx/context.html, / automatically injected
    expect(getWasmSource('bytes.wasm')).toEqual(`${location.href}/bytes.wasm`);
    expect(getWasmSource('/bytes.wasm')).toEqual(`${location.origin}/bytes.wasm`);
  });
});
