import IObject from 'redux/interfaces/IObject';

export const updateObject = <T,>(oldObject: T, newValues: T) => Object.assign({}, oldObject, newValues);

export const createReducer = (initialState: IObject, handlers: IObject) => {
  const reducer = (state = initialState, action: IObject) => {
    if (handlers.hasOwnProperty(action.type)) {
      return handlers[action.type](state, action);
    } else {
      return state;
    }
  };
  return reducer;
};

export const updateChangesCounter = (counter: number | undefined): number => (counter ?? 0) + 1;
