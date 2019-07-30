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
import styled from 'styled-components/native';
import { CachedImage } from 'react-native-cached-image';

import { spacing, baseColors, fontSizes } from 'utils/variables';
import ShadowedCard from 'components/ShadowedCard';
import Icon from 'components/Icon';
import { BaseText, BoldText } from 'components/Typography';

import { responsiveSize } from 'utils/ui';

type Props = {
  icon?: string,
  fallbackIcon?: string,
  title: string,
  subtitle?: string,
  action?: Function,
  note?: Object,
  titleStyle?: Object,
  label?: string,
  contentWrapperStyle?: Object,
  onMainPress?: Function,
  onSettingsPress?: Function,
  isActive?: boolean,
  customIcon?: React.Node,
}

const ItemWrapper = styled.View`
   flex-direction: row;
   flex: 1;
   margin-bottom: ${spacing.medium}px;
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

const CardTitle = styled(BoldText)`
  color: ${baseColors.slateBlack};
  font-size: ${fontSizes.small}px;
  line-height: ${fontSizes.small}px;
`;

const CardSubtitle = styled(BaseText)`
  color: ${baseColors.coolGrey};
  font-size: 13px;
  line-height: 15px;
  margin-top: 4px;
`;

const CheckIcon = styled(Icon)`
  font-size: ${responsiveSize(14)};
  color: ${baseColors.electricBlue};
  align-self: flex-start;
`;

const SettingsIcon = styled(Icon)`
  font-size: ${fontSizes.extraLarge};
  color: ${baseColors.malibu};
`;

const IconWrapper = styled.View`
  margin-right: ${spacing.medium}px;
  align-items: center;
  justify-content: center;
`;

const iconRadius = responsiveSize(52);
const CardImage = styled(CachedImage)`
  height: ${iconRadius}px;
  width: ${iconRadius}px;
  border-radius: ${iconRadius / 2}px;
  background-color: ${baseColors.darkGray};
`;

export const SettingsItemCarded = (props: Props) => {
  const {
    title,
    subtitle,
    onMainPress,
    onSettingsPress,
    isActive,
    customIcon,
    icon,
    fallbackIcon,
  } = props;

  const buttonSideLength = responsiveSize(84);
  return (
    <ItemWrapper>
      <ShadowedCard
        wrapperStyle={{
          flex: 1,
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
          <IconWrapper>
            {(!!icon || !!fallbackIcon) && <CardImage source={{ uri: icon }} fallbackSource={fallbackIcon} />}
            {customIcon}
          </IconWrapper>
          <CardContent>
            <CardTitle>{title}</CardTitle>
            <CardSubtitle>{subtitle}</CardSubtitle>
          </CardContent>
          {isActive && <CheckIcon name="check" />}
        </CardRow>
      </ShadowedCard>
      <ShadowedCard
        wrapperStyle={{ width: buttonSideLength, marginLeft: 8, height: '100%' }}
        contentWrapperStyle={{
          padding: 20,
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onPress={onSettingsPress}
      >
        <SettingsIcon name="settings" />
      </ShadowedCard>
    </ItemWrapper>
  );
};
