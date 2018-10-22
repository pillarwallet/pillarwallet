// @flow
import * as React from 'react';
import { Platform } from 'react-native';
import styled from 'styled-components/native';
import { CachedImage } from 'react-native-cached-image';
import { baseColors, fontSizes, spacing, fontWeights } from 'utils/variables';
import { BaseText } from 'components/Typography';
import ProfileImage from 'components/ProfileImage';
import Icon from 'components/Icon';
import IconButton from 'components/IconButton';
import Button from 'components/Button';

type Props = {
  label: string,
  navigateToProfile?: Function,
  subtext?: string,
  paragraph?: string,
  paragraphLines?: string,
  customAddon?: React.Node,
  onPress?: Function,
  avatarUrl?: string,
  iconName?: string,
  itemImageUrl?: string,
  timeSent?: string,
  unreadCount?: number,
  itemValue?: string,
  valueColor?: string,
  buttonActionLabel?: string,
  buttonAction?: Function,
  secondaryButton?: boolean,
  actionLabel?: string,
  rejectInvitation?: Function,
  acceptInvitation?: Function,
  type?: string,
}

const ACTION = 'ACTION';
const CHAT_ITEM = 'CHAT_ITEM';
const DEFAULT = 'DEFAULT';

const ItemWrapper = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  padding: ${spacing.small}px ${spacing.mediumLarge}px;
  height: ${props => props.type !== DEFAULT ? 84 : 70}px;
`;

const Row = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const ImageWrapper = styled.View`
  padding-right: ${spacing.medium}px;
  justify-content: center;
  align-items: center;
  width: 66px;
  height: 54px;
`;

const InfoWrapper = styled.View`
  flex-direction: row;
  align-items: ${props => props.type === CHAT_ITEM ? 'flex-start' : 'center'};
  justify-content: space-between;
  flex: 1;
`;

const Column = styled.View`
  padding-top: ${props => props.type === CHAT_ITEM ? `${spacing.small}px` : 0};
  flex-direction: column;
  align-items: ${props => props.rightColumn ? 'flex-end' : 'flex-start'};
  justify-content: ${props => props.type === CHAT_ITEM ? 'flex-start' : 'center'};
  ${props => props.rightColumn ? '' : 'flex: 1'}
`;

const ItemTitle = styled(BaseText)`
  color: ${baseColors.slateBlack};
  font-size: ${fontSizes.medium};
  letter-spacing: 0.2px;
  width: 100%;
  font-weight: ${props => props.type === ACTION ? fontWeights.book : fontWeights.bold};
  flex: 1;
`;

const ItemParagraph = styled.Text`
  color: ${baseColors.darkGray};
  font-size: ${fontSizes.small};
  line-height: ${fontSizes.medium + 2};
  letter-spacing: 0.1px;
  margin-top: 2px;
  flex: 1;
`;

const ItemSubText = styled.Text`
  color: ${baseColors.darkGray};
  font-size: ${fontSizes.extraExtraSmall};
  line-height: ${fontSizes.small}
`;

const IconCircle = styled.View`
  width: 54px;
  height: 54px;
  border-radius: 27px;
  background-color: ${baseColors.lightGray};
  align-items: center;
  justify-content: center;
`;

const ItemIcon = styled(Icon)`
  color: ${baseColors.offBlue};
  font-size: ${fontSizes.extraGiant};
`;

const TokenImage = styled(CachedImage)`
  width: 54px;
  height: 54px;
  border-radius: 27px;
`;

const TimeWrapper = styled.View`
  align-items: flex-start;
  margin-top: ${Platform.OS === 'ios' ? 6 : 4}px;
`;

const TimeSent = styled(BaseText)`
  color: ${baseColors.darkGray}
  font-size: ${fontSizes.extraSmall};
  line-height: ${fontSizes.small};
  text-align-vertical: bottom;
`;

const BadgePlacer = styled.View`
  width: 30px;
`;

const ItemBadge = styled.View`
  height: 20px;
  width: 20px;
  border-radius: 10px;
  background-color: ${baseColors.darkGray}
  align-self: flex-end;
  padding: 3px 0;
  margin-top: 2px;
  margin-right: 1px;
`;

const UnreadNumber = styled(BaseText)`
  color: #ffffff;
  font-size: 10px;
  align-self: center;
  width: 20px;
  text-align: center;
`;

const ItemValue = styled(BaseText)`
  font-size: ${fontSizes.medium};
  color: ${props => props.color ? props.color : baseColors.slateBlack};
  text-align: right;
`;

const IndicatorsRow = styled.View`
  flex-direction: row;
`;

const ActionLabel = styled.View`
  align-items: center;
  justify-content: center;
  ${props => props.button ? `border: 1px solid ${baseColors.veryLightBlue}` : ''}
  ${props => props.button ? 'border-radius: 40px;' : ''}
  ${props => props.button ? 'height: 34px;' : ''}
  ${props => props.button ? `font-weight: ${fontWeights.medium};` : ''}
`;

const ActionLabelText = styled(BaseText)`
  font-size: ${fontSizes.small}px;
  color: ${props => props.button ? baseColors.electricBlue : baseColors.darkGray};
  margin-left: auto;
  margin-bottom: ${props => props.button ? '2px' : 0};
  padding: ${props => props.button ? `0 ${spacing.large}px` : '6px 0'};
`;

const ButtonIconWrapper = styled.View`
  margin-left: auto;
  flex-direction: row;
`;

const ActionCircleButton = styled(IconButton)`
  height: 34px;
  width: 34px;
  border-radius: 17px;
  padding: ${Platform.OS === 'ios' ? 0 : 8}px;
  margin: 0 0 0 10px;
  justify-content: center;
  align-items: center;
  background: ${props => props.accept ? baseColors.electricBlue : 'rgba(0,0,0,0)'};
`;

const ItemImage = (props: Props) => {
  const {
    label,
    avatarUrl,
    iconName,
    itemImageUrl,
    navigateToProfile,
  } = props;

  if (iconName) {
    return (
      <IconCircle>
        <ItemIcon name={iconName} />
      </IconCircle>
    );
  }
  if (itemImageUrl) {
    return (
      <TokenImage source={{ uri: itemImageUrl }} />
    );
  }
  return (
    <ProfileImage
      onPress={navigateToProfile}
      uri={avatarUrl}
      userName={label}
      diameter={50}
      textStyle={{ fontSize: fontSizes.medium }}
    />
  );
};

const Addon = (props: Props) => {
  const {
    type,
    unreadCount,
    itemValue,
    valueColor,
    buttonActionLabel,
    buttonAction,
    secondaryButton,
    actionLabel,
    rejectInvitation,
    acceptInvitation,
  } = props;

  if (itemValue) {
    return (
      <ItemValue color={valueColor}>
        {itemValue}
      </ItemValue>
    );
  }

  if (actionLabel) {
    return (
      <ActionLabel button>
        <ActionLabelText button>
          {actionLabel}
        </ActionLabelText>
      </ActionLabel>
    );
  }

  if (type !== CHAT_ITEM && unreadCount) {
    return (
      <IndicatorsRow>
        <ItemBadge>
          <UnreadNumber>
            {unreadCount}
          </UnreadNumber>
        </ItemBadge>
      </IndicatorsRow>
    );
  }

  if (buttonActionLabel) {
    return (
      <Button
        title={buttonActionLabel}
        onPress={buttonAction}
        small
        primaryInverted={secondaryButton}
      />
    );
  }

  if (rejectInvitation && acceptInvitation) {
    return (
      <ButtonIconWrapper>
        <ActionCircleButton
          color={baseColors.darkGray}
          margin={0}
          icon="close"
          fontSize={fontSizes.extraSmall}
          onPress={rejectInvitation}
        />
        <ActionCircleButton
          color={baseColors.white}
          margin={0}
          accept
          icon="check"
          fontSize={fontSizes.extraSmall}
          onPress={acceptInvitation}
        />
      </ButtonIconWrapper>
    );
  }

  return null;
};

const getType = (props: Props) => {
  if (props.subtext || props.iconName) {
    return ACTION;
  }
  if (props.paragraph) {
    return CHAT_ITEM;
  }
  return DEFAULT;
};

const ListItemWithImage = (props: Props) => {
  const {
    label,
    subtext,
    paragraph,
    paragraphLines = 2,
    customAddon,
    onPress,
    timeSent,
    unreadCount,
  } = props;

  const type = getType(props);

  return (
    <ItemWrapper type={type} onPress={onPress} disabled={!onPress}>
      <ImageWrapper>
        <ItemImage {...props} />
      </ImageWrapper>
      <InfoWrapper type={type}>
        <Column type={type}>
          {!!label &&
            <Row>
              <ItemTitle type={type}>{label}</ItemTitle>
              {(type === CHAT_ITEM) && timeSent &&
                <TimeWrapper>
                  {!!timeSent &&
                  <TimeSent>
                    {timeSent}
                  </TimeSent>}
                </TimeWrapper>
              }
            </Row>
          }
          {!!paragraph &&
            <Row>
              <ItemParagraph numberOfLines={paragraphLines}>{paragraph}</ItemParagraph>
              {type === CHAT_ITEM &&
                <BadgePlacer>
                  {!!unreadCount &&
                  <ItemBadge>
                    <UnreadNumber>
                      {unreadCount}
                    </UnreadNumber>
                  </ItemBadge>
                  }
                </BadgePlacer>
              }
            </Row>
          }
          {!!subtext &&
            <ItemSubText numberOfLines={1}>{subtext}</ItemSubText>
          }
        </Column>
        <Column rightColumn type={type}>
          <Addon {...props} type={type} />
          {customAddon}
        </Column>
      </InfoWrapper>
    </ItemWrapper>
  );
};

export default ListItemWithImage;
