// @flow
import { NETWORK_PROVIDER } from 'react-native-dotenv';

export const isProdEnv = NETWORK_PROVIDER === 'homestead';
