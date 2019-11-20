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
import { Alert, FlatList } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';

import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { ListCard } from 'components/ListItem/ListCard';
import { REVEAL_BACKUP_PHRASE, BACKUP_WALLET_IN_SETTINGS_FLOW } from 'constants/navigationConstants';
import { checkIfSmartWalletAccount, findAccountById } from 'utils/accounts';
import { baseColors } from 'utils/variables';
import { lockScreenAction, logoutAction } from 'actions/authActions';
import type { Accounts } from 'models/Account';


type Props = {
  navigation: NavigationScreenProp<*>,
  lockScreen: Function,
  logoutUser: Function,
  user: Object,
  accounts: Accounts,
  backupStatus: Object,
}

const smartWalletSettings = [
  {
    key: 'recoveryAgents',
    title: 'Recovery agents',
    body: 'Assign your contacts as recovery agents for restoring the wallet',
    label: 'soon',
    disabled: true,
  },
  {
    key: 'spendingLimits',
    title: 'Spending limits',
    body: 'Secure your funds by restricting too large transactions',
    label: 'soon',
    disabled: true,
  },
];

class WalletSettings extends React.PureComponent<Props> {
  // settings actions
  navigateToBackup = () => {
    const { navigation, backupStatus } = this.props;
    const {
      isImported,
      isBackedUp,
    } = backupStatus;
    const isWalletBackedUp = isImported || isBackedUp;
    if (!isWalletBackedUp) {
      // DO BACKUP
      navigation.navigate(BACKUP_WALLET_IN_SETTINGS_FLOW, { backupViaSettings: true });
    } else {
      navigation.navigate(REVEAL_BACKUP_PHRASE);
    }
  };

  lockWallet = () => {
    const { lockScreen } = this.props;
    lockScreen();
  };

  deleteWallet = () => {
    const { logoutUser } = this.props;
    Alert.alert(
      'Are you sure?',
      'This action will delete the wallet from this device. ' +
      'If you wish to recover, you can re-import that wallet using your backup phrase.',
      [
        { text: 'Cancel' },
        { text: 'Delete', onPress: logoutUser },
      ],
    );
  };

  defaultSettings = () => ([
    {
      key: 'lockWallet',
      title: 'Close and Lock Wallet',
      action: () => this.lockWallet(),
    },
    {
      key: 'deleteWallet',
      title: 'Delete wallet',
      labelColor: baseColors.negative,
      body: 'Wipe all data on this device',
      action: () => this.deleteWallet(),
    },
  ]);

  keyWalletSettings = () => {
    const { backupStatus } = this.props;
    const isBackedUp = backupStatus.isImported || backupStatus.isBackedUp;
    return [
      {
        key: 'backupPhrase',
        title: 'Backup phase',
        body: 'Secure your wallet from loss',
        action: () => this.navigateToBackup(),
        label: isBackedUp ? '' : 'Not finished',
      },
    ];
  };

  renderSettingsItems = ({ item }, isSmartWallet) => {
    const {
      title,
      labelColor,
      body,
      action,
      label,
      disabled,
    } = item;

    const minHeight = isSmartWallet ? 96 : 80;

    return (
      <ListCard
        title={title}
        titleStyle={{ color: labelColor || baseColors.text }}
        subtitle={body}
        action={action}
        label={label}
        contentWrapperStyle={{ minHeight, padding: 16 }}
        disabled={disabled}
      />
    );
  };

  render() {
    const { accounts, navigation, user } = this.props;
    const accountId = navigation.getParam('accountId', '');
    const account = findAccountById(accountId, accounts);
    if (!account) return null;
    const isSmartWallet = checkIfSmartWalletAccount(account);
    const accountType = isSmartWallet ? 'Smart' : 'Legacy';
    const settings = isSmartWallet
      ? [...smartWalletSettings, ...this.defaultSettings()]
      : [...this.keyWalletSettings(), ...this.defaultSettings()];

    return (
      <ContainerWithHeader
        color={baseColors.card}
        headerProps={{ centerItems: [{ title: `${user.username}'s ${accountType} wallet` }] }}
        inset={{ bottom: 'never' }}
      >
        <FlatList
          data={settings}
          keyExtractor={(item) => item.key}
          style={{ width: '100%' }}
          contentContainerStyle={{ width: '100%', padding: 20, paddingBottom: 40 }}
          renderItem={(props) => this.renderSettingsItems(props, isSmartWallet)}
        />
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  user: { data: user },
  wallet: { backupStatus },
  accounts: { data: accounts },
}) => ({
  user,
  backupStatus,
  accounts,
});

const mapDispatchToProps = (dispatch: Function) => ({
  lockScreen: () => dispatch(lockScreenAction()),
  logoutUser: () => dispatch(logoutAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(WalletSettings);
