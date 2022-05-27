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
import { View } from 'react-native';
import styled, { withTheme } from 'styled-components/native';
import t from 'translations/translate';

// Components
import Icon from 'components/legacy/Icon';
import { BaseText, MediumText } from 'components/legacy/Typography';
import ProfileImage from 'components/ProfileImage';
import Button from 'components/legacy/Button';
import Image from 'components/Image';
import { Shadow } from 'components/Shadow';
import { Wrapper, Spacing } from 'components/legacy/Layout';
import TankAssetBalance from 'components/TankAssetBalance';
import { LabelBadge } from 'components/LabelBadge/LabelBadge';
import CollectibleImage from 'components/CollectibleImage';

// Constants
import { ACTION, DEFAULT } from 'constants/listItemConstants';

// Utils
import { formatTokenAmount } from 'utils/common';
import { fontSizes, spacing, fontTrackings, fontStyles, objectFontStyles } from 'utils/variables';
import { getColorByTheme, getThemeColors } from 'utils/themes';
import { images } from 'utils/images';

// Types
import type { AssetOptionBalance } from 'models/Asset';
import type { Theme, ThemeColors } from 'models/Theme';

type Props = {
  label: string,
  navigateToProfile?: ?Function,
  subtext?: string,
  paragraph?: string,
  paragraphLines?: string,
  customAddon?: React.Node,
  onPress?: ?Function,
  iconName?: ?string,
  iconDiameter?: ?number,
  itemImageUrl?: string,
  fallbackSource?: string,
  itemValue?: ?string,
  itemStatusIcon?: string,
  valueColor?: ?string,
  buttonActionLabel?: string,
  actionLabelAsButton?: boolean,
  customLabel?: React.Node,
  buttonAction?: Function,
  secondaryButton?: boolean,
  actionLabel?: ?string,
  actionLabelColor?: ?string,
  type?: string,
  children?: React.Node,
  small?: boolean,
  imageAddonIconName?: string,
  imageAddonUrl?: string,
  imageAddonName?: string,
  rightColumnInnerStyle?: Object,
  customAddonFullWidth?: React.Node,
  customAddonAlignLeft?: boolean,
  customImage?: React.Node,
  imageDiameter?: number,
  balance?: AssetOptionBalance,
  innerWrapperHorizontalAlign?: string,
  itemImageSource?: string,
  wrapperOpacity?: number,
  diameter?: number,
  iconColor?: string,
  hasShadow?: boolean,
  iconSource?: string,
  imageWrapperStyle?: Object,
  theme: Theme,
  fallbackToGenericToken?: boolean,
  badge?: string,
  iconBackgroundColor?: string,
  iconBorder?: boolean,
  address?: string,
  collectibleUrl?: string,
  iconImageResizeMode?: string,
  iconImageSize?: number,
  statusIconColor?: string,
  padding?: string,
  itemImageRoundedSquare?: boolean,
  cornerIcon?: any,
  cornerIconSize?: number,
  leftAddon?: React.Node,
};

type AddonProps = {
  itemValue?: ?string,
  itemStatusIcon?: string,
  valueColor?: ?string,
  buttonActionLabel?: string,
  actionLabelAsButton?: boolean,
  buttonAction?: () => void,
  secondaryButton?: boolean,
  actionLabel?: ?string,
  actionLabelColor?: ?string,
  balance?: AssetOptionBalance,
  colors: ThemeColors,
  statusIconColor?: string,
};

type ImageWrapperProps = {
  children: React.Node,
  hasShadow?: boolean,
  imageDiameter?: number,
  imageWrapperStyle?: Object,
};

const ItemWrapper = styled.View`
  flex-direction: column;
  width: 100%;
  ${({ wrapperOpacity }) => wrapperOpacity && `opacity: ${wrapperOpacity};`}
`;

const InnerWrapper = styled.TouchableOpacity`
  flex-direction: row;
  align-items: ${(props) => props.horizontalAlign || 'center'};
  justify-content: center;
  padding: ${({ padding }) => padding || `14px ${spacing.large}px`};
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
  align-items: ${(props) => props.horizontalAlign || 'center'};
  justify-content: space-between;
  width: 100%;
`;

const Column = styled.View`
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  flex: 1;
  min-height: 54px;
`;

const LeftColumn = styled.View`
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  margin-right: ${spacing.rhythm}px;
  min-height: 54px;
`;

const RightColumn = styled.View`
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  margin-left: 10px;
  min-height: 54px;
`;

const ItemTitle = styled(MediumText)`
  color: ${({ theme }) => theme.colors.basic010};
  ${fontStyles.big};
  width: 100%;
`;

const ItemParagraph = styled(BaseText)`
  color: ${({ theme }) => theme.colors.basic030};
  ${fontStyles.regular};
  letter-spacing: ${fontTrackings.tiny}px;
  flex: 1;
`;

const ItemSubText = styled(BaseText)`
  color: ${({ theme }) => theme.colors.basic030};
  font-size: ${fontSizes.regular}px;
`;

const IconRounded = styled.View`
  ${({ diameter, borderRadius }) => `
    width: ${(!borderRadius && diameter) || 52}px;
    height: ${(!borderRadius && diameter) || 52}px;
    border-radius: ${borderRadius || (diameter ? diameter / 2 : 26)}px;
  `}
  background-color: ${({ backgroundColor }) =>
    backgroundColor || getColorByTheme({ lightKey: 'basic060', darkKey: 'basic040' })};
  align-items: center;
  justify-content: center;
  text-align: center;
  border-color: ${getColorByTheme({ lightKey: 'basic060', darkKey: 'basic040' })};
  border-width: 0;
  ${({ border }) => border && 'border-width: 1px;'}
  overflow: hidden;
`;

const ItemIcon = styled(Icon)`
  font-size: ${(props) => props.fontSize || 48}px;
  color: ${({ iconColor, theme }) => iconColor || theme.colors.basic000};
`;

const IconImage = styled(Image)`
  ${({ size }) => `
    height: ${size || 24}px;
    width: ${size || 24}px;
  `}
`;

const TokenImage = styled(Image)`
  ${({ borderRadius, diameter }) => `
    width: ${(!borderRadius && diameter) || 54}px;
    height: ${(!borderRadius && diameter) || 54}px;
    border-radius: ${borderRadius || (diameter ? diameter / 2 : 27)}px;
  `}
`;

const StyledCollectibleImage = styled(CollectibleImage)`
  ${({ borderRadius, diameter }) => `
    width: ${(!borderRadius && diameter) || 54}px;
    height: ${(!borderRadius && diameter) || 54}px;
    border-radius: ${borderRadius || (diameter ? diameter / 2 : 27)}px;
  `}
`;

const ItemValue = styled(BaseText)`
  ${fontStyles.big};
  color: ${({ color, theme }) => color || theme.colors.basic010};
  text-align: right;
`;

const BalanceFiatValue = styled(BaseText)`
  ${fontStyles.big};
  color: ${({ color, theme }) => color || theme.colors.basic010};
  text-align: right;
`;

const BalanceValue = styled(BaseText)`
  ${fontStyles.regular};
  color: ${({ theme }) => theme.colors.basic030};
  text-align: right;
`;

const ItemValueStatus = styled(Icon)`
  margin-left: 12px;
  color: ${({ iconColor, theme }) => iconColor || theme.colors.basic020};
  ${fontStyles.big};
`;

const ActionLabel = styled.View`
  align-items: center;
  justify-content: center;
  border-color: ${getColorByTheme({ lightKey: 'basic060', darkKey: 'basic040' })};
  border-width: 0;
  ${({ button }) => button && 'border-width: 1px'}
  ${({ button }) => button && 'border-radius: 3px;'}
  ${({ button }) => button && 'height: 34px;'}
`;

const ActionLabelText = styled(BaseText)`
  ${fontStyles.regular};
  color: ${({ color, theme }) => color || theme.colors.basic020};
  margin-left: auto;
  margin-bottom: ${(props) => (props.button ? '2px' : 0)};
  padding: ${(props) => (props.button ? `0 ${spacing.large}px` : '6px 0')};
`;

const ImageAddonHolder = styled.View`
  position: absolute;
  top: 0;
  right: 10px;
`;

const CornerIcon = styled(Image)`
  width: 16px;
  height: 16px;
  position: absolute;
  top: 0;
  right: 0;
`;

const ImageWrapper = (props: ImageWrapperProps) => {
  const { children, hasShadow, imageDiameter, imageWrapperStyle } = props;

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
  return <ImageHolder style={imageWrapperStyle}>{children}</ImageHolder>;
};

const ItemImage = (props: Props) => {
  const {
    label,
    iconName,
    itemImageUrl,
    fallbackToGenericToken,
    navigateToProfile,
    customImage,
    itemImageSource,
    diameter,
    iconColor,
    iconSource,
    theme,
    iconBackgroundColor,
    iconBorder,
    collectibleUrl,
    iconImageResizeMode,
    iconImageSize,
    itemImageRoundedSquare,
    cornerIcon,
    iconDiameter,
  } = props;

  let { fallbackSource } = props;
  if (fallbackToGenericToken) ({ genericToken: fallbackSource } = images(theme));
  const roundedImageCustomBorderRadius = itemImageRoundedSquare && 13;

  if (iconName) {
    return (
      <IconRounded
        diameter={diameter}
        backgroundColor={iconBackgroundColor}
        border={iconBorder}
        borderRadius={roundedImageCustomBorderRadius}
      >
        <ItemIcon fontSize={iconDiameter} name={iconName} iconColor={iconColor} />
      </IconRounded>
    );
  }

  if (iconSource) {
    return (
      <IconRounded
        diameter={diameter}
        backgroundColor={iconBackgroundColor}
        border={iconBorder}
        borderRadius={roundedImageCustomBorderRadius}
      >
        <IconImage source={iconSource} size={iconImageSize} resizeMode={iconImageResizeMode} />
      </IconRounded>
    );
  }

  if (customImage) return customImage;

  if (itemImageUrl) {
    return (
      <IconRounded
        diameter={diameter}
        backgroundColor={iconBackgroundColor}
        border={iconBorder}
        borderRadius={roundedImageCustomBorderRadius}
      >
        <TokenImage diameter={diameter} source={{ uri: itemImageUrl }} fallbackSource={fallbackSource} />
      </IconRounded>
    );
  }

  if (collectibleUrl) {
    return (
      <IconRounded
        diameter={diameter}
        backgroundColor={iconBackgroundColor}
        border={iconBorder}
        borderRadius={roundedImageCustomBorderRadius}
      >
        <StyledCollectibleImage
          width={diameter}
          height={diameter}
          diameter={diameter}
          source={{ uri: collectibleUrl }}
        />
      </IconRounded>
    );
  }

  if (itemImageSource) {
    return (
      <View>
        <TokenImage
          diameter={diameter}
          source={itemImageSource}
          fallbackSource={fallbackSource}
          borderRadius={roundedImageCustomBorderRadius}
        />
        {cornerIcon && <CornerIcon source={cornerIcon} />}
      </View>
    );
  }

  return (
    <ProfileImage
      onPress={navigateToProfile}
      userName={label}
      diameter={diameter || 52}
      cornerIcon={cornerIcon}
      cornerIconSize={16}
    />
  );
};

const ImageAddon = (props: Props) => {
  const { imageAddonIconName, imageAddonName, iconColor } = props;

  if (imageAddonIconName) {
    return (
      <ImageAddonHolder>
        <IconRounded diameter={22}>
          <ItemIcon
            name={imageAddonIconName}
            color={iconColor}
            fontSize={30}
            style={{ lineHeight: 30, width: 30, height: 30 }}
          />
        </IconRounded>
      </ImageAddonHolder>
    );
  }

  return (
    <ImageAddonHolder>
      <ProfileImage onPress={() => {}} userName={imageAddonName} diameter={22} borderWidth={2} />
    </ImageAddonHolder>
  );
};

const Addon = (props: AddonProps) => {
  const {
    itemValue,
    itemStatusIcon,
    statusIconColor,
    valueColor,
    buttonActionLabel,
    actionLabelAsButton,
    buttonAction,
    secondaryButton,
    actionLabel,
    actionLabelColor,
    balance,
    colors,
  } = props;
  if (itemValue || itemStatusIcon) {
    return (
      <Wrapper horizontal style={{ flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end' }}>
        {!!itemValue && (
          <ItemValue color={valueColor} numberOfLines={2} ellipsizeMode="tail">
            {itemValue}
          </ItemValue>
        )}
        {!!itemStatusIcon && <ItemValueStatus name={itemStatusIcon} iconColor={statusIconColor} />}
      </Wrapper>
    );
  }

  if (actionLabel) {
    return (
      <ActionLabel button={actionLabelAsButton}>
        <ActionLabelText button={actionLabelAsButton} color={actionLabelAsButton ? colors.basic000 : actionLabelColor}>
          {actionLabel}
        </ActionLabelText>
      </ActionLabel>
    );
  }

  if (buttonActionLabel) {
    return (
      <Button
        title={buttonActionLabel}
        onPress={buttonAction}
        small
        secondary={secondaryButton}
        horizontalPaddings={8}
        block={false}
      />
    );
  }

  if (balance) {
    const { syntheticBalance = '', balance: tokenBalance = 0, token = '', value = '' } = balance;

    return (
      <View style={{ flexDirection: 'row' }}>
        <Wrapper style={{ alignItems: 'flex-end' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {!!value && <BalanceFiatValue>{value}</BalanceFiatValue>}
            {!!syntheticBalance && <TankAssetBalance amount={syntheticBalance} token={token} />}
          </View>

          {!!tokenBalance && (
            <BalanceValue>{t('tokenValue', { value: formatTokenAmount(tokenBalance, token), token })}</BalanceValue>
          )}

          {!tokenBalance && !syntheticBalance && <BalanceValue>{token}</BalanceValue>}
        </Wrapper>
      </View>
    );
  }

  return null;
};

const getType = (props: Props) => {
  if ((props.subtext && !props.small) || props.iconName) {
    return ACTION;
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
    badge,
    customLabel,
    padding,
    leftAddon,
  } = props;

  const type = getType(props);
  const colors = getThemeColors(theme);
  const hasImageAddon = !!(imageAddonUrl || imageAddonIconName || imageAddonName);

  return (
    <ItemWrapper wrapperOpacity={wrapperOpacity}>
      <InnerWrapper
        type={type}
        onPress={onPress}
        disabled={!onPress}
        horizontalAlign={innerWrapperHorizontalAlign}
        padding={padding}
      >
        {!!leftAddon && <LeftColumn>{leftAddon}</LeftColumn>}

        <ImageWrapper hasShadow={hasShadow} imageWrapperStyle={imageWrapperStyle}>
          <ItemImage {...props} />
          {hasImageAddon && <ImageAddon {...props} />}
        </ImageWrapper>
        <View style={{ flex: 1 }}>
          <InfoWrapper type={type} horizontalAlign={innerWrapperHorizontalAlign}>
            <Column type={type} style={{ flexGrow: 1 }}>
              {(!!label || !!customLabel) && (
                <Row>
                  {!!customLabel && customLabel}
                  {!!label && (
                    <ItemTitle numberOfLines={2} ellipsizeMode="tail" type={type}>
                      {label}
                    </ItemTitle>
                  )}
                </Row>
              )}
              {!!paragraph && (
                <Row>
                  <ItemParagraph numberOfLines={paragraphLines}>{paragraph}</ItemParagraph>
                </Row>
              )}
              {!!subtext && (
                <React.Fragment>
                  <Spacing h={2} />
                  <ItemSubText numberOfLines={2}>{subtext}</ItemSubText>
                </React.Fragment>
              )}
              {!!badge && (
                <React.Fragment>
                  <Spacing h={4} />
                  <LabelBadge label={badge} primary labelStyle={objectFontStyles.tiny} />
                </React.Fragment>
              )}
            </Column>
            <RightColumn type={type} style={{ maxWidth: '50%' }}>
              <View style={[rightColumnInnerStyle, { flexWrap: 'wrap' }]}>
                {!!customAddonAlignLeft && customAddon}
                <Addon {...props} type={type} colors={colors} />
                {!customAddonAlignLeft && customAddon}
                {children}
              </View>
            </RightColumn>
          </InfoWrapper>
        </View>
      </InnerWrapper>
      {customAddonFullWidth}
    </ItemWrapper>
  );
};

export default withTheme(ListItemWithImage);
