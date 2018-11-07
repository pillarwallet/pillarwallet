// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { StyleSheet } from 'react-native';
import Icon from 'components/Icon';
import { BaseText } from 'components/Typography';
import { fontSizes, baseColors, fontWeights } from 'utils/variables';

type Props = {
  icon: string,
  color?: string,
  onPress?: Function,
  fontSize?: number,
  style?: StyleSheet.Styles,
  iconStyle?: StyleSheet.Styles,
  type?: string,
  margin?: number,
  iconText?: string,
}

const IconButtonWrapper = styled.TouchableOpacity`
  justify-content: center;
  padding: 0;
`;

const ButtonText = styled(BaseText)`
  color: ${baseColors.electricBlue};
  font-size: ${fontSizes.extraExtraSmall};
  font-weight: ${fontWeights.medium};
`;

const IconButton = (props: Props) => {
  const {
    icon,
    onPress,
    fontSize,
    color,
    style,
    margin,
    type,
    iconText,
    iconStyle = {},
  } = props;
  const iconParams = {
    active: false,
    name: icon,
    style: {
      paddingTop: 0,
      fontSize,
      color,
      marginLeft: margin,
      marginRight: margin,
      marginTop: margin,
      marginBottom: margin,
      ...iconStyle,
    },
    type,
  };
  return (
    <IconButtonWrapper style={style} onPress={onPress}>
      <Icon {...iconParams} />
      {!!iconText && <ButtonText>{iconText}</ButtonText>}
    </IconButtonWrapper>
  );
};

export default IconButton;
