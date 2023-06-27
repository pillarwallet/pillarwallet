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

/*
  There is an issue with the bignumber.js when the decimal places exceeds 15 it warns about the underflow error on
  fractional decimal due to calculations involved for exchange rates and the fiat conversions and javascript isnt
  good in handling many decimal places. In order to overcome this we have restricted the decimal places upto 15
  as it is highly unlikely for the user to do so.
*/

import * as React from 'react';
import { Keyboard, TextInput as RNTextInput } from 'react-native';
import { BigNumber } from 'bignumber.js';
import styled from 'styled-components/native';
import { useTranslation } from 'translations/translate';

// Components
import BigNumberInput from 'components/inputs/BigNumberInput';
import PercentsInputAccessoryHolder, {
  INPUT_ACCESSORY_NATIVE_ID,
} from 'components/PercentsInputAccessory/PercentsInputAccessoryHolder';
import Text from 'components/core/Text';
import TokenIcon from 'components/display/TokenIcon';

// Utils
import { truncateDecimalPlaces } from 'utils/bigNumber';
import { appFont, fontSizes, spacing } from 'utils/variables';
import { useChainConfig } from 'utils/uiConfig';

// Constants
import { CHAIN } from 'constants/chainConstants';

// Types
import type { ViewStyleProp, TextStyleProp } from 'utils/types/react-native';
import type { Asset } from 'models/Asset';
import type { Chain } from 'models/Chain';

type Props = {|
  value: ?BigNumber,
  onValueChange?: (value: ?BigNumber) => mixed,
  chain: ?Chain,
  asset: ?Asset,
  maxValue?: ?BigNumber, // Used for validation
  referenceValue?: ?BigNumber, // Used for percent bar
  referenceDisableMax?: boolean, // Disable 100% percent value
  editable?: boolean,
  style?: ViewStyleProp,
  textStyle?: TextStyleProp,
  onTokenPress?: () => mixed,
  onPercentInput?: () => mixed,
  showChainIcon?: boolean,
  placeholder?: string | null | '',
  toFixedValue?: number,
|};

type Instance = typeof RNTextInput;

/**
 * TextInput for handling token value input.
 */
const TokenValueInput = React.forwardRef<Props, Instance>((props, ref) => {
  const {
    value,
    onValueChange,
    chain,
    asset,
    maxValue,
    referenceValue,
    referenceDisableMax,
    editable,
    style,
    textStyle,
    onTokenPress,
    toFixedValue,
  } = props;

  const { t } = useTranslation();
  const decimals = asset?.decimals ?? 15;
  // eslint-disable-next-line no-nested-ternary
  const maxDecimals = decimals === 6 ? 4 : decimals > 15 ? 15 : decimals;

  const handleSetPercent = (percent: number) => {
    Keyboard.dismiss();

    if (!referenceValue) return;

    // Use exact max amount for 100%.
    if (percent === 100) {
      onValueChange?.(referenceValue);
      return;
    }

    const newValue = referenceValue.times(percent).div(100).precision(6, BigNumber.ROUND_DOWN);
    const newValueTruncated = truncateDecimalPlaces(newValue, maxDecimals);
    onValueChange?.(newValueTruncated);
  };

  const handleFocus = () => {
    PercentsInputAccessoryHolder.addAccessory(handleSetPercent, referenceDisableMax);
  };

  const handleBlur = () => {
    PercentsInputAccessoryHolder.removeAccessory();
  };

  const config = useChainConfig(chain || CHAIN.ETHEREUM);

  const networkName = chain ? config.title : undefined;

  return (
    <Container style={style}>
      <BigNumberInput
        ref={ref}
        value={value}
        onValueChange={onValueChange}
        decimals={maxDecimals}
        maxValue={maxValue}
        editable={asset ? editable : false}
        style={[styles.input, textStyle]}
        onFocus={referenceValue ? handleFocus : undefined}
        onBlur={referenceValue ? handleBlur : undefined}
        inputAccessoryViewID={referenceValue ? INPUT_ACCESSORY_NATIVE_ID : undefined}
        toFixed={toFixedValue}
      />

      {!!asset && (
        <TouchableTokenInfo disabled={!onTokenPress} onPress={onTokenPress}>
          <TokenContainer>
            <TokenSymbol>{asset?.symbol}</TokenSymbol>
            <TokenNetwork>{t('label.on_network', { network: networkName })}</TokenNetwork>
          </TokenContainer>
          <TokenIcon url={asset?.iconUrl} size={34} chain={chain} />
        </TouchableTokenInfo>
      )}
      {!asset && onTokenPress && (
        <ButtonContainer onPress={onTokenPress}>
          <ButtonTitle>{t('button.selectToken')}</ButtonTitle>
        </ButtonContainer>
      )}
    </Container>
  );
});

export default TokenValueInput;

const styles = {
  input: {
    flex: 1,
  },
};

const Container = styled.View`
  flex-direction: row;
  align-items: flex-end;
`;

const TokenContainer = styled.View`
  align-items: flex-end;
`;

// Token symbol & icons are positioned by hand, because baseline alignment does not work for android.
const TouchableTokenInfo = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  margin-left: ${spacing.medium}px;
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

const ButtonContainer = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: ${spacing.mediumLarge}px ${spacing.extraLarge}px;
  background-color: ${({ theme }) => theme.colors.basic050};
  border-radius: 15px;
  shadow-opacity: 0.12;
  shadow-color: #000;
  shadow-offset: 0 4px;
  shadow-radius: 16px;
  elevation: 6;
`;

const ButtonTitle = styled(Text)`
  font-size: ${fontSizes.medium}px;
  text-align: center;
`;
