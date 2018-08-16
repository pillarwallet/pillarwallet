// @flow
import * as React from 'react';
import { ImageBackground } from 'react-native';

import styled from 'styled-components/native';
import { CachedImage } from 'react-native-cached-image';
import { baseColors, fontSizes } from 'utils/variables';
import { getInitials } from 'utils/contacts';
import { BaseText } from 'components/Typography';

const CircleImage = styled(CachedImage)`
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

const DefaultPicture = (props: { userName?: string, innerComponent?: React.Node }) => {
  const { userName, innerComponent } = props;
  const initials = userName && getInitials(userName);

  return (
    <React.Fragment>
      {innerComponent &&
        <InnerBackground>
          {innerComponent}
        </InnerBackground>
      }
      {userName && !innerComponent &&
      <InnerBackground>
        <InnerUsername>
          {initials}
        </InnerUsername>
      </InnerBackground>
      }
    </React.Fragment>
  );
};

const CACHED_IMAGE_REF = 'cachedImage';
const IMAGE_LOAD_FAILED = 'image_load_failed';

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

  const renderDefaultImage = () => <DefaultPicture userName={userName} innerComponent={children} />;

  const renderImage = (data: Object) => {
    if (data.source === IMAGE_LOAD_FAILED) {
      return renderDefaultImage();
    }
    return <ImageBackground imageStyle={data.style} ref={CACHED_IMAGE_REF} {...data} />;
  };

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
      {!uri && renderDefaultImage()}
      {!!uri &&
        <CircleImage
          useQueryParamsInCacheKey
          additionalImageStyle={imageStyle}
          diameter={diameter}
          renderImage={renderImage}
          fallbackSource={IMAGE_LOAD_FAILED}
          source={{ uri }}
        />
      }
    </ImageTouchable>
  );
};

export default ProfileImage;
