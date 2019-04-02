// @flow

import styled from 'styled-components/native';
import { fontSizes, baseColors } from 'utils/variables';
import { BaseText } from 'components/Typography';

export const MainContainer = styled.View`
  background-color: ${baseColors.lightGray};
  height: 100%;
`;

export const OpenSessions = styled.View`
  border-bottom-width: 1px;
  border-bottom-color: ${baseColors.mediumLightGray};
  background-color: ${baseColors.snowWhite};
  padding: 22px 16px 33px;
  height: 215px;
  justify-content: space-between;
`;

export const SessionsInfo = styled.View``;

export const TerminateSessions = styled.View`
  align-self: flex-end;
`;

export const HistorySession = styled.View`
  background-color: ${baseColors.lightGray};
  height: 100%;
  padding: 22px 16px 33px;
`;

export const SessionsTitle = styled(BaseText)`
  color: ${baseColors.coolGrey};
  font-size: ${fontSizes.extraExtraSmall};
`;

export const SessionDetail = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin: 10px 0;
`;

export const SessionDevice = styled(BaseText)`
  color: ${baseColors.slateBlack};
  font-size: ${fontSizes.small};
  width: 145px;
`;

export const SessionDate = styled(BaseText)`
  color: ${baseColors.coolGrey};
  font-size: ${fontSizes.extraSmall};
  margin: 0 8px;
`;
