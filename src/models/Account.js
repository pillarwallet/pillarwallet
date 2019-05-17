// @flow
import { ACCOUNT_TYPES } from '../constants/accountsConstants';

export type AccountExtra = Object;

export type AccountTypes = $Keys<typeof ACCOUNT_TYPES>;

export type Account = {
  id: string,
  type: AccountTypes,
  extra?: AccountExtra,
  isActive: boolean,
};

export type Accounts = Account[];
