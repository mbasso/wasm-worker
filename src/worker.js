export default function worker(e) {
  const { id, action, payload } = e.data;

  const sendMessage = (result, data) => {
    self.postMessage({
      id,
      action,
      result,
      payload: data,
    });
  };

  // eslint-disable-next-line
  const onError = ex => sendMessage(1, '' + ex);
  const onSuccess = sendMessage.bind(null, 0);

  if (action === ACTIONS.COMPILE_MODULE) {
    Promise.resolve()
      .then(() => {
        let res;
        if (getImportObject !== undefined) {
          // eslint-disable-next-line
          importObject = getImportObject();
        }

        if (typeof payload === 'string') {
          res = fetch(payload);
          if (WebAssembly.instantiateStreaming !== undefined) {
            return WebAssembly.instantiateStreaming(res, importObject);
          }
          res = res.then(response => response.arrayBuffer());
        } else {
          res = Promise.resolve(payload);
        }

        return res
          .then(buff => WebAssembly.compile(buff))
          .then(module =>
            WebAssembly.instantiate(module, importObject).then(instance => ({ module, instance })),
          );
      })
      .then(({ module, instance }) => {
        // eslint-disable-next-line
        moduleInstance = instance;
        // eslint-disable-next-line
        wasmModule = module;
        onSuccess({
          exports: WebAssembly.Module
            .exports(module)
            .filter(exp => exp.kind === 'function')
            .map(exp => exp.name),
        });
      })
      .catch(onError);
  } else if (action === ACTIONS.CALL_FUNCTION_EXPORT) {
    const { func, params } = payload;

    Promise.resolve()
      .then(() => {
        const ctx = moduleInstance.exports;
        // eslint-disable-next-line
        onSuccess(ctx[func].apply(ctx, params));
      })
      .catch(onError);
  } else if (action === ACTIONS.RUN_FUNCTION) {
    const { func, params } = payload;

    Promise.resolve()
      .then(() => {
        // eslint-disable-next-line
        const fun = new Function(`return ${func}`)();
        onSuccess(fun({
          module: wasmModule,
          instance: moduleInstance,
          importObject,
          params,
        }));
      })
      .catch(onError);
  }
}
