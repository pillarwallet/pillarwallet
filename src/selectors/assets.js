// @flow
import { createSelector } from 'reselect';
import { assetsSelector, activeAccountIdSelector } from './selectors';

export const accountAssetsSelector = createSelector(
  assetsSelector,
  activeAccountIdSelector,
  (assets, activeAccountId) => {
    if (!activeAccountId) return {};
    return assets[activeAccountId] || {};
  },
);
