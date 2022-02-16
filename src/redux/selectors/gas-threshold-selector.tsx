import type { RootReducerState } from 'reducers/rootReducer';

export const gasThresholdsSelector = (state: RootReducerState) => state.gasThreshold.gasThresholds ?? null;
