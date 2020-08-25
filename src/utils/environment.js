// @flow
export const isProdEnv = !__DEV__; // avoid cyclic imports (no getEnv needed)
export const isTest = !!process.env.IS_TEST;
