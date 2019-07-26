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
import {
  RECOVERY_AGENTS,
  REVEAL_BACKUP_PHRASE,
  CHOOSE_ASSETS_TO_TRANSFER, BACKUP_WALLET_IN_SETTINGS_FLOW,
} from 'constants/navigationConstants';
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
    title: 'Lock wallet',
    body: 'Extra security measure',
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

const smartWalletSettings = (that) => {
  const recoveryAgentsCount = 0;
  return [
    {
      key: 'recoveryAgents',
      title: 'Recovery agents',
      body: 'Assign your contacts as recovery agents for restoring the wallet',
      action: () => that.manageRecoveryAgents(),
      label: `${recoveryAgentsCount} out of 5`,
    },
    {
      key: 'topUp',
      title: 'Top up Smart Wallet',
      body: 'Assign your contacts as recovery agents for restoring the wallet',
      action: () => that.topUpSmartWallet(),
    },
    {
      key: 'spendingLimits',
      title: 'Spending limits',
      body: 'Secure your funds by restricting too large transactions',
      action: () => that.manageSpendingLimits(),
      label: '$1,000/month',
    },
  ];
};

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

  manageRecoveryAgents = () => {
    const { navigation } = this.props;
    navigation.navigate(RECOVERY_AGENTS, { options: { isSeparateRecovery: true } });
  };

  topUpSmartWallet = () => {
    const { navigation } = this.props;
    navigation.navigate(CHOOSE_ASSETS_TO_TRANSFER, { options: { isSeparateFund: true } });
  };

  manageSpendingLimits = () => {
    // TODO
  };

  renderSettingsItems = ({ item }, isSmartWallet) => {
    const {
      title,
      labelColor,
      body,
      action,
      label,
    } = item;

    return (
      <ListCard
        title={title}
        titleStyle={{ color: labelColor || baseColors.slateBlack }}
        subtitle={body}
        action={action}
        label={label}
        contentWrapperStyle={isSmartWallet ? { minHeight: 86, padding: 16 } : { padding: 16 }}
      />
    );
  };

  render() {
    const { navigation, user } = this.props;
    const selectedWallet = navigation.getParam('wallet', {});
    const isSmartWallet = selectedWallet.type === ACCOUNT_TYPES.SMART_WALLET;
    const walletType = isSmartWallet ? 'Smart' : 'Key';
    const settings = isSmartWallet
      ? [...smartWalletSettings(this), ...defaultSettings(this)]
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
