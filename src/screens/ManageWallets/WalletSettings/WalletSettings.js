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

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import { REVEAL_BACKUP_PHRASE, BACKUP_WALLET_IN_SETTINGS_FLOW } from 'constants/navigationConstants';
import { ListCard } from 'components/ListItem/ListCard';
import { baseColors } from 'utils/variables';
import { lockScreenAction, logoutAction } from 'actions/authActions';

type Props = {
  navigation: NavigationScreenProp<*>,
  lockScreen: Function,
  logoutUser: Function,
  user: Object,
  backupStatus: Object,
}

const defaultSettings = (that) => ([
  {
    key: 'lockWallet',
    title: 'Close and Lock Wallet',
    action: () => that.lockWallet(),
  },
  {
    key: 'deleteWallet',
    title: 'Delete wallet',
    labelColor: baseColors.redDamask,
    body: 'Wipe all data on this device',
    action: () => that.deleteWallet(),
  },
]);

const keyWalletSettings = (that) => {
  const { backupStatus } = that.props;
  const isBackedUp = backupStatus.isImported || backupStatus.isBackedUp;
  return [
    {
      key: 'backupPhrase',
      title: 'Backup phase',
      body: 'Secure your wallet from loss',
      action: () => that.navigateToBackup(),
      label: isBackedUp ? '' : 'Not finished',
    },
  ];
};

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

  renderSettingsItems = ({ item }, isSmartWallet) => {
    const {
      title,
      labelColor,
      body,
      action,
      label,
      disabled,
    } = item;

    return (
      <ListCard
        title={title}
        titleStyle={{ color: labelColor || baseColors.slateBlack }}
        subtitle={body}
        action={action}
        label={label}
        contentWrapperStyle={isSmartWallet ? { minHeight: 96, padding: 16 } : { padding: 16 }}
        disabled={disabled}
      />
    );
  };

  render() {
    const { navigation, user } = this.props;
    const selectedWallet = navigation.getParam('wallet', {});
    const isSmartWallet = selectedWallet.type === ACCOUNT_TYPES.SMART_WALLET;
    const walletType = isSmartWallet ? 'Smart' : 'Key';
    const settings = isSmartWallet
      ? [...smartWalletSettings, ...defaultSettings(this)]
      : [...keyWalletSettings(this), ...defaultSettings(this)];

    return (
      <ContainerWithHeader
        color={baseColors.white}
        headerProps={{
          centerItems: [
            { userIcon: true },
            { title: `${user.username}'s ${walletType} wallet` },
          ],
        }}
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
}) => ({
  user,
  backupStatus,
});

const mapDispatchToProps = (dispatch: Function) => ({
  lockScreen: () => dispatch(lockScreenAction()),
  logoutUser: () => dispatch(logoutAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(WalletSettings);
