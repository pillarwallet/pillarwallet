// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { baseColors, fontSizes, fontWeights } from 'utils/variables';

const CircleImage = styled.Image`
  width: ${props => (props.diameter ? props.diameter : '50')}px;
  height: ${props => (props.diameter ? props.diameter : '50')}px;
  border-radius: ${props => (props.diameter ? props.diameter / 2 : '25')}px;
  ${props => (props.additionalImageStyle)};
`;

const ImageTouchable = styled.TouchableOpacity`
  width: ${props => (props.diameter ? props.diameter : '50')}px;
  height: ${props => (props.diameter ? props.diameter : '50')}px;
  border-radius: ${props => (props.diameter ? props.diameter / 2 : '25')}px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${baseColors.brightSkyBlue};
  ${props => (props.additionalContainerStyle)};
`;

const AvatarText = styled.Text`
  font-size: ${fontSizes.large};
  font-weight: ${fontWeights.bold};
  color: ${baseColors.white};
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
}

const ProfileImage = (props: Props) => {
  const {
    uri,
    userName,
    containerStyle,
    textStyle,
    imageStyle,
    onPress,
    diameter,
  } = props;

  const initials = userName
    .split(' ')
    .map(name => name.substring(0, 1))
    .join('')
    .toUpperCase();

  return (
    <ImageTouchable additionalContainerStyle={containerStyle} diameter={diameter} disabled={!onPress} onPress={onPress}>
      {!uri && <AvatarText additionalTextStyle={textStyle}>{initials}</AvatarText>}
      {!!uri && <CircleImage additionalImageStyle={imageStyle} source={{ uri }} />}
    </ImageTouchable>
  );
};

export default ProfileImage;
