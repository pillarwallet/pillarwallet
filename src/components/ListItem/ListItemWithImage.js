// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
import * as React from 'react';
import { Platform } from 'react-native';
import styled from 'styled-components/native';
import { CachedImage } from 'react-native-cached-image';
import isEqualWith from 'lodash.isequalwith';
import Icon from 'components/Icon';
import IconButton from 'components/IconButton';
import { BaseText, BoldText } from 'components/Typography';
import { baseColors, fontSizes, spacing, fontWeights, fontTrackings } from 'utils/variables';
import ProfileImage from 'components/ProfileImage';
import Button from 'components/Button';
import { Shadow } from 'components/Shadow';
import { Wrapper } from 'components/Layout';
import { ACTION, CHAT_ITEM, DEFAULT } from 'constants/listItemConstants';

type Props = {
  label: string,
  navigateToProfile?: ?Function,
  subtext?: string,
  paragraph?: string,
  paragraphLines?: string,
  customAddon?: React.Node,
  onPress?: Function,
  avatarUrl?: string,
  iconName?: ?string,
  itemImageUrl?: string,
  fallbackSource?: string,
  timeSent?: string,
  unreadCount?: number,
  itemValue?: string,
  itemStatusIcon?: string,
  valueColor?: ?string,
  buttonActionLabel?: string,
  labelAsButton?: boolean,
  buttonAction?: Function,
  secondaryButton?: boolean,
  actionLabel?: ?string,
  rejectInvitation?: ?Function,
  acceptInvitation?: ?Function,
  type?: string,
  children?: React.Node,
  small?: boolean,
  imageUpdateTimeStamp?: number,
}

const ItemWrapper = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: ${spacing.small}px ${spacing.mediumLarge}px;
  height: ${props => props.type === DEFAULT ? 70 : 84}px;
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
  flex-direction: column;
  align-items: ${props => props.rightColumn ? 'flex-end' : 'flex-start'};
  justify-content: ${props => props.type === CHAT_ITEM ? 'flex-start' : 'center'};
  margin-top: ${props => props.type === CHAT_ITEM ? '-2px' : 0};
  ${props => props.rightColumn ? 'padding-left: 10px;' : 'flex: 1;'}
`;

const ItemTitle = styled(BoldText)`
  color: ${baseColors.slateBlack};
  font-size: ${fontSizes.small}px;
  letter-spacing: ${fontTrackings.small}px;
  width: 100%;
  flex: 1;
`;

const ItemParagraph = styled(BaseText)`
  color: ${baseColors.darkGray};
  font-size: ${fontSizes.small}px;
  line-height: ${fontSizes.mediumLarge}px;
  letter-spacing: ${fontTrackings.tiny}px;
  margin-top: 2px;
  flex: 1;
`;

const ItemSubText = styled(BaseText)`
  color: ${baseColors.darkGray};
  font-size: 13px;
  line-height: ${fontSizes.small}
  margin-top: 4px;
`;

const IconCircle = styled.View`
  width: 52px;
  height: 52px;
  border-radius: 26px;
  background-color: ${props => props.warm ? baseColors.fairPink : baseColors.lightGray};
  align-items: center;
  justify-content: center;
`;

const ItemIcon = styled(Icon)`
  font-size: ${fontSizes.extraGiant};
  color: ${props => props.warm ? baseColors.tumbleweed : baseColors.offBlue};
`;

const TokenImageWrapper = styled.View`
  width: 54px;
  height: 54px;
  border-radius: 27px;
  border: 2px solid ${baseColors.white};
`;

const TokenImage = styled(CachedImage)`
  width: 50px;
  height: 50px;
  border-radius: 25px;
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

const ItemValueStatus = styled(Icon)`
  margin-left: 7px;
  color: ${baseColors.mediumGray};
  font-size: ${fontSizes.medium};
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
    fallbackSource,
    navigateToProfile,
    type,
    imageUpdateTimeStamp,
  } = props;

  if (iconName) {
    const warm = iconName === 'sent';
    return (
      <IconCircle warm={warm}>
        <ItemIcon name={iconName} warm={warm} />
      </IconCircle>
    );
  }
  if (itemImageUrl) {
    return (
      <Shadow
        shadowColorAndroid="#38105baa"
        heightAndroid={54}
        widthAndroid={54}
        heightIOS={48}
        widthIOS={48}
        shadowRadius={24}
      >
        <TokenImageWrapper>
          <TokenImage source={{ uri: itemImageUrl }} fallbackSource={fallbackSource} />
        </TokenImageWrapper>
      </Shadow>
    );
  }

  const updatedUserImageUrl = imageUpdateTimeStamp && avatarUrl ? `${avatarUrl}?t=${imageUpdateTimeStamp}` : avatarUrl;

  return (
    <ProfileImage
      onPress={navigateToProfile}
      uri={updatedUserImageUrl}
      userName={label}
      diameter={type === ACTION ? 52 : 50}
      borderWidth={type === ACTION ? 0 : 2}
      textStyle={{ fontSize: fontSizes.medium }}
      noShadow={type === ACTION}
    />
  );
};

const Addon = (props: Props) => {
  const {
    type,
    unreadCount,
    itemValue,
    itemStatusIcon,
    valueColor,
    buttonActionLabel,
    labelAsButton,
    buttonAction,
    secondaryButton,
    actionLabel,
    rejectInvitation,
    acceptInvitation,
  } = props;

  if (itemValue) {
    return (
      <Wrapper horizontal center>
        <ItemValue color={valueColor}>
          {itemValue}
        </ItemValue>
        {!!itemStatusIcon &&
          <ItemValueStatus name={itemStatusIcon} />
        }
      </Wrapper>
    );
  }

  if (actionLabel) {
    return (
      <ActionLabel button={labelAsButton}>
        <ActionLabelText button={labelAsButton}>
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
        listItemButton
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
  if ((props.subtext && !props.small) || props.iconName) {
    return ACTION;
  }
  if (props.paragraph) {
    return CHAT_ITEM;
  }
  return DEFAULT;
};

class ListItemWithImage extends React.Component<Props, {}> {
  shouldComponentUpdate(nextProps: Props) {
    const isEq = isEqualWith(this.props, nextProps, (val1, val2) => {
      if (typeof val1 === 'function' && typeof val2 === 'function') return true;
      return undefined;
    });
    return !isEq;
  }

  render() {
    const {
      label,
      subtext,
      paragraph,
      paragraphLines = 2,
      customAddon,
      onPress,
      timeSent,
      unreadCount,
      children,
    } = this.props;

    const type = getType(this.props);
    return (
      <ItemWrapper
        type={type}
        onPress={onPress}
        disabled={!onPress}
      >
        <ImageWrapper>
          <ItemImage {...this.props} type={type} />
        </ImageWrapper>
        <InfoWrapper type={type}>
          <Column type={type}>
            {!!label &&
              <Row>
                <ItemTitle type={type}>{label}</ItemTitle>
                {(type === CHAT_ITEM && !!timeSent) &&
                  <TimeWrapper>
                    <TimeSent>{timeSent}</TimeSent>
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
            <Addon {...this.props} type={type} />
            {customAddon}
            {children}
          </Column>
        </InfoWrapper>
      </ItemWrapper>
    );
  }
}

export default ListItemWithImage;
