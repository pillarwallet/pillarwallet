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

import React, { forwardRef } from 'react';
import { Keyboard, TextInput as RNTextInput, TouchableOpacity } from 'react-native';
import { useTranslationWithPrefix } from 'translations/translate';
import styled from 'styled-components/native';
import { BigNumber } from 'bignumber.js';

// Constants
import { WalletType } from 'constants/plrStakingConstants';

// Types
import type { Asset } from 'models/Asset';

// Utils
import { appFont, borderRadiusSizes, fontSizes, fontStyles, spacing } from 'utils/variables';
import { useChainsConfig } from 'utils/uiConfig';
import { truncateDecimalPlaces } from 'utils/bigNumber';
import { hitSlop10 } from 'utils/common';
import { formatFiatValue } from 'utils/format';
import { getAssetValueInFiat } from 'utils/rates';
import { mapWalletTypeToName, mapWalletTypeToIcon } from 'utils/plrStakingHelper';

// Selectors
import { useFiatCurrency, useChainRates } from 'selectors';

// Components
import Text from 'components/core/Text';
import TokenIcon from 'components/display/TokenIcon';
import Icon from 'components/core/Icon';
import PercentsInputAccessoryHolder, {
  INPUT_ACCESSORY_NATIVE_ID,
} from 'components/PercentsInputAccessory/PercentsInputAccessoryHolder';
import BigNumberInput from 'components/inputs/BigNumberInput';

// Using type 'any' as TS clashes with flow types
type Instance = typeof RNTextInput;

interface IAssetInput extends React.ComponentPropsWithoutRef<Instance> {
  value: string;
  onValueChange?: (value: string) => void;
  asset: Asset;
  chain: string;
  walletType?: WalletType;
  balance?: BigNumber;
  disabled?: boolean;
  maxValue?: BigNumber;
  referenceValue?: BigNumber | null;
  referenceDisableMax?: boolean;
  toFixedValue?: number;
  isToSelector?: boolean;
  onTokenPress?: () => void;
  symbolOverride?: string;
  to?: boolean;
}

const AssetInput = forwardRef<Instance, IAssetInput>(
  (
    {
      value,
      onValueChange,
      asset,
      chain,
      walletType,
      balance,
      disabled,
      maxValue,
      referenceValue,
      referenceDisableMax,
      toFixedValue,
      isToSelector,
      onTokenPress,
      symbolOverride,
      to,
    },
    ref,
  ) => {
    const { t, tRoot } = useTranslationWithPrefix('plrStaking.assetSelector');

    const chainsConfig = useChainsConfig();
    const rates = useChainRates(chain);
    const currency = useFiatCurrency();

    const decimals = asset?.decimals ?? 15;

    const handleUseMaxValue = () => {
      onValueChange?.(truncateDecimalPlaces(referenceValue, 15));
    };

    const handleSetPercent = (percent: number) => {
      Keyboard.dismiss();

      if (!referenceValue) return;

      // Use exact max amount for 100%.
      if (percent === 100) {
        handleUseMaxValue();
        return;
      }

      const newValue = referenceValue.times(percent).div(100).precision(6, BigNumber.ROUND_DOWN);
      const newValueTruncated = truncateDecimalPlaces(newValue, decimals > 15 ? 15 : decimals);
      onValueChange?.(newValueTruncated);
    };

    const handleFocus = () => {
      PercentsInputAccessoryHolder.addAccessory(handleSetPercent, referenceDisableMax);
    };

    const handleBlur = () => {
      PercentsInputAccessoryHolder.removeAccessory();
    };

    const { titleShort: networkName } = chainsConfig[chain];

    const fiatValue = getAssetValueInFiat(value, asset?.address, rates, currency) ?? new BigNumber(0);
    const formattedFiatValue = formatFiatValue(fiatValue, currency);

    const toSelectorFetchStatus =
      // eslint-disable-next-line no-nested-ternary
      parseFloat(fiatValue) !== 0
        ? tRoot('estimatedValue', { value: formattedFiatValue })
        : !rates
        ? t('fetching')
        : value && tRoot('fetch_failed');

    const balanceStatusVal = isToSelector
      ? toSelectorFetchStatus
      : value && tRoot('estimatedValue', { value: formattedFiatValue });

    return (
      <Container>
        <WalletTextWrapper disabled={disabled}>
          <WalletText>{to ? t('to') : t('from')}</WalletText>
          {/* @ts-ignore */}
          <Icon style={styles.walletIcon} name={mapWalletTypeToIcon(walletType)} />
          <WalletText>{mapWalletTypeToName(walletType)}</WalletText>
        </WalletTextWrapper>

        <InputContainer onPress={() => onTokenPress?.()} disabled={disabled}>
          {!!asset && (
            <TokenInfo disabled={disabled || !onTokenPress}>
              <TokenIcon url={asset?.iconUrl} size={34} chain={chain} />
              <TokenContainer>
                <TokenSymbol>{symbolOverride || asset?.symbol}</TokenSymbol>
                <TokenNetwork>{t('on', { network: networkName })}</TokenNetwork>
              </TokenContainer>
            </TokenInfo>
          )}

          <BigNumberInput
            ref={ref}
            value={value}
            onValueChange={onValueChange}
            decimals={decimals > 15 ? 15 : decimals}
            maxValue={maxValue}
            editable={!!asset && !disabled}
            style={styles.input}
            onFocus={referenceValue ? handleFocus : undefined}
            onBlur={referenceValue ? handleBlur : undefined}
            inputAccessoryViewID={referenceValue ? INPUT_ACCESSORY_NATIVE_ID : undefined}
            toFixed={toFixedValue}
            maxFontSize={30}
          />

          <FiatWrapper disabled={disabled}>
            <Balance>{balanceStatusVal}</Balance>
          </FiatWrapper>
        </InputContainer>

        <MaxAmountWrapper>
          <SubContainer>
            {chain && balance && <TokenBalance>{t('balance', { balance: balance?.toFixed(4) })}</TokenBalance>}
          </SubContainer>
          {(referenceDisableMax == null || referenceDisableMax == undefined || referenceDisableMax === false) && ( //@ts-ignore - TS cannot read Touchable as a JSX element
            <TouchableOpacity hitSlop={hitSlop10} onPress={handleUseMaxValue} disabled={disabled}>
              <TextButtonTitle disabled={disabled}>{t('max')}</TextButtonTitle>
            </TouchableOpacity>
          )}
        </MaxAmountWrapper>
      </Container>
    );
  },
);

export default AssetInput;

const styles = {
  walletIcon: {
    marginLeft: spacing.extraSmall / 2,
    marginRight: spacing.extraSmall / 2,
  },
  input: {
    flex: 1,
    fontSize: 10,
  },
  textStyle: {
    fontSize: 10,
  },
};

const Container = styled.View`
  display: flex;
  flex: 1;
`;

const WalletTextWrapper = styled.View.attrs((props: { disabled?: boolean }) => props)`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;

  ${({ disabled }) => disabled && `opacity: 0.7;`};
`;

const WalletText = styled(Text)`
  ${fontStyles.regular};
  color: ${({ theme }) => theme.colors.basic030};
`;

const InputContainer = styled.TouchableOpacity.attrs((props: { disabled?: boolean }) => props)`
  background-color: ${({ theme, disabled }) => (disabled ? 'rgba(0,0,0,0)' : theme.colors.basic050)};
  border-radius: ${borderRadiusSizes.extraSmall}px;
  padding: ${spacing.medium}px ${spacing.mediumSmall}px;
  margin: ${spacing.extraSmall}px 0;
`;

// Token
const TokenContainer = styled.View.attrs((props: { disabled?: boolean }) => props)`
  align-items: flex-start;
  margin-left: ${spacing.small}px;
  ${({ disabled }) => disabled && `opacity: 0.7;`};
`;

const TokenInfo = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: ${spacing.small}px;
`;

const TokenNetwork = styled(Text)`
  font-family: ${appFont.medium};
  font-size: ${fontSizes.small}px;
  padding-right: ${spacing.small}px;
  color: ${({ theme }) => theme.colors.basic020};
`;

const TokenSymbol = styled(Text)`
  font-family: ${appFont.medium};
  font-size: ${fontSizes.big}px;
  padding-right: ${spacing.small}px;
`;

// Fiat
const FiatWrapper = styled.View`
  flex-direction: row;
`;

const SubContainer = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
`;

const Balance = styled(Text)`
  flex: 1;
  color: ${({ theme }) => theme.colors.basic010};
`;

const TokenBalance = styled(Text)`
  color: ${({ theme }) => theme.colors.basic010};
`;

const TextButtonTitle = styled(Text).attrs((props: { disabled?: boolean }) => props)`
  margin-left: ${spacing.medium}px;
  color: ${({ disabled, theme }) => (disabled ? theme.colors.basic010 : theme.colors.basic000)};
`;

// Max amount
const MaxAmountWrapper = styled.View`
  flex-direction: row;
`;
