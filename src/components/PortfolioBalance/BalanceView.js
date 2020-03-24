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
import * as React from 'react';
import { View } from 'react-native';
import styled from 'styled-components/native';

import { BaseText } from 'components/Typography';
import { formatFiat } from 'utils/common';
import { fontSizes, spacing } from 'utils/variables';
import { themedColors } from 'utils/themes';

type Props = {
  balance: number,
  fiatCurrency: string,
  label?: string,
  style: Object,
};

const LabelText = styled(BaseText)`
  color: ${themedColors.secondaryText};
  font-size: ${fontSizes.medium}px;
  padding: 10px 0;
`;

const BalanceText = styled(BaseText)`
  color: ${themedColors.text};
  font-size: ${fontSizes.giant}px;
`;

const BalanceWrapper = styled.View`
  padding: ${spacing.medium}px ${spacing.layoutSides}px;
  width: 100%;
`;

class BalanceView extends React.PureComponent<Props> {
  render() {
    const {
      style,
      fiatCurrency,
      label,
      balance,
    } = this.props;

    const portfolioBalance = formatFiat(balance, fiatCurrency);

    return (
      <BalanceWrapper>
        <View style={style}>
          {!!label && <LabelText>{label}</LabelText>}
          <BalanceText>{portfolioBalance}</BalanceText>
        </View>
      </BalanceWrapper>
    );
  }
}

export default BalanceView;
