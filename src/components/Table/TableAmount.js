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
import { getFormattedRate } from 'utils/assets';
import {
  formatAmount,
  hitSlop10,
  wrapBigNumber,
} from 'utils/common';
import { images } from 'utils/images';
import { useTheme } from 'utils/themes';

// components
import Image from 'components/Image';
import { BaseText } from 'components/Typography';
import Tooltip from 'components/Tooltip';

// selectors
import {
  useChainRates,
  useFiatCurrency,
} from 'selectors';

// types
import type { Chain } from 'models/Chain';
import type { Value } from 'utils/common';


type Props = {
  amount: Value,
  chain: Chain,
  token?: string,
  highFees?: boolean,
};

const HighFeesIcon = styled(Image)`
  height: 16px;
  width: 16px;
  margin-right: 4px;
`;

const Row = styled.View`
  flex-direction: row;
  align-items: center;
`;

const TableAmount = ({
  amount,
  token,
  chain,
  highFees,
}: Props) => {
  const theme = useTheme();
  const chainRates = useChainRates(chain);
  const fiatCurrency = useFiatCurrency();

  const amountBN = wrapBigNumber(amount);

  const [showTokenAmount, setShowTokenAmount] = useState<boolean>(false);
  if (amountBN.isZero()) {
    return (
      <BaseText regular positive>{t('label.free')}</BaseText>
    );
  }

  const fiatAmount = getFormattedRate(chainRates, amountBN.toNumber(), token ?? '', fiatCurrency);
  const formattedAmount = formatAmount(amount);
  const tooltipText = t('tokenValue', { value: formattedAmount, token });

  const { highFeesIcon } = images(theme);

  return (
    <Tooltip body={tooltipText} isVisible={showTokenAmount} positionOnBottom={false}>
      <Row>
        {!!highFees && <HighFeesIcon source={highFeesIcon} />}
        <TouchableOpacity hitSlop={hitSlop10} activeOpacity={1} onPress={() => setShowTokenAmount(!showTokenAmount)}>
          <BaseText regular>{fiatAmount}</BaseText>
        </TouchableOpacity>
      </Row>
    </Tooltip>
  );
};

export default TableAmount;
