// @flow
import { ACCOUNT_TYPES } from 'constants/accountsConstants';

export type AccountTypes = $Values<typeof ACCOUNT_TYPES>;

export type Account = {
  id: string,
  type: AccountTypes,
  extra?: any,
  isActive: boolean,
  walletId: string,
};

export type Accounts = Account[];
