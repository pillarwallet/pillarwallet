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

import React, { useState } from 'react';
import { Image } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import LinearGradient from 'react-native-linear-gradient';
import styled from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import Text from 'components/modern/Text';
import Icon from 'components/Icon';

// Constants
import { SMART_WALLET_INTRO } from 'constants/navigationConstants';

// Utils
import { hitSlop20 } from 'utils/common';
import { spacing } from 'utils/variables';

// Types
import type { ViewStyleProp } from 'utils/types/react-native';

// Assets
const pattern = require('assets/images/patterns/wallet-connect-arrows.png');

type Props = {|
  style?: ViewStyleProp,
|};

const WhatIsWalletConnect = ({ style }: Props) => {
  const { t } = useTranslationWithPrefix('walletConnect.home');
  const navigation = useNavigation();

  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const handlePress = () => navigation.navigate(SMART_WALLET_INTRO);

  return (
    <TouchableContainer onPress={handlePress} style={style}>
      <BackgroundGradient colors={GRADIENT_COLORS} locations={[0.0, 0.5]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <BackgroundPattern source={pattern} />
        <Text variant="big" color="#fcfdff">
          {t('whatIsWalletConnect')}
        </Text>
      </BackgroundGradient>

      <CloseButton onPress={() => setIsVisible(false)} hitSlop={hitSlop20}>
        <CloseIcon name="rounded-close" />
      </CloseButton>
    </TouchableContainer>
  );
};

export default WhatIsWalletConnect;

const GRADIENT_COLORS = ['#3183dc', '#190473'];

const TouchableContainer = styled.TouchableOpacity``;

const BackgroundGradient = styled(LinearGradient)`
  padding: ${spacing.mediumLarge}px ${spacing.large}px;
  padding-right: 48px;
  border-radius: 20px;
`;

const BackgroundPattern = styled(Image)`
  position: absolute;
  right: 0;
`;

const CloseButton = styled.TouchableOpacity`
  position: absolute;
  top: 18px;
  right: 18px;
`;

const CloseIcon = styled(Icon)`
  color: #fcfdff;
  font-size: 14px;
`;
