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
import { Platform, View } from 'react-native';
import styled from 'styled-components/native';
import { CachedImage } from 'react-native-cached-image';
import isEqualWith from 'lodash.isequalwith';
import Icon from 'components/Icon';
import IconButton from 'components/IconButton';
import { BaseText, BoldText } from 'components/Typography';
import { baseColors, fontSizes, spacing, fontWeights, fontTrackings, lineHeights } from 'utils/variables';
import ProfileImage from 'components/ProfileImage';
import Button from 'components/Button';
import { Shadow } from 'components/Shadow';
import { Wrapper } from 'components/Layout';
import TankAssetBalance from 'components/TankAssetBalance';
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
  unreadCount?: number | string,
  itemValue?: ?string,
  itemStatusIcon?: string,
  valueColor?: ?string,
  buttonActionLabel?: string,
  labelAsButton?: boolean,
  buttonAction?: Function,
  secondaryButton?: boolean,
  actionLabel?: ?string,
  actionLabelColor?: ?string,
  rejectInvitation?: ?Function,
  acceptInvitation?: ?Function,
  type?: string,
  children?: React.Node,
  small?: boolean,
  imageAddonIconName?: string,
  imageAddonUrl?: string,
  imageAddonName?: string,
  imageUpdateTimeStamp?: number,
  rightColumnInnerStyle?: Object,
  customAddonFullWidth?: React.Node,
  customAddonAlignLeft?: boolean,
  imageColorFill?: string,
  customImage?: React.Node,
  imageDiameter?: number,
  balance?: Object,
  innerWrapperHorizontalAlign?: string,
  noImageBorder?: boolean,
  itemImageSource?: string,
  wrapperOpacity?: number,
}

const ItemWrapper = styled.View`
  flex-direction: column;
  width: 100%;
  ${({ wrapperOpacity }) => wrapperOpacity && `opacity: ${wrapperOpacity};`}
`;

const InnerWrapper = styled.TouchableOpacity`
  flex-direction: row;
  align-items: ${props => props.horizontalAlign || 'center'};
  justify-content: center;
  padding: ${spacing.small}px ${spacing.large}px;
  min-height: ${props => props.type === DEFAULT ? 70 : 84}px;
  width: 100%;
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
  align-items: ${props => props.horizontalAlign || 'center'};
  justify-content: space-between;
  width: 100%;
`;

const Column = styled.View`
  flex-direction: column;
  align-items: ${props => props.rightColumn ? 'flex-end' : 'flex-start'};
  justify-content: ${props => props.type === CHAT_ITEM ? 'flex-start' : 'center'};
  margin-top: ${props => props.type === CHAT_ITEM ? '-2px' : 0};
  ${props => props.rightColumn ? 'margin-left: 10px;' : 'flex: 1;'}
  min-height: 54px;
`;

const ItemTitle = styled(BoldText)`
  color: ${baseColors.slateBlack};
  font-size: ${fontSizes.medium}px;
  letter-spacing: ${fontTrackings.small}px;
  width: 100%;
`;

const ItemParagraph = styled(BaseText)`
  color: ${baseColors.darkGray};
  font-size: ${fontSizes.small}px;
  line-height: ${lineHeights.medium}px;
  letter-spacing: ${fontTrackings.tiny}px;
  margin-top: 4px;
  flex: 1;
`;

const ItemSubText = styled(BaseText)`
  color: ${baseColors.darkGray};
  font-size: 13px;
  line-height: ${fontSizes.medium}px;
  margin-top: 4px;
`;

const IconCircle = styled.View`
  width: ${props => props.diameter || 52}px;
  height: ${props => props.diameter || 52}px;
  border-radius: ${props => props.diameter ? props.diameter / 2 : 26}px;
  background-color: ${props => props.fillColor ? props.fillColor : 'transparent'};
  align-items: center;
  justify-content: center;
  text-align: center;
  ${props => props.bordered ? `border: 1px solid ${baseColors.white}` : ''};
`;

const ItemIcon = styled(Icon)`
  font-size: ${props => props.fontSize || 48}px;
  color: ${props => props.warm ? baseColors.tumbleweed : baseColors.offBlue};
`;

const TokenImageWrapper = styled.View`
  width: 54px;
  height: 54px;
  border-radius: 27px;
  ${props => props.noImageBorder ? '' : `border: 2px solid ${baseColors.white};`}
`;

const TokenImage = styled(CachedImage)`
  width: ${props => props.noImageBorder ? 54 : 50}px;
  height: ${props => props.noImageBorder ? 54 : 50}px;
  border-radius: ${props => props.noImageBorder ? 27 : 25}px;
`;

const TimeWrapper = styled.View`
  align-items: flex-start;
  margin-top: ${Platform.OS === 'ios' ? 6 : 4}px;
`;

const TimeSent = styled(BaseText)`
  color: ${baseColors.darkGray}
  font-size: ${fontSizes.small}px;
  line-height: ${fontSizes.medium}px;
  text-align-vertical: bottom;
`;

const ItemBadge = styled.View`
  height: 20px;
  width: 20px;
  border-radius: 10px;
  background-color: ${baseColors.pinkishGrey}
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
  font-size: ${fontSizes.big}px;
  color: ${props => props.color ? props.color : baseColors.slateBlack};
  text-align: right;
`;

const ItemValueBold = styled(BoldText)`
  font-size: ${fontSizes.big}px;
  color: ${props => props.color ? props.color : baseColors.slateBlack};
  text-align: right;
`;

const ItemValueStatus = styled(Icon)`
  margin-left: 7px;
  color: ${baseColors.mediumGray};
  font-size: ${fontSizes.big}px;
`;

const IndicatorsRow = styled.View`
  flex-direction: row;
  padding-left: 8px;
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
  font-size: ${fontSizes.medium}px;
  color: ${props => props.color ? props.color : baseColors.darkGray};
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

const ImageAddonHolder = styled.View`
  position: absolute;
  top: 0;
  right: 10px;
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
    imageColorFill,
    customImage,
    imageDiameter,
    itemImageSource,
    noImageBorder,
  } = props;

  if (iconName) {
    const warm = iconName === 'sent';
    return (
      <IconCircle fillColor={warm ? baseColors.fairPink : baseColors.lightGray}>
        <ItemIcon name={iconName} warm={warm} />
      </IconCircle>
    );
  }
  if (customImage) {
    const shadowDiameter = imageDiameter || 54;
    return (
      <Shadow
        shadowColorAndroid="#38105baa"
        heightAndroid={shadowDiameter}
        widthAndroid={shadowDiameter}
        heightIOS={shadowDiameter}
        widthIOS={shadowDiameter}
        shadowRadius={shadowDiameter / 2}
        useSVGShadow
      >
        {customImage}
      </Shadow>
    );
  }
  if (itemImageUrl) {
    return (
      <Shadow
        shadowColorAndroid="#38105baa"
        heightAndroid={54}
        widthAndroid={54}
        heightIOS={54}
        widthIOS={54}
        shadowRadius={24}
      >
        <TokenImageWrapper noImageBorder={noImageBorder}>
          <TokenImage noImageBorder={noImageBorder} source={{ uri: itemImageUrl }} fallbackSource={fallbackSource} />
        </TokenImageWrapper>
      </Shadow>
    );
  }

  if (itemImageSource) {
    return (
      <TokenImageWrapper noImageBorder={noImageBorder}>
        <TokenImage noImageBorder={noImageBorder} source={itemImageSource} fallbackSource={fallbackSource} />
      </TokenImageWrapper>
    );
  }

  if (imageColorFill) {
    return (
      <Shadow
        shadowColorAndroid="#38105baa"
        heightAndroid={54}
        widthAndroid={54}
        heightIOS={48}
        widthIOS={48}
        shadowRadius={24}
      >
        <IconCircle fillColor={imageColorFill} />
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
      textStyle={{ fontSize: fontSizes.big }}
      noShadow={type === ACTION}
    />
  );
};

const ImageAddon = (props: Props) => {
  const {
    imageAddonIconName,
    imageAddonUrl,
    imageAddonName,
  } = props;

  if (imageAddonIconName) {
    const warm = imageAddonIconName === 'sent';
    return (
      <ImageAddonHolder>
        <IconCircle fillColor={warm ? baseColors.fairPink : baseColors.lightGray} diameter={22} bordered>
          <ItemIcon
            name={imageAddonIconName}
            warm={warm}
            fontSize={fontSizes.large}
            style={{ position: 'absolute', top: -5, right: 4 }}
          />
        </IconCircle>
      </ImageAddonHolder>
    );
  }

  return (
    <ImageAddonHolder>
      <ProfileImage
        onPress={() => {}}
        uri={imageAddonUrl}
        userName={imageAddonName}
        diameter={22}
        borderWidth={2}
        noShadow
        initialsSize={fontSizes.extraSmall}
      />
    </ImageAddonHolder>
  );
};

const Addon = (props: Props) => {
  const {
    unreadCount,
    itemValue,
    itemStatusIcon,
    valueColor,
    buttonActionLabel,
    labelAsButton,
    buttonAction,
    secondaryButton,
    actionLabel,
    actionLabelColor,
    rejectInvitation,
    acceptInvitation,
    balance,
  } = props;
  if (itemValue || itemStatusIcon) {
    return (
      <Wrapper horizontal style={{ flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end' }}>
        {!!itemValue &&
          <ItemValue color={valueColor} numberOfLines={2} ellipsizeMode="tail">
            {itemValue}
          </ItemValue>
        }
        {!!itemStatusIcon && <ItemValueStatus name={itemStatusIcon} />}
      </Wrapper>
    );
  }

  if (actionLabel) {
    return (
      <ActionLabel button={labelAsButton}>
        <ActionLabelText button={labelAsButton} color={labelAsButton ? baseColors.electricBlue : actionLabelColor}>
          {actionLabel}
        </ActionLabelText>
      </ActionLabel>
    );
  }

  if (unreadCount) {
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
          fontSize={fontSizes.small}
          onPress={rejectInvitation}
        />
        <ActionCircleButton
          color={baseColors.white}
          margin={0}
          accept
          icon="check"
          fontSize={fontSizes.small}
          onPress={acceptInvitation}
        />
      </ButtonIconWrapper>
    );
  }

  if (balance) {
    const {
      syntheticBalance = '',
      balance: tokenBalance = '',
      token = '',
      value = '',
    } = balance;
    return (
      <Wrapper style={{ alignItems: 'flex-end' }}>
        {!!tokenBalance.toString() && <ItemValueBold>{`${tokenBalance} ${token}`}</ItemValueBold>}
        {!!syntheticBalance.toString() &&
        <TankAssetBalance
          monoColor
          amount={syntheticBalance}
          token={token}
        />}
        <ItemSubText style={{ marginTop: -2 }}>{value}</ItemSubText>
      </Wrapper>
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
      children,
      imageAddonUrl,
      imageAddonIconName,
      imageAddonName,
      rightColumnInnerStyle,
      customAddonFullWidth,
      innerWrapperHorizontalAlign,
      wrapperOpacity,
      customAddonAlignLeft,
    } = this.props;

    const type = getType(this.props);
    return (
      <ItemWrapper wrapperOpacity={wrapperOpacity}>
        <InnerWrapper type={type} onPress={onPress} disabled={!onPress} horizontalAlign={innerWrapperHorizontalAlign}>
          <ImageWrapper>
            <ItemImage {...this.props} type={type} />
            {(imageAddonUrl || imageAddonIconName || imageAddonName) && <ImageAddon {...this.props} />}
          </ImageWrapper>
          <View style={{ flex: 1 }}>
            <InfoWrapper type={type} horizontalAlign={innerWrapperHorizontalAlign}>
              <Column type={type} style={{ flexGrow: 1 }}>
                {!!label &&
                <Row>
                  <ItemTitle numberOfLines={2} ellipsizeMode="tail" type={type}>{label}</ItemTitle>
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
                </Row>
                }
                {!!subtext &&
                <ItemSubText numberOfLines={1}>{subtext}</ItemSubText>
                }
              </Column>
              <Column rightColumn type={type} style={{ maxWidth: '50%' }}>
                <View style={[rightColumnInnerStyle, { flexWrap: 'wrap' }]}>
                  {!!customAddonAlignLeft && customAddon}
                  <Addon {...this.props} type={type} />
                  {!customAddonAlignLeft && customAddon}
                  {children}
                </View>
              </Column>
            </InfoWrapper>
          </View>
        </InnerWrapper>
        {customAddonFullWidth}
      </ItemWrapper>
    );
  }
}

export default ListItemWithImage;
