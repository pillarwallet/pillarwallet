// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

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
/* eslint-disable i18next/no-literal-string */

import * as React from 'react';

// Constants
import { ETH } from 'constants/assetsConstants';

// Components
import HistoryList from 'components/HistoryList';

// Selectors
import {
  activeAccountAddressSelector,
  supportedAssetsSelector,
  useRootSelector,
} from 'selectors';
import { accountHistorySelector } from 'selectors/history';
import { accountAssetsSelector } from 'selectors/assets';
import { accountCollectiblesHistorySelector } from 'selectors/collectibles';

// Utils
import { formatUnits, wrapBigNumber } from 'utils/common';
import { addressesEqual, getAssetData, getAssetsAsList } from 'utils/assets';

// Types
import { EVENT_TYPE, type Event } from 'models/History';
import type { FeeWithGasToken } from 'models/Transaction';
import type { TokenValue } from 'models/Value';

function HistoryListEtherspot() {
  const items = useHistoryEvents();

  return <HistoryList items={items} />;
}

export default HistoryListEtherspot;

function parseFee(
  feeWithGasToken: ?FeeWithGasToken,
  gasUsed: ?number,
  gasPrice: ?number,
): ?TokenValue {
  if (feeWithGasToken?.feeInWei) {
    const {
      feeInWei,
      gasToken: { decimals, symbol },
    } = feeWithGasToken;
    return {
      value: wrapBigNumber(formatUnits(feeInWei, decimals)),
      symbol,
    };
  }

  if (gasUsed && gasPrice) {
    const feeValue = wrapBigNumber(gasPrice).multipliedBy(wrapBigNumber(gasPrice));
    return {
      value: wrapBigNumber(formatUnits(feeValue, 18)),
      symbol: ETH,
    };
  }

  return null;
}

function useHistoryEvents(): Event[] {
  const activeAccountAddress = useRootSelector(activeAccountAddressSelector);
  const transactionsHistory = useRootSelector(accountHistorySelector);
  const accountAssets = getAssetsAsList(useRootSelector(accountAssetsSelector));
  const supportedAssets = useRootSelector(supportedAssetsSelector);
  const collectiblesHistory = useRootSelector(accountCollectiblesHistorySelector);

  const mappedCollectiblesHistory = collectiblesHistory.map(({
    _id,
    hash,
    batchHash,
    createdAt,
    from: fromAddress,
    to: toAddress,
    icon: imageUrl,
    status,
    asset: title,
    feeWithGasToken,
    gasUsed,
    gasPrice,
  }) => {
    const fee = parseFee(feeWithGasToken, gasUsed, gasPrice);
    const eventType = addressesEqual(fromAddress, activeAccountAddress)
      ? EVENT_TYPE.COLLECTIBLE_SENT
      : EVENT_TYPE.COLLECTIBLE_RECEIVED;

    return {
      id: _id,
      hash,
      batchHash,
      date: new Date(+createdAt * 1000),
      fromAddress,
      toAddress,
      imageUrl,
      type: eventType,
      status,
      title,
      fee,
    };
  });

  const mappedTransactionsHistory = transactionsHistory.map(({
    _id,
    hash,
    batchHash,
    value: rawValue,
    asset: symbol,
    createdAt,
    from: fromAddress,
    to: toAddress,
    extra,
    gasUsed,
    gasPrice,
    feeWithGasToken,
    status,
  }) => {
    const fee = parseFee(feeWithGasToken, gasUsed, gasPrice);
    const { decimals } = getAssetData(accountAssets, supportedAssets, symbol);
    const value = {
      value: wrapBigNumber(formatUnits(rawValue, decimals)),
      symbol,
    };

    let transaction = {
      id: _id,
      hash,
      batchHash,
      value,
      date: new Date(+createdAt * 1000),
      fromAddress,
      toAddress,
      status,
      fee,
    };

    let eventType = addressesEqual(fromAddress, activeAccountAddress)
      ? EVENT_TYPE.TOKEN_SENT
      : EVENT_TYPE.TOKEN_RECEIVED;

    if (extra?.ensName) {
      eventType = EVENT_TYPE.ENS_NAME_REGISTERED;
      transaction = { ...transaction, ensName: extra.ensName };
    }

    transaction = {
      ...transaction,
      type: eventType,
      fee,
    };

    return transaction;
  });

  return [
    ...mappedTransactionsHistory,
    ...mappedCollectiblesHistory,
  ];
}
