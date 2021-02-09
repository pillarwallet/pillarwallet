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

import React from 'react';
import { Image, View } from 'react-native';
import styled, { withTheme } from 'styled-components/native';

import t from 'translations/translate';
import { BaseText } from 'components/Typography';
import { fontStyles } from 'utils/variables';
import { themedColors } from 'utils/themes';
import { images } from 'utils/images';
import type { Theme } from 'models/Theme';

const InfoWrapper = styled.View`
  flex-direction: row;
  align-items: center;
  margin-top: 25px;
  margin-bottom: 40px;
  width: 100%;
`;

const Text = styled(BaseText)`
  ${fontStyles.regular};
  color: ${({ color }) => color};
`;

type Props = {
  theme: Theme,
};

const WBTCCafeWarning = ({ theme }: Props) => (
  <InfoWrapper>
    <Image source={images(theme).infoIcon} style={{ height: 27, width: 27, marginRight: 15 }} />
    <View style={{ flex: 1 }}>
      <Text color={themedColors.secondaryText}>{t('wbtcCafe.warning')}</Text>
    </View>
  </InfoWrapper>
);

export default withTheme(WBTCCafeWarning);
