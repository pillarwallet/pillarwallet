// @flow
import { Animated } from 'react-native';
import styled from 'styled-components/native';
import { Button, Icon } from 'native-base';
import { BaseText } from 'components/Typography';
import NotificationCircle from 'components/NotificationCircle';
import { baseColors, UIColors, fontSizes, spacing } from 'utils/variables';

export const ConnectionRequestBanner = styled.TouchableHighlight`
  height: 60px;
  padding-left: 30px;
  border-top-width: 1px;
  border-bottom-width: 1px;
  border-color: ${UIColors.defaultBorderColor};
  align-items: center;
  margin-bottom: 9px;
  flex-direction: row;
`;

export const HeaderWrapper = styled.View`
  z-index: 20;
  background: ${UIColors.defaultBackgroundColor};
`;

export const FullScreenOverlayWrapper = styled.TouchableOpacity`
  z-index: 10;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  position: absolute;
`;

const FullScreenOverlay = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,.6);
`;

export const AnimatedFullScreenOverlay = Animated.createAnimatedComponent(FullScreenOverlay);

export const ConnectionRequestBannerText = styled(BaseText)`
  font-size: ${fontSizes.medium};
`;

export const ConnectionRequestBannerIcon = styled(Icon)`
  font-size: ${fontSizes.medium};
  color: ${baseColors.darkGray};
  margin-left: auto;
  margin-right: ${spacing.rhythm}px;
`;

export const ConnectionRequestNotificationCircle = styled(NotificationCircle)`
  margin-left: 10px;
`;

export const EmptyStateBGWrapper = styled.View`
  flex-direction: row;
  justify-content: flex-start;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  padding: 0 20px 20px;
`;

export const ContactItem = styled.View`
  background-color: ${baseColors.lighterGray};
`;

export const ConnectionRowActions = styled.View`
  flex-direction: row;
`;

export const ConnectionActionButton = styled(Button)`
  flex: 1;
  flex-direction: column;
  height: 78px;
`;

export const ConnectionActionLabel = styled(BaseText)`
  color: ${baseColors.white};
  font-size: ${fontSizes.small};
`;
