// @flow
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
