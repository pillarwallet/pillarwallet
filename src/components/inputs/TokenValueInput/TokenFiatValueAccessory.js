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
import { Keyboard, TouchableOpacity } from 'react-native';
import { BigNumber } from 'bignumber.js';
import styled from 'styled-components/native';
import { useTranslation } from 'translations/translate';

// Components
import Text from 'components/core/Text';

// Selectors
import { useChainRates, useFiatCurrency } from 'selectors';

// Utils
import { hitSlop10 } from 'utils/common';
import { formatFiatValue } from 'utils/format';
import { getAssetValueInFiat } from 'utils/rates';
import { spacing } from 'utils/variables';

// Types
import type { ViewStyleProp } from 'utils/types/react-native';
import type { Asset } from 'models/Asset';
import type { Chain } from 'models/Chain';

type Props = {|
  chain: ?Chain,
  asset: ?Asset,
  value?: ?BigNumber,
  onUseMax?: () => mixed,
  disableUseMax?: boolean,
  useMaxTitle?: string,
  style?: ViewStyleProp,
|};

const TokenFiatValueAccessory = ({ chain, asset, value, onUseMax, disableUseMax, useMaxTitle, style }: Props) => {
  const { t } = useTranslation();

  const rates = useChainRates(chain);
  const currency = useFiatCurrency();

  const handleUseMaxValue = () => {
    Keyboard.dismiss();
    onUseMax?.();
  };

  const fiatValue = getAssetValueInFiat(value, asset?.address, rates, currency) ?? BigNumber(0);
  const formattedFiatValue = formatFiatValue(fiatValue, currency);

  return (
    <Container style={style}>
      <Balance>{t('estimatedValue', { value: formattedFiatValue })}</Balance>

      {!disableUseMax && (
        <TouchableOpacity hitSlop={hitSlop10} onPress={handleUseMaxValue}>
          <TextButtonTitle>{useMaxTitle ?? t('button.useMax')}</TextButtonTitle>
        </TouchableOpacity>
      )}
    </Container>
  );
};

export default TokenFiatValueAccessory;

const Container = styled.View`
  flex-direction: row;
`;

const Balance = styled(Text)`
  flex: 1;
  color: ${({ theme }) => theme.colors.secondaryText};
`;

const TextButtonTitle = styled(Text)`
  margin-left: ${spacing.medium}px;
  color: ${({ theme }) => theme.colors.link};
`;
