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
import { BaseText, MediumText } from 'components/Typography';
import { fontSizes } from 'utils/variables';


type Props = {
  buttonText: string,
  onPress?: Function,
  fontSize?: number,
  wrapperStyle?: Object,
  medium?: boolean,
};

const ButtonLabelRegular = styled(BaseText)`
  font-size: ${({ fontSize }) => fontSize || fontSizes.regular}px;
  color: rgb(32,119,253);
`;

const ButtonLabelMedium = styled(MediumText)`
  font-size: ${({ fontSize }) => fontSize || fontSizes.regular}px;
  color: rgb(32,119,253);
`;

const renderButtonLabel = ({ fontSize, medium, buttonText }: Props) => !medium
  ? <ButtonLabelRegular fontSize={fontSize}>{buttonText}</ButtonLabelRegular>
  : <ButtonLabelMedium fontSize={fontSize}>{buttonText}</ButtonLabelMedium>;

const ButtonText = (props: Props) => {
  const { onPress, wrapperStyle } = props;

  if (Platform.OS === 'ios') {
    return (
      <TouchableOpacity onPress={onPress} style={wrapperStyle}>
        {renderButtonLabel(props)}
      </TouchableOpacity>
    );
  }

  const defaultViewStyle = { alignSelf: 'center', margin: 0 };
  const combinedViewStyles = [defaultViewStyle, wrapperStyle];

  return (
    <TouchableNativeFeedback
      onPress={onPress}
      background={TouchableNativeFeedback.SelectableBackgroundBorderless()}
    >
      <View style={combinedViewStyles}>
        {renderButtonLabel(props)}
      </View>
    </TouchableNativeFeedback>
  );
};

export default ButtonText;
