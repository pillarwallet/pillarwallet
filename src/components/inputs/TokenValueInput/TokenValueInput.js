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
import { Keyboard, TextInput as RNTextInput } from 'react-native';
import { BigNumber } from 'bignumber.js';
import styled from 'styled-components/native';
import { useTranslation } from 'translations/translate';

// Components
import BigNumberInput from 'components/modern/BigNumberInput';
import PercentsInputAccessoryHolder, {
  INPUT_ACCESSORY_NATIVE_ID,
} from 'components/PercentsInputAccessory/PercentsInputAccessoryHolder';
import Text from 'components/modern/Text';
import TokenIcon from 'components/Icons/TokenIcon';

// Utils
import { truncateDecimalPlaces } from 'utils/bigNumber';
import { appFont, fontSizes, spacing } from 'utils/variables';

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
    showChainIcon,
  } = props;

  const { t } = useTranslation();

  const handleSetPercent = (percent: number) => {
    Keyboard.dismiss();

    if (!referenceValue) return;

    // Use exact max amount for 100%.
    if (percent === 100) {
      onValueChange?.(referenceValue);
      return;
    }

    const newValue = referenceValue.times(percent).div(100).precision(6, BigNumber.ROUND_DOWN);
    const newValueTruncated = truncateDecimalPlaces(newValue, asset?.decimals ?? 18);
    onValueChange?.(newValueTruncated);
  };

  const handleFocus = () => {
    PercentsInputAccessoryHolder.addAccessory(handleSetPercent, referenceDisableMax);
  };

  const handleBlur = () => {
    PercentsInputAccessoryHolder.removeAccessory();
  };

  return (
    <Container style={style}>
      <BigNumberInput
        ref={ref}
        value={value}
        onValueChange={onValueChange}
        decimals={asset?.decimals}
        maxValue={maxValue}
        editable={editable}
        style={[styles.input, textStyle]}
        onFocus={referenceValue ? handleFocus : undefined}
        onBlur={referenceValue ? handleBlur : undefined}
        inputAccessoryViewID={referenceValue ? INPUT_ACCESSORY_NATIVE_ID : undefined}
      />

      {!!asset && (
        <TouchableTokenInfo disabled={!onTokenPress} onPress={onTokenPress}>
          <TokenSymbol>{asset?.symbol}</TokenSymbol>
          <TokenIcon url={asset?.iconUrl} size={24} chain={showChainIcon ? chain : undefined} />
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

// Token symbol & icons are positioned by hand, because baseline alignment does not work for android.
const TouchableTokenInfo = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  margin-left: ${spacing.medium}px;
  margin-bottom: ${spacing.small}px;
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
