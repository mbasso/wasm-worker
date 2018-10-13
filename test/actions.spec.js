import ACTIONS from '../src/actions';

describe('actions', () => {
  it('should export actions', () => {
    expect(ACTIONS).toBeDefined();
  });

  it('should export a compile action', () => {
    expect(typeof ACTIONS.COMPILE_MODULE).toEqual('number');
  });

  it('should export a function call action', () => {
    expect(typeof ACTIONS.CALL_FUNCTION_EXPORT).toEqual('number');
  });

  it('should export a run function action', () => {
    expect(typeof ACTIONS.RUN_FUNCTION).toEqual('number');
  });

  it('should not export duplicated values', () => {
    const values = Object.keys(ACTIONS).map(key => ACTIONS[key]);

    expect(
      values.filter((value, index, arr) =>
        arr.indexOf(value) === index,
      ).length,
    ).toEqual(
      values.length,
    );
  });
});
