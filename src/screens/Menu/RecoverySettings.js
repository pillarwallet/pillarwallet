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
import { connect } from 'react-redux';
import { withTheme } from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { ScrollWrapper } from 'components/Layout';
import CheckAuth from 'components/CheckAuth';
import { getThemeColors } from 'utils/themes';
import {
  BACKUP_WALLET_IN_SETTINGS_FLOW,
  MANAGE_CONNECTED_DEVICES,
  RECOVERY_PORTAL_SETUP_INTRO,
  RECOVERY_PORTAL_WALLET_RECOVERY_INTRO,
  REVEAL_BACKUP_PHRASE,
} from 'constants/navigationConstants';
import { resetIncorrectPasswordAction } from 'actions/authActions';

import type { RootReducerState, Dispatch } from 'reducers/rootReducer';
import type { BackupStatus } from 'reducers/walletReducer';
import type { Theme } from 'models/Theme';
import type { EthereumWallet } from 'models/Wallet';

import { SettingsSection } from './SettingsSection';


type Props = {
  navigation: NavigationScreenProp<*>,
  backupStatus: BackupStatus,
  theme: Theme,
  resetIncorrectPassword: () => void,
};

type State = {
  pinIsValid: boolean,
  wallet: Object,
};

class RecoverySettings extends React.Component<Props, State> {
  state = {
    pinIsValid: false,
    wallet: {},
  };

  getGlobalSection = () => {
    const { navigation } = this.props;
    return [
      {
        key: 'linkedDevices',
        title: 'Linked devices',
        subtitle: 'Manage Smart Wallet account devices',
        onPress: () => navigation.navigate(MANAGE_CONNECTED_DEVICES),
        label: '(Not Set))',
      },
      {
        key: 'linkedDevices',
        title: 'Recovery Portal',
        subtitle: 'Smart Wallet accont web recovery portal',
        onPress: () => navigation.navigate(RECOVERY_PORTAL_SETUP_INTRO),
      },
    ];
  }

  getKeyWalletSection = () => {
    const { backupStatus, theme, navigation } = this.props;
    const { wallet } = this.state;
    const isBackedUp = backupStatus.isImported || backupStatus.isBackedUp;
    const colors = getThemeColors(theme);
    return [
      {
        key: 'view12Words',
        title: 'View 12 words',
        onPress: () => navigation.navigate(REVEAL_BACKUP_PHRASE, { wallet }),
        hidden: !isBackedUp || !wallet.mnemonic,
      },
      {
        key: 'viewPrivateKey',
        title: 'View private key',
        onPress: () => navigation.navigate(REVEAL_BACKUP_PHRASE, { showPrivateKey: true, wallet }),
        hidden: !isBackedUp || !!wallet.mnemonic,
      },
      {
        key: 'backupNotFinished',
        title: 'Backup not finished',
        labelBadge: {
          color: colors.negative,
          label: 'Warning',
        },
        onPress: () => navigation.navigate(BACKUP_WALLET_IN_SETTINGS_FLOW, { backupViaSettings: true }),
        hidden: isBackedUp,
      },
    ];
  };

  onPinValid = (pin: string, wallet: EthereumWallet) => {
    this.setState({ pinIsValid: true, wallet });
  };

  handleScreenDismissal = () => {
    this.props.resetIncorrectPassword();
    this.props.navigation.goBack(null);
  };

  render() {
    const { pinIsValid } = this.state;
    if (!pinIsValid) {
      return (
        <CheckAuth
          revealMnemonic
          onPinValid={this.onPinValid}
          enforcePin
          headerProps={{ onClose: this.handleScreenDismissal }}
        />
      );
    }

    return (
      <ContainerWithHeader
        headerProps={{ centerItems: [{ title: 'Recovery' }] }}
        inset={{ bottom: 'never' }}
      >
        <ScrollWrapper>
          <SettingsSection
            sectionTitle="Global"
            sectionItems={this.getGlobalSection()}
          />
          <SettingsSection
            sectionTitle="Key wallet"
            sectionItems={this.getKeyWalletSection()}
          />
        </ScrollWrapper>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  wallet: { backupStatus },
}: RootReducerState): $Shape<Props> => ({
  backupStatus,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
});

export default withTheme(connect(mapStateToProps, mapDispatchToProps)(RecoverySettings));

