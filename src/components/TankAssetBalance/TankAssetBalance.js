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
import styled from 'styled-components/native';
import { baseColors, fontSizes } from 'utils/variables';
import { MediumText } from 'components/Typography';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

type Props = {
  isSynthetic?: boolean,
  amount: string,
  wrapperStyle?: Object,
  monoColor?: boolean,
};

const Wrapper = styled.View`
  flex-direction: row;
`;

const BalanceInTank = styled(MediumText)`
  color: ${baseColors.electricBlueIntense};
  font-size: ${fontSizes.medium}px;
`;

const getIconFill = (props) => {
  if (props.isSynthetic) {
    return 'url(#gradSynthetic)';
  } else if (props.monoColor) {
    return baseColors.electricBlueIntense;
  }
  return 'url(#grad)';
};

const TankAssetBalance = (props: Props) => {
  const {
    amount,
    wrapperStyle,
  } = props;

  const iconFill = getIconFill(props);

  return (
    <Wrapper style={wrapperStyle}>
      <Svg
        width="20"
        height="24"
        fill={iconFill}
        color="green"
        viewBox="0 0 400 600"
      >
        <Defs>
          <LinearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={baseColors.electricBlueIntense} stopOpacity="1" />
            <Stop offset="100%" stopColor="#3ac694" stopOpacity="1" />
          </LinearGradient>
          <LinearGradient id="gradSynthetic" x1="0%" y1="42%" x2="100%" y2="58%">
            <Stop offset="0%" stopColor={baseColors.electricBlueIntense} stopOpacity="1" />
            <Stop offset="30%" stopColor={baseColors.electricBlueIntense} stopOpacity="1" />
            <Stop offset="70%" stopColor="#c62222" stopOpacity="1" />
            <Stop offset="100%" stopColor="#c62222" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Path
          d="M159.838 230.378 C 110.362 345.801,109.701 340.000,172.332 340.000 C 223.910 340.000,230.027
          366.488,197.734 450.000 C 180.347 494.964,231.738 485.113,252.835 439.438 C 306.547 323.150,306.301
          300.000,251.348 300.000 C 195.040 300.000,190.506 287.576,219.236 212.010 C 255.111 117.651,200.984
          134.389,159.838 230.378"
          strokeWidth="32"
        />
      </Svg>
      <BalanceInTank>{amount}</BalanceInTank>
    </Wrapper>
  );
};

export default TankAssetBalance;
