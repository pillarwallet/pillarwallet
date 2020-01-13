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
import { RECOVERY_PORTAL_URL } from 'react-native-dotenv';
import type { NavigationScreenProp } from 'react-navigation';

// constants
import { RECOVERY_PORTAL_CONNECT_DEVICE } from 'constants/navigationConstants';

// components
import { ScrollWrapper, Wrapper } from 'components/Layout';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';

// util
import { WebView } from 'react-native-webview';
import Button from 'components/Button';

type Props = {
  navigation: NavigationScreenProp,
};

const RecoveryPortalSignUp = (props: Props) => {
  return (
    <ContainerWithHeader
      headerProps={{ centerItems: [{ title: 'Recovery Portal Sign Up' }] }}
    >
      <ScrollWrapper>
        <Wrapper flex={1} center regularPadding>
          <WebView
            source={{ uri: RECOVERY_PORTAL_URL }}
            originWhitelist={['*']}
          />
          <Button
            block
            title="Next"
            onPress={() => props.navigation.navigate(RECOVERY_PORTAL_CONNECT_DEVICE)}
          />
        </Wrapper>
      </ScrollWrapper>
    </ContainerWithHeader>
  );
};

export default RecoveryPortalSignUp;
