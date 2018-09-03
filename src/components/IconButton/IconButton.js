// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { StyleSheet } from 'react-native';
import Icon from 'components/Icon';

type Props = {
  icon: string,
  color?: string,
  onPress?: Function,
  fontSize?: number,
  style?: StyleSheet.Styles,
  iconStyle?: StyleSheet.Styles,
  type?: string,
  margin?: number,
}

const IconButtonWrapper = styled.TouchableOpacity`
  justify-content: center;
  padding: 0;
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
    </IconButtonWrapper>
  );
};

export default IconButton;
