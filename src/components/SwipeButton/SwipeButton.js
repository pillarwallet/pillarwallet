// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

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
import RnSwipeButton from 'rn-swipe-button';

// Components
import Icon from 'components/core/Icon';

// Utils
import { fontSizes, spacing, appFont } from 'utils/variables';
import { useThemeColors } from 'utils/themes';

type Props = {
  confirmTitle?: string,
  onPress?: () => void,
  disabled?: boolean,
};

const SwipeButton = ({ onPress, confirmTitle, disabled }: Props) => {
  const colors = useThemeColors();

  const SwiperIconComponent = () => {
    return (
      <View style={styles.swiperView}>
        <Icon name="arrow-right" />
      </View>
    );
  };

  return (
    <RnSwipeButton
      width="100%"
      height={72}
      title={confirmTitle}
      titleFontSize={fontSizes.medium}
      titleColor={colors.buttonPrimaryTitle}
      titleStyles={styles.swiperButtonTitle}
      containerStyles={styles.swiperButtonContainer}
      railBorderColor={colors.swiperButtonTrack}
      railBackgroundColor={colors.swiperButtonTrack}
      railFillBackgroundColor="transparent"
      railFillBorderColor={colors.swiperButtonTrack}
      thumbIconComponent={SwiperIconComponent}
      thumbIconWidth={84}
      thumbIconBackgroundColor={colors.swiperButtonThumb}
      thumbIconBorderColor={colors.swiperButtonThumb}
      thumbIconStyles={styles.swiperBtnthumbIcon}
      onSwipeSuccess={onPress}
      disabled={disabled}
    />
  );
};

export default SwipeButton;

const styles = {
  swiperButtonTitle: {
    paddingLeft: spacing.extraPlusLarge,
    fontFamily: appFont.medium,
  },
  swiperButtonContainer: {
    borderRadius: 14,
  },
  swiperBtnthumbIcon: {
    borderRadius: 12,
  },
  swiperView: {
    justifyContent: 'center',
    alignItems: 'center',
  },
};
