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
import { TextInput } from 'react-native';
import { BigNumber } from 'bignumber.js';
import styled from 'styled-components/native';
import t from 'translations/translate';

// Components
import { Spacing } from 'components/layout/Layout';
import TokenValueInput from 'components/inputs/TokenValueInput';
import TokenBalanceAccessory from 'components/inputs/TokenValueInput/TokenBalanceAccessory';
import FiatValueInput from 'components/inputs/FiatValueInput';

// Selectors
import { useChainRates, useFiatCurrency } from 'selectors';

// Utils
import { wrapBigNumberOrNil, truncateDecimalPlaces } from 'utils/bigNumber';
import { getAssetRateInFiat, getAssetValueInFiat, getAssetValueFromFiat } from 'utils/rates';

// Types
import type { ViewStyleProp } from 'utils/types/react-native';
import type { Asset } from 'models/Asset';
import type { Chain } from 'models/Chain';
import type { RatesByAssetAddress, Currency } from 'models/Rates';

type Props = {|
  value: ?BigNumber,
  onValueChange: (value: ?BigNumber) => mixed,
  chain: ?Chain,
  asset: ?Asset,
  balance?: ?BigNumber, // Used as reference value for use max & percent values
  balanceAfterFee?: ?BigNumber, // Used for max value valiation
  disableMaxValue?: boolean, // Disable use max and use 100% (normally used for native assets)
  onTokenPress?: () => mixed,
  showChainIcon?: boolean,
  style?: ViewStyleProp,
  tokenInputRef?: React.Ref<typeof TextInput>,
  hideFiatValueInput?: boolean,
|};

/**
 * Control allowing specifying token value in both token and/or fiat terms.
 */
const TokenFiatValueInputs = ({
  value,
  onValueChange,
  chain,
  asset,
  balance,
  balanceAfterFee,
  disableMaxValue,
  onTokenPress,
  showChainIcon,
  style,
  tokenInputRef,
  hideFiatValueInput = false,
}: Props) => {
  const rates = useChainRates(chain);
  const currency = useFiatCurrency();

  // When set to non-nulll value, token value is driven from fiat value.
  const [fiatValue, setFiatValue] = React.useState(null);

  React.useEffect(() => {
    setFiatValue(null);
  }, [chain, asset?.address]);

  const handleTokenValueChange = (newTokenValue: ?BigNumber) => {
    setFiatValue(null);
    onValueChange(newTokenValue);
  };

  const handleFiatValueChange = (newFiatValue: ?BigNumber) => {
    setFiatValue(newFiatValue);
    onValueChange(calculateTokenValue(newFiatValue, asset, rates, currency));
  };

  const handleUseMax = () => {
    const maxDecimals = asset?.decimals === 6 ? 4 : 15;
    onValueChange(truncateDecimalPlaces(balance ?? BigNumber(0), maxDecimals));
  };

  const fiatRate = getAssetRateInFiat(rates, asset?.address, currency);

  const editableFiatValue = fiatRate != null;
  const resultFiatValue = fiatValue ?? calculateFiatValue(value, asset?.address, rates, currency);

  const maxValue = balanceAfterFee ?? balance;

  return (
    <Container style={style}>
      <TokenValueInput
        ref={tokenInputRef}
        value={value}
        onValueChange={handleTokenValueChange}
        chain={chain}
        asset={asset}
        maxValue={maxValue}
        referenceValue={balance}
        referenceDisableMax={disableMaxValue}
        onTokenPress={onTokenPress}
        showChainIcon={showChainIcon}
        editable
      />

      <TokenBalanceAccessory
        balance={balance}
        chain={chain}
        asset={asset}
        onUseMax={handleUseMax}
        useMaxTitle={t('button.sendMax')}
        disableUseMax={disableMaxValue}
      />

      {!hideFiatValueInput && (
        <Container>
          <Spacing h={36} />
          <FiatValueInput value={resultFiatValue} onValueChange={handleFiatValueChange} editable={editableFiatValue} />
        </Container>
      )}
    </Container>
  );
};

export default TokenFiatValueInputs;

function calculateFiatValue(
  tokenValue: ?BigNumber,
  assetAddress: ?string,
  rates: RatesByAssetAddress,
  currency: Currency,
) {
  const fiatValue = getAssetValueInFiat(tokenValue, assetAddress, rates, currency);
  return wrapBigNumberOrNil(fiatValue)?.decimalPlaces(2, BigNumber.ROUND_HALF_EVEN);
}

function calculateTokenValue(fiatValue: ?BigNumber, asset: ?Asset, rates: RatesByAssetAddress, currency: Currency) {
  const tokenValue = getAssetValueFromFiat(fiatValue, asset?.address, rates, currency);
  if (!tokenValue) return null;

  const resultDecimals = Math.min(6, asset?.decimals ?? 18);
  return truncateDecimalPlaces(tokenValue, resultDecimals);
}

const Container = styled.View``;
