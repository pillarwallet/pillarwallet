// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { baseColors, fontSizes, fontWeights } from 'utils/variables';

const CircleImage = styled.Image`
  width: 50px;
  height: 50px;
  border-radius: 25px;
  ${props => (props.additionalImageStyle)};
`;

const ImageTouchable = styled.TouchableOpacity`
  width: 50px;
  height: 50px;
  border-radius: 25px;
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
}

const ProfileImage = (props: Props) => {
  const {
    uri,
    userName,
    containerStyle,
    textStyle,
    imageStyle,
    onPress,
  } = props;

  const initials = userName
    .split(' ')
    .map(name => name.substring(0, 1))
    .join('')
    .toUpperCase();

  return (
    <ImageTouchable additionalContainerStyle={containerStyle} disabled={!onPress} onPress={onPress}>
      {!uri && <AvatarText additionalTextStyle={textStyle}>{initials}</AvatarText>}
      {!!uri && <CircleImage additionalImageStyle={imageStyle} source={{ uri }} />}
    </ImageTouchable>
  );
};

export default ProfileImage;
