// @flow
import get from 'lodash.get';
import omit from 'lodash.omit';
import { createSelector } from 'reselect';
import { assetsSelector, activeAccountIdSelector, hiddenAssetsSelector } from './selectors';

export const accountAssetsSelector = createSelector(
  assetsSelector,
  activeAccountIdSelector,
  hiddenAssetsSelector,
  (assets, activeAccountId, hiddenAssets) => {
    if (!activeAccountId) return {};
    const activeAccountAssets = get(assets, activeAccountId, {});
    const activeAccountHiddenAssets = get(hiddenAssets, activeAccountId, []);

    if (Object.keys(activeAccountAssets).length) {
      const visibleAssets = omit(activeAccountAssets, activeAccountHiddenAssets);
      return visibleAssets;
    }
    return {};
  },
);
