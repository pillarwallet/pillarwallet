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
import { Dimensions } from 'react-native';
import styled from 'styled-components/native';
import { CachedImage } from 'react-native-cached-image';

import { spacing, baseColors, fontSizes, fontStyles } from 'utils/variables';
import ShadowedCard from 'components/ShadowedCard';
import Icon from 'components/Icon';
import { BaseText, MediumText } from 'components/Typography';
import Spinner from 'components/Spinner';

import { responsiveSize } from 'utils/ui';
import { noop } from 'utils/common';

type Props = {
  icon?: string,
  fallbackIcon?: string,
  title: string,
  subtitle?: ?string,
  action?: Function,
  note?: Object,
  titleStyle?: Object,
  label?: string,
  contentWrapperStyle?: Object,
  onMainPress?: ?Function,
  onSettingsPress?: ?Function,
  isActive?: boolean,
  customIcon?: React.Node,
  settingsIcon?: string,
  settingsLabel?: string,
  isLoading?: boolean,
  onSettingsLoadingPress?: Function,
  settingsIconSource?: string,
  sidePaddingsForWidth?: number,
}

const ItemWrapper = styled.View`
   flex-direction: row;
   margin-bottom: ${spacing.medium}px;
   align-items: stretch;
`;

const CardRow = styled.View`
   flex-direction: row;
   width: 100%;
   align-items: center;
`;

const CardContent = styled.View`
  flex-direction: column;
  width: 0;
  flexGrow: 1;
  padding-right: 6px;
`;

const CardTitle = styled(MediumText)`
  color: ${baseColors.slateBlack};
  font-size: ${fontSizes.big}px;
  line-height: 24px;
`;

const CardSubtitle = styled(BaseText)`
  color: ${baseColors.coolGrey};
  ${fontStyles.medium};
`;

const CheckIcon = styled(Icon)`
  font-size: ${fontSizes.rSmall}px;
  color: ${baseColors.electricBlue};
  align-self: flex-start;
`;

const SettingsIcon = styled(Icon)`
  font-size: ${fontSizes.big}px;
  color: ${baseColors.malibu};
`;

const IconWrapper = styled.View`
  align-items: center;
  justify-content: center;
  margin-right: ${responsiveSize(16)}px;
`;

const iconRadius = responsiveSize(52);
const CardImage = styled(CachedImage)`
  height: ${iconRadius}px;
  width: ${iconRadius}px;
  border-radius: ${iconRadius / 2}px;
  background-color: ${baseColors.darkGray};
`;
const SettingsLabel = styled(MediumText)`
  ${fontStyles.rRegular};
  color: ${baseColors.malibu};
  margin-top: 4px;
`;

const ButtonIcon = styled(CachedImage)`
  height: 24px;
  width: 24px;
  justify-content: center;
  display: flex;
`;

export const LoadingSpinner = styled(Spinner)`
  padding: 10px;
  align-items: center;
  justify-content: center;
`;

const { width: screenWidth } = Dimensions.get('window');

const defaultSettingsIcon = require('assets/icons/icon_settings.png');

const SettingsIconComponent = (props) => {
  const { settingsIconSource, settingsIcon } = props;
  if (settingsIcon) {
    return (
      <SettingsIcon name={settingsIcon} />
    );
  }

  return (
    <ButtonIcon
      source={settingsIconSource || defaultSettingsIcon}
      resizeMode="contain"
      resizeMethod="resize"
    />
  );
};

export const SettingsItemCarded = (props: Props) => {
  const {
    title,
    subtitle,
    onMainPress,
    onSettingsPress,
    onSettingsLoadingPress,
    isActive,
    customIcon,
    icon,
    fallbackIcon,
    settingsIconSource,
    settingsIcon,
    settingsLabel,
    isLoading,
    sidePaddingsForWidth,
  } = props;

  const buttonSideLength = responsiveSize(84);
  const settingsActionOnLoading = onSettingsLoadingPress || noop;
  const settingsAction = isLoading ? settingsActionOnLoading : onSettingsPress;
  const cardsSpacing = 8;
  const additionalWrapperStyle = {};
  if (sidePaddingsForWidth) {
    additionalWrapperStyle.width = screenWidth - sidePaddingsForWidth - buttonSideLength - cardsSpacing;
  }

  const showIcon = !!icon || !!fallbackIcon || !!customIcon;

  return (
    <ItemWrapper>
      <ShadowedCard
        wrapperStyle={{
          flexGrow: 1,
          ...additionalWrapperStyle,
        }}
        contentWrapperStyle={{
          paddingVertical: 6,
          paddingHorizontal: responsiveSize(16),
          minHeight: buttonSideLength,
          justifyContent: 'center',
          flexWrap: 'wrap',
          borderWidth: 2,
          borderColor: isActive ? baseColors.electricBlue : baseColors.white,
          borderRadius: 6,
        }}
        onPress={onMainPress}
      >
        <CardRow>
          {showIcon &&
          <IconWrapper>
            {(!!icon || !!fallbackIcon) && <CardImage source={{ uri: icon }} fallbackSource={fallbackIcon} />}
            {customIcon}
          </IconWrapper>}
          <CardContent>
            <CardTitle>{title}</CardTitle>
            {!!subtitle && <CardSubtitle>{subtitle}</CardSubtitle>}
          </CardContent>
          {isActive && <CheckIcon name="check" />}
        </CardRow>
      </ShadowedCard>
      {!!onSettingsPress &&
      <ShadowedCard
        wrapperStyle={{
          width: buttonSideLength,
          marginLeft: cardsSpacing,
          flexDirection: 'column',
          height: '100%',
        }}
        contentWrapperStyle={{
          padding: spacing.small,
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: 'stretch',
          height: '100%',
        }}
        upperContentWrapperStyle={{
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
        }}
        onPress={settingsAction}
      >
        {!!isLoading && <LoadingSpinner />}
        {!isLoading &&
        <React.Fragment>
          <SettingsIconComponent
            settingsIconSource={settingsIconSource}
            settingsIcon={settingsIcon}
          />
          {!!settingsLabel &&
          <SettingsLabel
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {settingsLabel}
          </SettingsLabel>
          }
        </React.Fragment>}
      </ShadowedCard>}
    </ItemWrapper>
  );
};
