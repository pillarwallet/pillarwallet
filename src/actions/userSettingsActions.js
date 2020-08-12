// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
import get from 'lodash.get';
import { SET_HIDDEN_ASSETS } from 'constants/userSettingsConstants';
import Toast from 'components/Toast';
import t from 'translations/translate';

import type { Asset } from 'models/Asset';
import type { Dispatch, GetState } from 'reducers/rootReducer';
import { getActiveAccountId } from 'utils/accounts';
import { saveDbAction } from './dbActions';

export const hideAssetAction = (asset: Asset) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      accounts: { data: accounts },
      userSettings: { data: { hiddenAssets } },
    } = getState();

    const accountId = getActiveAccountId(accounts);
    const { symbol: assetTicker } = asset;

    if (!assetTicker || !accountId) return;
    const alreadyHiddenAccountAssets = get(hiddenAssets, accountId, []);
    const updatedHiddenAssets = {
      ...hiddenAssets,
      [accountId]: [...alreadyHiddenAccountAssets, assetTicker],
    };

    Toast.show({
      message: t('toast.assetHasBeenHidden', { assetName: asset.name, assetSymbol: asset.symbol }),
      emoji: 'ok_hand',
      autoClose: true,
    });

    dispatch(saveDbAction('userSettings', { userSettings: { hiddenAssets: updatedHiddenAssets } }, true));
    dispatch({ type: SET_HIDDEN_ASSETS, payload: updatedHiddenAssets });
  };
};

export const showAssetAction = (asset: Asset) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      accounts: { data: accounts },
      userSettings: { data: { hiddenAssets } },
    } = getState();

    const accountId = getActiveAccountId(accounts);
    const { symbol: assetTicker } = asset;

    if (!assetTicker || !accountId) return;
    const updatedHiddenAccountAssets = get(hiddenAssets, accountId, []).filter(a => a !== assetTicker);
    const updatedHiddenAssets = {
      ...hiddenAssets,
      [accountId]: updatedHiddenAccountAssets,
    };

    dispatch(saveDbAction('userSettings', { userSettings: { hiddenAssets: updatedHiddenAssets } }, true));
    dispatch({ type: SET_HIDDEN_ASSETS, payload: updatedHiddenAssets });
  };
};
