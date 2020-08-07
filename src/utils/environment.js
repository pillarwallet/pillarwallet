// @flow
import { BUILD_TYPE } from 'react-native-dotenv';

export const isProdEnv = BUILD_TYPE !== 'development';
export const isTest = !!process.env.IS_TEST;
