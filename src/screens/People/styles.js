import styled from 'styled-components/native';
import { Icon } from 'native-base';
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
