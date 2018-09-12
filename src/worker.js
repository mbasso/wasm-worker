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
      .then(() => (
        typeof payload === 'string'
          ? fetch(payload).then(response => response.arrayBuffer())
          : payload
      ))
      .then(buffer => WebAssembly.compile(buffer))
      .then(module =>
        WebAssembly.instantiate(
          module,
          getImportObject !== undefined
            ? getImportObject()
            : {
              memoryBase: 0,
              tableBase: 0,
              memory: new WebAssembly.Memory({ initial: 256 }),
              table: new WebAssembly.Table({ initial: 0, element: 'anyfunc' }),
            },
        )
          .then((inst) => {
            // eslint-disable-next-line
            moduleInstance = inst;
            onSuccess({
              exports: WebAssembly.Module
                .exports(module)
                .filter(exp => exp.kind === 'function')
                .map(exp => exp.name),
            });
          }),
      )
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
  }
}
