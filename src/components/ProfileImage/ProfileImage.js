// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { baseColors } from 'utils/variables';

const CircleImage = styled.Image`
  width: ${props => (props.diameter ? props.diameter : '50')}px;
  height: ${props => (props.diameter ? props.diameter : '50')}px;
  border-radius: ${props => (props.diameter ? props.diameter / 2 : '25')}px;
  ${props => (props.additionalImageStyle)};
  align-items: center;
  justify-content: center;
`;

const ImageTouchable = styled.TouchableOpacity`
  width: ${props => (props.diameter ? props.diameter : '50')}px;
  height: ${props => (props.diameter ? props.diameter : '50')}px;
  border-radius: ${props => (props.diameter ? props.diameter / 2 : '25')}px;
  display: flex;
  background-color: ${props => (props.transparent ? 'transparent' : baseColors.cyan)};
  ${props => (props.additionalContainerStyle)};
  background: ${baseColors.lightGray};
  position: relative;
`;

const InnerBackground = styled.View`
  width: 100%;
  height: 100%;
  position: absolute;
  justify-content: center;
  align-items: center;
`;

type Props = {
  uri?: string,
  containerStyle?: Object,
  imageStyle?: Object,
  onPress?: Function,
  diameter?: number,
  style?: Object,
  children?: React.Node,
}

const ProfileImage = (props: Props) => {
  const {
    uri,
    containerStyle,
    imageStyle,
    onPress,
    style,
    diameter,
    children,
  } = props;


  return (
    <ImageTouchable
      additionalContainerStyle={containerStyle}
      diameter={diameter}
      disabled={!onPress}
      onPress={onPress}
      transparent={uri}
      style={style}
    >
      {children &&
        <InnerBackground>
          {children}
        </InnerBackground>
      }
      {!!uri && <CircleImage additionalImageStyle={imageStyle} diameter={diameter} source={{ uri }} />}
    </ImageTouchable>
  );
};

export default ProfileImage;
