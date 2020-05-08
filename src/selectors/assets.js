// @flow
import get from 'lodash.get';
import { createSelector } from 'reselect';
import { getEnabledAssets } from 'utils/accounts';
import { getAssetData, getAssetsAsList } from 'utils/assets';
import { assetsSelector, activeAccountIdSelector, hiddenAssetsSelector, supportedAssetsSelector } from './selectors';


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

export const accountEnabledAssetsSelector = (accountId: string, state: Object) => createSelector(
  assetsSelector,
  hiddenAssetsSelector,
  (assets, hiddenAssets) => {
    const accountAssets = get(assets, accountId, {});
    const accountHiddenAssets = get(hiddenAssets, accountId, []);
    return getEnabledAssets(accountAssets, accountHiddenAssets);
  },
)(state);

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

export const assetDecimalsSelector = (assetSelector: (state: Object, props: Object) => number) => createSelector(
  assetsSelector,
  supportedAssetsSelector,
  assetSelector,
  (assets, supportedAssets, asset) => {
    const { decimals = 18 } = getAssetData(getAssetsAsList(assets), supportedAssets, asset);
    return decimals;
  },
);
