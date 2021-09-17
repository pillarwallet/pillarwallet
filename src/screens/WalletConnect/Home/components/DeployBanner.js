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
import styled from 'styled-components/native';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import Icon from 'components/core/Icon';
import Text from 'components/core/Text';

// Hooks
import { useDeploymentStatus } from 'hooks/deploymentStatus';

// Utils
import { hitSlop20 } from 'utils/common';
import { useChainConfig } from 'utils/uiConfig';
import { spacing } from 'utils/variables';

// Types
import type { ViewStyleProp } from 'utils/types/react-native';
import type { Chain } from 'models/Chain';

type Props = {|
  chain: Chain,
  style?: ViewStyleProp,
|};

const DeployBanner = ({ chain, style }: Props) => {
  const { t } = useTranslationWithPrefix('walletConnect.home');

  const [isVisible, setIsVisible] = useState(true);

  const { showDeploymentInterjection } = useDeploymentStatus();
  const chainConfig = useChainConfig(chain);

  if (!isVisible) return null;

  const handlePress = () => {
    showDeploymentInterjection(chain);
  };

  return (
    <TouchableContainer onPress={handlePress} style={style}>
      <BackgroundGradient colors={GRADIENT_COLORS} locations={[0.05, 0.25]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 6 }}>
        <Text color="#fcfdff">{t('deployOnChainFormat', { chain: chainConfig.title })}</Text>
      </BackgroundGradient>

      <CloseButton onPress={() => setIsVisible(false)} hitSlop={hitSlop20}>
        <Icon name="close-circle" color="#fcfdff" width={16} height={16} />
      </CloseButton>
    </TouchableContainer>
  );
};

export default DeployBanner;

const GRADIENT_COLORS = ['#008606', '#000100'];

const TouchableContainer = styled.TouchableOpacity`
`;

const BackgroundGradient = styled(LinearGradient)`
  padding: ${spacing.mediumLarge}px ${spacing.large}px;
  padding-right: 48px;
  border-radius: 20px;
`;

const CloseButton = styled.TouchableOpacity`
  position: absolute;
  top: 18px;
  right: 18px;
`;
