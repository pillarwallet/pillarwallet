// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { baseColors, fontSizes } from 'utils/variables';
import { BaseText } from 'components/Typography';

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
  background-color: ${props => (props.hasChildren ? baseColors.lightGray : baseColors.cyan)};
  ${props => (props.additionalContainerStyle)};
  position: relative;
`;

const InnerBackground = styled.View`
  width: 100%;
  height: 100%;
  position: absolute;
  justify-content: center;
  align-items: center;
`;


const InnerUsername = styled(BaseText)`
  font-size: ${fontSizes.medium};
  color: ${baseColors.white};
`;

type Props = {
  uri?: string,
  userName?: string,
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
    userName,
  } = props;

  const initials = userName && userName
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
      hasChildren={children}
    >
      {children &&
        <InnerBackground>
          {children}
        </InnerBackground>
      }
      {userName && !children &&
        <InnerBackground>
          <InnerUsername>
            {initials}
          </InnerUsername>
        </InnerBackground>
      }
      {!!uri && <CircleImage additionalImageStyle={imageStyle} diameter={diameter} source={{ uri }} />}
    </ImageTouchable>
  );
};

export default ProfileImage;
