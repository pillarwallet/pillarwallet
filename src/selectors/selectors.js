// @flow
import type { AccountsState } from 'reducers/accountsReducer';

//
// Global selectors here
//

export const balancesSelector = ({ balances }: {balances: AccountsState}) => balances.data;
