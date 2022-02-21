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

import * as React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useTranslationWithPrefix, useTranslation } from 'translations/translate';

// Components
import * as Table from 'components/layout/Table';
import Tooltip from 'components/Tooltip';

// Selectors
import { useRootSelector, useFiatCurrency, useChainRates } from 'selectors';
import { gasThresholdsSelector } from 'redux/selectors/gas-threshold-selector';

// Utils
import { getFormattedBalanceInFiat } from 'utils/assets';
import { formatTokenAmount, hitSlop20 } from 'utils/common';
import { nativeAssetPerChain } from 'utils/chains';
import { isHighGasFee } from 'utils/transactions';
import { ethToWei } from '@netgum/utils';

// Types
import type { ViewStyleProp } from 'utils/types/react-native';
import type { Value } from 'models/Value';
import type { Chain } from 'models/Chain';

/**
 * TODO: get assetSymbol from matching asset once assets can be queried by assetAddress as key
 * instead of performing expensive search on whole assets array
 */
type Props = {|
  fee: ?Value,
  assetSymbol?: string,
  assetAddress?: string,
  chain: Chain,
  style?: ViewStyleProp,
|};

function FeeTable({ fee, assetSymbol, assetAddress, style, chain }: Props) {
  const { t, tRoot } = useTranslationWithPrefix('transactions.label');

  assetSymbol = assetSymbol ?? nativeAssetPerChain[chain].symbol;
  assetAddress = assetAddress ?? nativeAssetPerChain[chain].address;

  return (
    <View style={style}>
      <Table.Header>{t('fees')}</Table.Header>
      <FeeRow
        title={t('ethFee')}
        assetSymbol={assetSymbol}
        assetAddress={assetAddress}
        fee={fee}
        separator={false}
        chain={chain}
      />
      <Table.Row title={t('pillarFee')} value={tRoot('label.free')} variant="positive" />
      <FeeRow title={t('totalFee')} assetSymbol={assetSymbol} assetAddress={assetAddress} fee={fee} chain={chain} />
    </View>
  );
}

export default FeeTable;

/**
 * TODO: get assetSymbol from matching asset once assets can be queried by assetAddress as key
 * instead of performing expensive search on whole assets array
 */
type FeeItemProps = {|
  title: string,
  assetSymbol: string,
  assetAddress: string,
  fee: ?Value,
  chain: Chain,
  separator?: boolean,
|};

export function FeeRow({ title, assetSymbol, assetAddress, fee, separator, chain }: FeeItemProps) {
  const { t } = useTranslation();

  const [showTooltip, setShowTooltip] = React.useState(false);

  const chainRates = useChainRates(chain);
  const fiatCurrency = useFiatCurrency();
  const gasThresholds = useRootSelector(gasThresholdsSelector);

  const formattedFee = fee ? t('tokenValue', { value: formatTokenAmount(fee, assetSymbol), token: assetSymbol }) : '';
  const formattedFeeInFiat = getFormattedBalanceInFiat(fiatCurrency, fee, chainRates, assetAddress);

  const feeInWei = ethToWei(fee).toString();
  const highFee = isHighGasFee(chain, feeInWei, null, chainRates, fiatCurrency, gasThresholds);

  return (
    <Table.RowContainer separator={separator}>
      <Table.RowTitle>{title}</Table.RowTitle>

      <Tooltip body={formattedFee} isVisible={showTooltip} positionOnBottom={false}>
        <TouchableOpacity hitSlop={hitSlop20} activeOpacity={1} onPress={() => setShowTooltip(!showTooltip)}>
          <Table.RowValue fontVariant="tabular-nums" variant={highFee && 'negative'}>
            {formattedFeeInFiat}
          </Table.RowValue>
        </TouchableOpacity>
      </Tooltip>
    </Table.RowContainer>
  );
}
