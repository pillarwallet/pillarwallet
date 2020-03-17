// @flow
import get from 'lodash.get';
import { createSelector } from 'reselect';
import { getEnabledAssets } from 'utils/accounts';
import { assetsSelector, activeAccountIdSelector, hiddenAssetsSelector } from './selectors';

export const accountAssetsSelector = createSelector(
  assetsSelector,
  activeAccountIdSelector,
  hiddenAssetsSelector,
  (assets, activeAccountId, hiddenAssets) => {
    if (!activeAccountId) return {};
    const activeAccountAssets = get(assets, activeAccountId, {});
    const activeAccountHiddenAssets = get(hiddenAssets, activeAccountId, []);

    return getEnabledAssets(activeAccountAssets, activeAccountHiddenAssets);
  },
);

export const allAccountsAssetsSelector = createSelector(
  assetsSelector,
  hiddenAssetsSelector,
  (assets, hiddenAssets) => {
    const uniqueAssets = [];

    Object.keys(assets).forEach(accountId => {
      const accountAssets = get(assets, accountId, {});
      const accountHiddenAssets = get(hiddenAssets, accountId, []);
      const enabledAssets = getEnabledAssets(accountAssets, accountHiddenAssets);

      Object.keys(enabledAssets).forEach(asset => {
        if (!uniqueAssets.includes(asset)) return;
        uniqueAssets.push(asset);
      });
    });

    return uniqueAssets;
  },
);
