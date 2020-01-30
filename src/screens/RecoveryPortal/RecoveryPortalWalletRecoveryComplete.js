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
import type { NavigationScreenProp } from 'react-navigation';

// constants
import { RECOVERY_PORTAL_WALLET_RECOVERY_PENDING } from 'constants/navigationConstants';

// components
import { Wrapper } from 'components/Layout';
import Button from 'components/Button';
import { MediumText, Paragraph } from 'components/Typography';
import Animation from 'components/Animation';

// utils
import { fontStyles, spacing } from 'utils/variables';


type Props = {
  navigation: NavigationScreenProp,
};

const animationSuccess = require('assets/animations/transactionSentConfirmationAnimation.json');

const Title = styled(MediumText)`
  ${fontStyles.large};
  text-align: center;
  margin-bottom: ${spacing.small}px;
`;

const RecoveryPortalWalletRecoveryComplete = (props: Props) => (
  <Wrapper flex={1} center regularPadding>
    <Animation source={animationSuccess} />
    <Title center>Smart Wallet recovered successfully</Title>
    <Paragraph small light center>
      It will be settled in a few moments, depending on your gas price settings and Ethereum network load
    </Paragraph>
    <Button
      block
      title="Magic!"
      onPress={() => props.navigation.navigate(RECOVERY_PORTAL_WALLET_RECOVERY_PENDING)}
      marginTop={50}
    />
  </Wrapper>
);

export default RecoveryPortalWalletRecoveryComplete;
