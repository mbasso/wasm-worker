import ACTIONS from './actions';
import workerOnMessage from './worker';
import { getWasmSource } from './utils';

const getTransferableParams = (params = []) =>
  params.filter(x => (
    (x instanceof ArrayBuffer) ||
    (x instanceof MessagePort) ||
    (x instanceof ImageBitmap)
  ));

export default function wasmWorker(source, options = {}) {
  let currentId = 0;
  const promises = {};
  const { getImportObject, ...otherOptions } = options;

  const worker = new Worker(
    `data:,ACTIONS=${JSON.stringify(ACTIONS)};getImportObject=${getImportObject};` +
    `importObject=undefined;wasmModule=null;moduleInstance=null;onmessage=${workerOnMessage}`,
    otherOptions,
  );

  worker.onmessage = (e) => {
    const { id, result, action, payload } = e.data;

    if (action === ACTIONS.COMPILE_MODULE) {
      if (result === 0) {
        const { exports } = payload;

        promises[id][0]({
          exports: exports.reduce((acc, exp) => ({
            ...acc,
            [exp]: (...params) => new Promise((...rest) => {
              // eslint-disable-next-line
              promises[++currentId] = rest;
              worker.postMessage({
                id: currentId,
                action: ACTIONS.CALL_FUNCTION_EXPORT,
                payload: {
                  func: exp,
                  params,
                },
              }, getTransferableParams(params));
            }),
          }), {}),
          run: (func, params) => new Promise((...rest) => {
            // eslint-disable-next-line
            promises[++currentId] = rest;
            worker.postMessage({
              id: currentId,
              action: ACTIONS.RUN_FUNCTION,
              payload: {
                func: func.toString(),
                params,
              },
            }, getTransferableParams(params));
          }),
        });
      } else if (result === 1) {
        promises[id][1](payload);
      }
    } else if (
      action === ACTIONS.CALL_FUNCTION_EXPORT ||
      action === ACTIONS.RUN_FUNCTION
    ) {
      promises[id][result](payload);
    }

    promises[id] = null;
  };

  return new Promise((...params) => {
    // eslint-disable-next-line
    promises[++currentId] = [...params];

    worker.postMessage({
      id: currentId,
      action: ACTIONS.COMPILE_MODULE,
      payload: getWasmSource(source),
    });
  });
}
