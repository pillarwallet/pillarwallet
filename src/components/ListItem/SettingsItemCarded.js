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
import styled, { withTheme } from 'styled-components/native';

import ShadowedCard from 'components/ShadowedCard';
import Icon from 'components/legacy/Icon';
import Image from 'components/Image';
import { BaseText, MediumText } from 'components/legacy/Typography';
import Spinner from 'components/Spinner';

import { spacing, fontSizes, fontStyles } from 'utils/variables';
import { getThemeColors } from 'utils/themes';
import { responsiveSize } from 'utils/ui';
import type { Theme } from 'models/Theme';

type Props = {
  iconSource?: string,
  fallbackIcon?: string,
  title: string,
  subtitle?: ?string,
  onPress?: () => void,
  isActive?: boolean,
  theme: Theme,
  isLoading: boolean,
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
  color: ${({ theme }) => theme.colors.basic010};
  font-size: ${fontSizes.big}px;
  line-height: 24px;
`;

const CardSubtitle = styled(BaseText)`
  color: ${({ theme }) => theme.colors.basic030};
  ${fontStyles.medium};
`;

const CheckIcon = styled(Icon)`
  font-size: ${fontSizes.rSmall}px;
  color: ${({ theme }) => theme.colors.basic000};
  align-self: flex-start;
`;

const IconWrapper = styled.View`
  align-items: center;
  justify-content: center;
  margin-right: ${responsiveSize(16)}px;
`;

const iconRadius = responsiveSize(52);
const CardImage = styled(Image)`
  height: ${iconRadius}px;
  width: ${iconRadius}px;
  border-radius: ${iconRadius / 2}px;
`;

export const LoadingSpinner = styled(Spinner)`
  padding: 10px;
  align-items: center;
  justify-content: center;
`;

const SettingsItemCarded = (props: Props) => {
  const {
    title,
    subtitle,
    onPress,
    isActive,
    iconSource,
    fallbackIcon,
    theme,
    isLoading,
  } = props;

  const colors = getThemeColors(theme);
  const buttonSideLength = responsiveSize(84);

  const showIcon = !!iconSource || !!fallbackIcon;

  return (
    <ItemWrapper>
      <ShadowedCard
        wrapperStyle={{ flexGrow: 1 }}
        contentWrapperStyle={{
          paddingVertical: 6,
          paddingHorizontal: responsiveSize(16),
          minHeight: buttonSideLength,
          justifyContent: 'center',
          flexWrap: 'wrap',
          borderWidth: 2,
          borderColor: isActive ? colors.basic000 : 'transparent',
          borderRadius: 6,
        }}
        onPress={onPress}
      >
        <CardRow>
          {showIcon &&
          <IconWrapper>
            <CardImage source={iconSource} fallbackSource={fallbackIcon} />
          </IconWrapper>}
          <CardContent>
            <CardTitle>{title}</CardTitle>
            {!!subtitle && <CardSubtitle>{subtitle}</CardSubtitle>}
          </CardContent>
          {isActive && !isLoading && <CheckIcon name="check" />}
          {isLoading && <LoadingSpinner size={fontSizes.large} trackWith={2} />}
        </CardRow>
      </ShadowedCard>
    </ItemWrapper>
  );
};

export default withTheme(SettingsItemCarded);
