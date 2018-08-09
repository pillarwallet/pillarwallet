// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { baseColors, fontSizes } from 'utils/variables';
import { BoldText } from 'components/Typography';

const CircleImage = styled.Image`
  width: ${props => (props.diameter ? props.diameter : '50')}px;
  height: ${props => (props.diameter ? props.diameter : '50')}px;
  border-radius: ${props => (props.diameter ? props.diameter / 2 : '25')}px;
  ${props => (props.additionalImageStyle)};
  background: ${baseColors.lightGray};
`;

const ImageTouchable = styled.TouchableOpacity`
  width: ${props => (props.diameter ? props.diameter : '50')}px;
  height: ${props => (props.diameter ? props.diameter : '50')}px;
  border-radius: ${props => (props.diameter ? props.diameter / 2 : '25')}px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${props => (props.transparent ? 'transparent' : baseColors.cyan)};
  ${props => (props.additionalContainerStyle)};
`;

const AvatarText = styled(BoldText)`
  font-size: ${fontSizes.large};
  color: ${baseColors.white};
  text-align: center;
  ${props => (props.additionalTextStyle)};
`;

type Props = {
  uri?: string,
  userName: string,
  containerStyle?: Object,
  textStyle?: Object,
  imageStyle?: Object,
  onPress?: Function,
  diameter?: number,
  style?: Object,
}

const ProfileImage = (props: Props) => {
  const {
    uri,
    userName,
    containerStyle,
    textStyle,
    imageStyle,
    onPress,
    style,
    diameter,
  } = props;

  const initials = userName
    .split(' ')
    .map(name => name.substring(0, 1))
    .join('')
    .toUpperCase();

  return (
    <ImageTouchable
      additionalContainerStyle={containerStyle}
      diameter={diameter}
      disabled={!onPress}
      onPress={onPress}
      transparent={uri}
      style={style}
    >
      {!uri && <AvatarText additionalTextStyle={textStyle}>{initials}</AvatarText>}
      {!!uri && <CircleImage additionalImageStyle={imageStyle} diameter={diameter} source={{ uri }} />}
    </ImageTouchable>
  );
};

export default ProfileImage;
