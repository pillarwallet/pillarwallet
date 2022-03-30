import type { RootReducerState } from 'reducers/rootReducer';

export const nativeIntegrationSelector = (state: RootReducerState) => state.nativeIntegration.abis ?? null;
