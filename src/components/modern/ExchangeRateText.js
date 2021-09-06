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
import styled from 'styled-components/native';

// Components
import Icon from 'components/core/Icon';
import Text from 'components/core/Text';

// Utils
import { hitSlop20 } from 'utils/common';
import { formatExchangeRate } from 'utils/format';
import { useThemeColors } from 'utils/themes';

type Props = {
  rate: number,
  fromSymbol: string,
  toSymbol: string,
};

const ExchangeRateText = ({ fromSymbol, toSymbol, rate }: Props) => {
  const [isReversed, setIsReversed] = React.useState(false);

  const colors = useThemeColors();

  return (
    <TouchableContainer onPress={() => setIsReversed(!isReversed)} hitSlop={hitSlop20}>
      <ExchangeIcon name="refresh" color={colors.link} width={16} height={16} />
      <Text>{formatExchangeRate(rate, fromSymbol, toSymbol, isReversed)}</Text>
    </TouchableContainer>
  );
};

export default ExchangeRateText;

const TouchableContainer = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
`;

export const ExchangeIcon = styled(Icon)`
  margin-right: 4px;
`;
