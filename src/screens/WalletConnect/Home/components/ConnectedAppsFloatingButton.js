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
import { TouchableOpacity } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import SafeAreaView from 'react-native-safe-area-view';
import styled from 'styled-components/native';
import Emoji from 'react-native-emoji';

// Components
import Text from 'components/modern/Text';

// Hooks
import useWalletConnect from 'hooks/useWalletConnect';

// Constants
import { WALLETCONNECT_CONNECTED_APPS } from 'constants/navigationConstants';

// Utils
import { spacing } from 'utils/variables';

const ConnectedAppsFloatingButton = () => {
  const navigation = useNavigation();

  const { activeConnectors } = useWalletConnect();

  if (activeConnectors.length === 0) {
    return null;
  }

  const navigateToConnectedApps = () => {
    navigation.navigate(WALLETCONNECT_CONNECTED_APPS);
  };

  return (
    <FloatingContainer forceInset={{ bottom: 'always' }}>
      <TouchableOpacity onPress={navigateToConnectedApps}>
        <ItemContainer>
          <Text>
            <Emoji name="zap" /> {activeConnectors.length}
          </Text>
        </ItemContainer>
      </TouchableOpacity>
    </FloatingContainer>
  );
};

export default ConnectedAppsFloatingButton;

const FloatingContainer = styled(SafeAreaView)`
  position: absolute;
  right: ${spacing.extraLarge}px;
  bottom: ${spacing.large}px;
  align-self: flex-end;
`;

const ItemContainer = styled.View`
  padding: ${spacing.mediumLarge}px ${spacing.medium}px ${spacing.mediumLarge}px;
  border-radius: 100px;
  background-color: ${({ theme }) => theme.colors.basic050};
  shadow-opacity: 0.05;
  shadow-color: #000;
  shadow-offset: 0 8px;
  shadow-radius: 16px;
  elevation: 6;
`;
