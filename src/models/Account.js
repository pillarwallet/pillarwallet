// @flow
import { ACCOUNT_TYPES } from '../constants/accountsConstants';

export type AccountExtra = Object;

export type Account = {
  id: string,
  type: $Keys<typeof ACCOUNT_TYPES>,
  extra?: AccountExtra,
  isActive: boolean,
};

export type Accounts = Account[];
