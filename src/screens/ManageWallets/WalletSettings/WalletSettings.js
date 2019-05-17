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
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native';

// components
import Header from 'components/Header';
import { Container } from 'components/Layout';
import { Paragraph } from 'components/Typography';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import {
  RECOVERY_AGENTS,
  REVEAL_BACKUP_PHRASE,
  CHOOSE_ASSETS_TO_TRANSFER,
} from 'constants/navigationConstants';
import ProfileSettingsItem from 'screens/Profile/ProfileSettingsItem';
import { spacing } from 'utils/variables';

type Props = {
  navigation: NavigationScreenProp<*>,
}

const ParagraphWrapper = styled.View`
  padding: ${spacing.large}px;
`;

export default class WalletSettings extends React.PureComponent<Props> {
  render() {
    const { navigation } = this.props;
    const selectedWallet = navigation.getParam('wallet', {});
    const isSmartWallet = selectedWallet.type === ACCOUNT_TYPES.SMART_WALLET;

    return (
      <Container inset={{ bottom: 0 }}>
        <Header
          title={isSmartWallet
            ? 'smart.wallet'
            : 'key based wallet'
          }
          onBack={() => navigation.goBack(null)}
        />
        {isSmartWallet &&
        <React.Fragment>
          <ProfileSettingsItem
            key="fundSmartWallet"
            label="Fund Smart Wallet"
            onPress={() => navigation.navigate(CHOOSE_ASSETS_TO_TRANSFER, { options: { isSeparateFund: true } })}
          />
          <ParagraphWrapper>
            <Paragraph light small>
              Transfer funds from your oldschool key based boring wallet to Pillar Smart Wallet and get
              unprecedented control over your funds, extra layer of security more flexible control over spendings,
              ability to recover your wallet with help of trusted people, etc.
            </Paragraph>
          </ParagraphWrapper>
          <ProfileSettingsItem
            key="settupSocialRecovery"
            label="Setup Social Recovery"
            onPress={() => navigation.navigate(RECOVERY_AGENTS,
              { options: { isSeparateRecovery: true } })}
          />
          <ParagraphWrapper>
            <Paragraph light small>
              No more worries about loosing everything. Friends are here to help. Nominate selected contacts to help
              you recover your wallet in case of loss of access to it.
            </Paragraph>
          </ParagraphWrapper>
        </React.Fragment>
        }
        {!isSmartWallet && <ProfileSettingsItem
          key="revealBackupPhrase"
          label="Reveal backup phrase"
          onPress={() => navigation.navigate(REVEAL_BACKUP_PHRASE)}
        />}
      </Container >
    );
  }
}
