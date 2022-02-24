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
import React, { useState } from 'react';
import { TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';
import t from 'translations/translate';

// utils
import { formatAmount, formatFiat, hitSlop10 } from 'utils/common';
import { wrapBigNumber } from 'utils/bigNumber';
import { images } from 'utils/images';
import { useTheme } from 'utils/themes';
import { getAssetRateInFiat } from 'utils/rates';

// components
import Image from 'components/Image';
import { BaseText } from 'components/legacy/Typography';
import Tooltip from 'components/Tooltip';

// selectors
import { useChainRates, useFiatCurrency } from 'selectors';

// types
import type { Chain } from 'models/Chain';
import type { Value } from 'models/Value';

/**
 * TODO: get assetSymbol from matching asset once assets can be queried by assetAddress as key
 * instead of performing expensive search on whole assets array
 */
type Props = {
  amount: Value,
  chain: Chain,
  assetSymbol?: string,
  assetAddress?: string,
  highFee?: boolean,
};

const HighFeeIcon = styled(Image)`
  height: 16px;
  width: 16px;
  margin-right: 4px;
`;

const Row = styled.View`
  flex-direction: row;
  align-items: center;
`;

const TableAmount = ({ amount, assetSymbol, assetAddress, chain, highFee }: Props) => {
  const theme = useTheme();
  const chainRates = useChainRates(chain);
  const fiatCurrency = useFiatCurrency();

  const amountBN = wrapBigNumber(amount);

  const [showTokenAmount, setShowTokenAmount] = useState<boolean>(false);
  if (amountBN.isZero()) {
    return (
      <BaseText regular positive>
        {t('label.free')}
      </BaseText>
    );
  }

  const assetRate = getAssetRateInFiat(chainRates, assetAddress ?? '', fiatCurrency);
  const fiatAmount = formatFiat(amountBN.times(assetRate).toNumber(), fiatCurrency);
  const formattedAmount = formatAmount(amount);
  const tooltipText = t('tokenValue', { value: formattedAmount, token: assetSymbol });

  const { highFeesIcon } = images(theme);

  const highFeeText = `color: ${theme.colors.negative}`;

  return (
    <Tooltip body={tooltipText} isVisible={showTokenAmount} positionOnBottom={false}>
      <Row>
        {!!highFee && <HighFeeIcon source={highFeesIcon} />}
        <TouchableOpacity hitSlop={hitSlop10} activeOpacity={1} onPress={() => setShowTokenAmount(!showTokenAmount)}>
          <BaseText regular css={highFee && highFeeText}>
            {fiatAmount}
          </BaseText>
        </TouchableOpacity>
      </Row>
    </Tooltip>
  );
};

export default TableAmount;
