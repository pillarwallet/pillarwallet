// @flow
import { Platform } from 'react-native';
import styled from 'styled-components/native';
import { CachedImage } from 'react-native-cached-image';
import Icon from 'components/Icon';
import IconButton from 'components/IconButton';
import { BaseText, BoldText } from 'components/Typography';
import { baseColors, fontSizes, spacing, fontWeights, fontTrackings } from 'utils/variables';

import { CHAT_ITEM, DEFAULT } from './constants';

export const ItemWrapper = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: ${spacing.small}px ${spacing.mediumLarge}px;
  height: ${props => props.type === DEFAULT ? 70 : 84}px;
`;

export const Row = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

export const ImageWrapper = styled.View`
  padding-right: ${spacing.medium}px;
  justify-content: center;
  align-items: center;
  width: 66px;
  height: 54px;
`;

export const InfoWrapper = styled.View`
  flex-direction: row;
  align-items: ${props => props.type === CHAT_ITEM ? 'flex-start' : 'center'};
  justify-content: space-between;
  flex: 1;
`;

export const Column = styled.View`
  flex-direction: column;
  align-items: ${props => props.rightColumn ? 'flex-end' : 'flex-start'};
  justify-content: ${props => props.type === CHAT_ITEM ? 'flex-start' : 'center'};
  margin-top: ${props => props.type === CHAT_ITEM ? '-2px' : 0};
  ${props => props.rightColumn ? '' : 'flex: 1'}
`;

export const ItemTitle = styled(BoldText)`
  color: ${baseColors.slateBlack};
  font-size: ${fontSizes.small}px;
  letter-spacing: ${fontTrackings.small}px;
  width: 100%;
  flex: 1;
`;

export const ItemParagraph = styled.Text`
  color: ${baseColors.darkGray};
  font-size: ${fontSizes.small}px;
  line-height: ${fontSizes.mediumLarge}px;
  letter-spacing: ${fontTrackings.tiny}px;
  margin-top: 2px;
  flex: 1;
`;

export const ItemSubText = styled.Text`
  color: ${baseColors.darkGray};
  font-size: 13px;
  line-height: ${fontSizes.small}
  margin-top: 4px;
`;

export const IconCircle = styled.View`
  width: 52px;
  height: 52px;
  border-radius: 26px;
  background-color: ${props => props.warm ? baseColors.fairPink : baseColors.lightGray};
  align-items: center;
  justify-content: center;
`;

export const ItemIcon = styled(Icon)`
  font-size: ${fontSizes.extraGiant};
  color: ${props => props.warm ? baseColors.tumbleweed : baseColors.offBlue};
`;

export const TokenImageWrapper = styled.View`
  width: 54px;
  height: 54px;
  border-radius: 27px;
  border: 2px solid ${baseColors.white};
`;

export const TokenImage = styled(CachedImage)`
  width: 50px;
  height: 50px;
  border-radius: 25px;
`;

export const TimeWrapper = styled.View`
  align-items: flex-start;
  margin-top: ${Platform.OS === 'ios' ? 6 : 4}px;
`;

export const TimeSent = styled(BaseText)`
  color: ${baseColors.darkGray}
  font-size: ${fontSizes.extraSmall};
  line-height: ${fontSizes.small};
  text-align-vertical: bottom;
`;

export const BadgePlacer = styled.View`
  width: 30px;
`;

export const ItemBadge = styled.View`
  height: 20px;
  width: 20px;
  border-radius: 10px;
  background-color: ${baseColors.darkGray}
  align-self: flex-end;
  padding: 3px 0;
  margin-top: 2px;
  margin-right: 1px;
`;

export const UnreadNumber = styled(BaseText)`
  color: #ffffff;
  font-size: 10px;
  align-self: center;
  width: 20px;
  text-align: center;
`;

export const ItemValue = styled(BaseText)`
  font-size: ${fontSizes.medium};
  color: ${props => props.color ? props.color : baseColors.slateBlack};
  text-align: right;
`;

export const ItemValueStatus = styled(Icon)`
  margin-left: 7px;
  color: ${baseColors.mediumGray};
  font-size: ${fontSizes.medium};
`;

export const IndicatorsRow = styled.View`
  flex-direction: row;
`;

export const ActionLabel = styled.View`
  align-items: center;
  justify-content: center;
  ${props => props.button ? `border: 1px solid ${baseColors.veryLightBlue}` : ''}
  ${props => props.button ? 'border-radius: 40px;' : ''}
  ${props => props.button ? 'height: 34px;' : ''}
  ${props => props.button ? `font-weight: ${fontWeights.medium};` : ''}
`;

export const ActionLabelText = styled(BaseText)`
  font-size: ${fontSizes.small}px;
  color: ${props => props.button ? baseColors.electricBlue : baseColors.darkGray};
  margin-left: auto;
  margin-bottom: ${props => props.button ? '2px' : 0};
  padding: ${props => props.button ? `0 ${spacing.large}px` : '6px 0'};
`;

export const ButtonIconWrapper = styled.View`
  margin-left: auto;
  flex-direction: row;
`;

export const ActionCircleButton = styled(IconButton)`
  height: 34px;
  width: 34px;
  border-radius: 17px;
  padding: ${Platform.OS === 'ios' ? 0 : 8}px;
  margin: 0 0 0 10px;
  justify-content: center;
  align-items: center;
  background: ${props => props.accept ? baseColors.electricBlue : 'rgba(0,0,0,0)'};
`;
