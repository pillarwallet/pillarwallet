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
import { CachedImage } from 'react-native-cached-image';

import { baseColors, fontSizes } from 'utils/variables';
import { BaseText } from 'components/Typography';

type Props = {
  amount: string,
  wrapperStyle?: Object,
  textStyle?: ?Object,
  token?: string,
  bottomExtra?: any,
};

const Wrapper = styled.View`
  flex-direction: row;
  align-items: center;
`;

const BalanceInTank = styled(BaseText)`
  color: ${baseColors.electricBlueIntense};
  font-size: ${fontSizes.big}px;
`;

const Icon = styled(CachedImage)`
  width: 6px;
  height: 12px;
  margin-right: 4px;
`;

const lightningIcon = require('assets/icons/icon_lightning_sm.png');

const TankAssetBalance = (props: Props) => {
  const {
    amount,
    wrapperStyle,
    textStyle,
    token,
    bottomExtra,
  } = props;

  return (
    <View>
      <Wrapper style={wrapperStyle}>
        <Icon source={lightningIcon} />
        <BalanceInTank style={textStyle}>{amount}</BalanceInTank>
        {!!token && <BalanceInTank style={textStyle}> {token}</BalanceInTank>}
      </Wrapper>
      {bottomExtra}
    </View>
  );
};

export default TankAssetBalance;
