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
import { Alert, TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';

// constants
import { RECOVERY_PORTAL_SETUP_COMPLETE } from 'constants/navigationConstants';

// components
import { ScrollWrapper, Wrapper } from 'components/Layout';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { MediumText, Paragraph, TextLink } from 'components/Typography';
import Button from 'components/Button';

// util
import { fontStyles, spacing } from 'utils/variables';


type Props = {
  navigation: NavigationScreenProp,
};

const Title = styled(MediumText)`
  ${fontStyles.large};
  text-align: center;
  margin-bottom: ${spacing.small}px;
`;

const cancelPrompt = (callback) => Alert.alert(
  'Are you sure?',
  'You are going to cancel Recovery Portal setup.',
  [
    { text: 'Confirm cancel', onPress: () => callback() },
    { text: 'Dismiss', style: 'cancel' },
  ],
  { cancelable: true },
);

const RecoveryPortalConnectDevice = (props: Props) => {
  return (
    <ContainerWithHeader
      headerProps={{ centerItems: [{ title: 'Connect to Recovery Portal' }] }}
    >
      <ScrollWrapper contentContainerStyle={{ paddingVertical: spacing.large }}>
        <Wrapper flex={1} center regularPadding>
          <Title center>Secure your Wallet</Title>
          <Paragraph small>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
            exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </Paragraph>
          <Button
            block
            title="Connect"
            onPress={() => props.navigation.navigate(RECOVERY_PORTAL_SETUP_COMPLETE)}
            marginTop={50}
            marginBottom={spacing.large}
          />
          <TouchableOpacity onPress={() => cancelPrompt(() => props.navigation.dismiss())}>
            <TextLink>Cancel</TextLink>
          </TouchableOpacity>
        </Wrapper>
      </ScrollWrapper>
    </ContainerWithHeader>
  );
};

export default RecoveryPortalConnectDevice;
