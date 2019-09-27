// @flow
import { MAIN_NETWORK_PROVIDER } from 'react-native-dotenv';

export const isProdEnv = MAIN_NETWORK_PROVIDER === 'homestead';
export const isTest = !!process.env.IS_TEST;
