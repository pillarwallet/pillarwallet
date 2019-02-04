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
import { Platform, TouchableOpacity, TouchableNativeFeedback, View } from 'react-native';
import styled from 'styled-components/native';
import { BaseText } from 'components/Typography';
import { fontSizes } from 'utils/variables';

type Props = {
  buttonText: string,
  onPress: Function,
  fontSize?: number,
  wrapperStyle?: Object,
}

const ButtonLabel = styled(BaseText)`
  font-size: ${props => props.fontSize ? props.fontSize : fontSizes.extraSmall}px;
  color: rgb(32,119,253);
`;

const ButtonText = (props: Props) => {
  const {
    buttonText,
    onPress,
    fontSize,
    wrapperStyle,
  } = props;
  if (Platform.OS === 'ios') {
    return (
      <TouchableOpacity onPress={onPress} style={wrapperStyle}>
        <ButtonLabel fontSize={fontSize}>{buttonText}</ButtonLabel>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableNativeFeedback
      onPress={onPress}
      background={TouchableNativeFeedback.SelectableBackgroundBorderless()}
    >
      <View style={[{
        alignSelf: 'center',
        margin: 0,
      }, wrapperStyle]}
      >
        <ButtonLabel fontSize={fontSize}>{buttonText}</ButtonLabel>
      </View>
    </TouchableNativeFeedback>
  );
};

export default ButtonText;
