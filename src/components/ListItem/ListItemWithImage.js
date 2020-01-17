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
import styled, { withTheme } from 'styled-components/native';
import { CachedImage } from 'react-native-cached-image';
import isEqualWith from 'lodash.isequalwith';
import Icon from 'components/Icon';

import IconButton from 'components/IconButton';
import { BaseText, MediumText } from 'components/Typography';
import ProfileImage from 'components/ProfileImage';
import Button from 'components/Button';
import { Shadow } from 'components/Shadow';
import { Wrapper } from 'components/Layout';
import TankAssetBalance from 'components/TankAssetBalance';

import { ACTION, CHAT_ITEM, DEFAULT } from 'constants/listItemConstants';

import { fontSizes, spacing, fontTrackings, fontStyles } from 'utils/variables';
import { getThemeColors, themedColors } from 'utils/themes';

import type { Theme, ThemeColors } from 'models/Theme';


type Props = {
  label: string,
  navigateToProfile?: ?Function,
  subtext?: string,
  paragraph?: string,
  paragraphLines?: string,
  customAddon?: React.Node,
  onPress?: ?Function,
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
  customImage?: React.Node,
  imageDiameter?: number,
  balance?: Object,
  innerWrapperHorizontalAlign?: string,
  itemImageSource?: string,
  wrapperOpacity?: number,
  diameter?: number,
  iconColor?: string,
  hasShadow?: boolean,
  iconSource?: string,
  imageWrapperStyle?: Object,
  theme: Theme,
}

type AddonProps = {
  unreadCount?: number | string,
  itemValue?: ?string,
  itemStatusIcon?: string,
  valueColor?: ?string,
  buttonActionLabel?: string,
  labelAsButton?: boolean,
  buttonAction?: () => void,
  secondaryButton?: boolean,
  actionLabel?: ?string,
  actionLabelColor?: ?string,
  rejectInvitation?: ?() => void,
  acceptInvitation?: ?() => void,
  balance?: Object,
  colors: ThemeColors,
}

type ImageWrapperProps = {
  children: React.Node,
  hasShadow?: boolean,
  imageDiameter?: number,
  imageWrapperStyle?: Object,
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
  padding: ${spacing.small}px ${spacing.layoutSides}px;
  width: 100%;
`;

const Row = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const ImageHolder = styled.View`
  padding-right: ${spacing.medium}px;
  justify-content: center;
  align-items: center;
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

const ItemTitle = styled(MediumText)`
  color: ${themedColors.text};
  font-size: ${fontSizes.medium}px;
  line-height: 22px;
  letter-spacing: ${fontTrackings.small}px;
  width: 100%;
`;

const ItemParagraph = styled(BaseText)`
  color: ${themedColors.secondaryText};
  ${fontStyles.regular};
  letter-spacing: ${fontTrackings.tiny}px;
  flex: 1;
`;

const ItemSubText = styled(BaseText)`
  color: ${themedColors.secondaryText};
  font-size: ${fontSizes.regular}px;
  line-height: 18px;
`;

const IconCircle = styled.View`
  width: ${props => props.diameter || 52}px;
  height: ${props => props.diameter || 52}px;
  border-radius: ${props => props.diameter ? props.diameter / 2 : 26}px;
  background-color: ${themedColors.card};
  align-items: center;
  justify-content: center;
  text-align: center;
  border: 1px solid ${themedColors.border};
`;

const ItemIcon = styled(Icon)`
  font-size: ${props => props.fontSize || 48}px;
  color: ${({ iconColor, theme }) => iconColor || theme.colors.primary};
`;

const IconImage = styled(CachedImage)`
  width: 24px;
  height: 24px;
`;

const TokenImage = styled(CachedImage)`
  width: ${props => props.diameter || 54}px;
  height: ${props => props.diameter || 54}px;
  border-radius: ${props => props.diameter / 2 || 27}px;
`;

const TimeWrapper = styled.View`
  align-items: flex-start;
  margin-top: ${Platform.OS === 'ios' ? 6 : 4}px;
`;

const TimeSent = styled(BaseText)`
  color: ${themedColors.secondaryText};
  ${fontStyles.regular};
  text-align-vertical: bottom;
`;

const ItemBadge = styled.View`
  height: 20px;
  width: 20px;
  border-radius: 10px;
  background-color: ${themedColors.secondaryText}
  align-self: flex-end;
  padding: 3px 0;
  margin-right: 1px;
`;

const UnreadNumber = styled(BaseText)`
  color: ${themedColors.control};
  font-size: ${fontSizes.tiny}px;
  align-self: center;
  width: 20px;
  text-align: center;
`;

const ItemValue = styled(BaseText)`
  ${fontStyles.big};
  color: ${({ color, theme }) => color || theme.colors.text};
  text-align: right;
`;

const ItemValueBold = styled(MediumText)`
  ${fontStyles.big};
  color: ${({ color, theme }) => color || theme.colors.text};
  text-align: right;
`;

const ItemValueStatus = styled(Icon)`
  margin-left: 7px;
  color: ${themedColors.secondaryText};
  ${fontStyles.big};
`;

const IndicatorsRow = styled.View`
  flex-direction: row;
  padding-left: 8px;
`;

const ActionLabel = styled.View`
  align-items: center;
  justify-content: center;
  ${({ button, theme }) => button && `border: 1px solid ${theme.colors.border}`}
  ${({ button }) => button && 'border-radius: 3px;'}
  ${({ button }) => button && 'height: 34px;'}
`;

const ActionLabelText = styled(BaseText)`
  ${fontStyles.medium};
  color: ${({ color, theme }) => color || theme.colors.secondaryText};
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
  background: ${({ accept, theme }) => accept ? theme.colors.primary : 'transparent'};
`;

const ImageAddonHolder = styled.View`
  position: absolute;
  top: 0;
  right: 10px;
`;

const ImageWrapper = (props: ImageWrapperProps) => {
  const {
    children,
    hasShadow,
    imageDiameter,
    imageWrapperStyle,
  } = props;

  if (hasShadow) {
    const shadowDiameter = imageDiameter || 54;
    return (
      <ImageHolder style={imageWrapperStyle}>
        <Shadow
          shadowColorAndroid="#38105baa"
          heightAndroid={shadowDiameter}
          widthAndroid={shadowDiameter}
          heightIOS={shadowDiameter}
          widthIOS={shadowDiameter}
          shadowRadius={shadowDiameter / 2}
          useSVGShadow
          shadowOpacity={0.5}
          shadowOffsetX={0}
        >
          {children}
        </Shadow>
      </ImageHolder>
    );
  }
  return (
    <ImageHolder style={imageWrapperStyle}>
      {children}
    </ImageHolder>
  );
};

const ItemImage = (props: Props) => {
  const {
    label,
    avatarUrl,
    iconName,
    itemImageUrl,
    fallbackSource,
    navigateToProfile,
    imageUpdateTimeStamp,
    customImage,
    itemImageSource,
    diameter,
    iconColor,
    iconSource,
  } = props;

  if (iconName) {
    return (
      <IconCircle diameter={diameter}>
        <ItemIcon name={iconName} color={iconColor} />
      </IconCircle>
    );
  }

  if (iconSource) {
    return (
      <IconCircle diameter={diameter}>
        <IconImage source={iconSource} />
      </IconCircle>
    );
  }

  if (customImage) return customImage;

  if (itemImageUrl) {
    return (<TokenImage diameter={diameter} source={{ uri: itemImageUrl }} fallbackSource={fallbackSource} />);
  }

  if (itemImageSource) {
    return (<TokenImage diameter={diameter} source={itemImageSource} fallbackSource={fallbackSource} />);
  }

  const updatedUserImageUrl = imageUpdateTimeStamp && avatarUrl ? `${avatarUrl}?t=${imageUpdateTimeStamp}` : avatarUrl;

  return (
    <ProfileImage
      onPress={navigateToProfile}
      uri={updatedUserImageUrl}
      userName={label}
      diameter={diameter || 52}
      textStyle={{ fontSize: fontSizes.big }}
      noShadow
    />
  );
};

const ImageAddon = (props: Props) => {
  const {
    imageAddonIconName,
    imageAddonUrl,
    imageAddonName,
    iconColor,
  } = props;

  if (imageAddonIconName) {
    return (
      <ImageAddonHolder>
        <IconCircle diameter={22}>
          <ItemIcon
            name={imageAddonIconName}
            color={iconColor}
            fontSize={30}
            style={{ lineHeight: 30, width: 30, height: 30 }}
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
        initialsSize={fontSizes.small}
      />
    </ImageAddonHolder>
  );
};

const Addon = (props: AddonProps) => {
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
    colors,
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
        <ActionLabelText button={labelAsButton} color={labelAsButton ? colors.primary : actionLabelColor}>
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
          color={colors.secondaryText}
          margin={0}
          icon="close"
          fontSize={fontSizes.regular}
          onPress={rejectInvitation}
        />
        <ActionCircleButton
          color={colors.control}
          margin={0}
          accept
          icon="check"
          fontSize={fontSizes.regular}
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
      custom,
    } = balance;
    return (
      <Wrapper style={{ alignItems: 'flex-end' }}>
        {!!tokenBalance.toString() &&
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <ItemValueBold>{`${tokenBalance} ${token}`}</ItemValueBold>
          {custom && <View style={{ marginLeft: 10 }}>{custom}</View>}
        </View>
        }
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
      hasShadow,
      imageWrapperStyle,
      theme,
    } = this.props;

    const type = getType(this.props);
    const colors = getThemeColors(theme);

    return (
      <ItemWrapper wrapperOpacity={wrapperOpacity}>
        <InnerWrapper type={type} onPress={onPress} disabled={!onPress} horizontalAlign={innerWrapperHorizontalAlign}>
          <ImageWrapper hasShadow={hasShadow} imageWrapperStyle={imageWrapperStyle}>
            <ItemImage {...this.props} />
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
                <ItemSubText numberOfLines={2}>{subtext}</ItemSubText>
                }
              </Column>
              <Column rightColumn type={type} style={{ maxWidth: '50%' }}>
                <View style={[rightColumnInnerStyle, { flexWrap: 'wrap' }]}>
                  {!!customAddonAlignLeft && customAddon}
                  <Addon {...this.props} type={type} colors={colors} />
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

export default withTheme(ListItemWithImage);
