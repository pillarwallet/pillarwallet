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
import { createStructuredSelector } from 'reselect';
import type { NavigationScreenProp } from 'react-navigation';
import t from 'translations/translate';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { ScrollWrapper } from 'components/Layout';
import CheckAuth from 'components/CheckAuth';

// utils
import { getThemeColors } from 'utils/themes';

// constants
import {
  BACKUP_WALLET_IN_SETTINGS_FLOW,
  MANAGE_CONNECTED_DEVICES,
  RECOVERY_PORTAL_SETUP_INTRO,
  RECOVERY_PORTAL_SETUP_SIGN_UP,
  REVEAL_BACKUP_PHRASE,
} from 'constants/navigationConstants';

// actions
import { resetIncorrectPasswordAction } from 'actions/authActions';

// selectors
import { isSmartWalletActivatedSelector } from 'selectors/smartWallet';

// types
import type { RootReducerState, Dispatch } from 'reducers/rootReducer';
import type { BackupStatus } from 'reducers/walletReducer';
import type { Theme } from 'models/Theme';
import type { EthereumWallet } from 'models/Wallet';

// local
import { SettingsSection } from './SettingsSection';


type Props = {
  navigation: NavigationScreenProp<*>,
  backupStatus: BackupStatus,
  theme: Theme,
  resetIncorrectPassword: () => void,
  isSmartWalletActivated: boolean,
  hasSeenRecoveryPortalIntro?: boolean,
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
    const { navigation, isSmartWalletActivated, hasSeenRecoveryPortalIntro } = this.props;
    const recoveryPortalSubtitle = isSmartWalletActivated
      ? t('settingsContent.settingsItem.recoveryPortal.subtitle.default')
      : t('settingsContent.settingsItem.recoveryPortal.subtitle.smartWalletNotActivated');

    const recoveryPortalNavigationPath = hasSeenRecoveryPortalIntro
      ? RECOVERY_PORTAL_SETUP_SIGN_UP
      : RECOVERY_PORTAL_SETUP_INTRO;
    return [
      {
        key: 'linkedDevices',
        title: t('settingsContent.settingsItem.linkedDevices.title'),
        subtitle: t('settingsContent.settingsItem.linkedDevices.subtitle'),
        onPress: () => navigation.navigate(MANAGE_CONNECTED_DEVICES),
      },
      {
        key: 'recoveryPortal',
        title: t('settingsContent.settingsItem.recoveryPortal.title'),
        subtitle: recoveryPortalSubtitle,
        disabled: !isSmartWalletActivated,
        onPress: () => isSmartWalletActivated && navigation.navigate(recoveryPortalNavigationPath),
      },
    ];
  };

  getKeyWalletSection = () => {
    const { backupStatus, theme, navigation } = this.props;
    const { wallet } = this.state;
    const isBackedUp = backupStatus.isImported || backupStatus.isBackedUp;
    const colors = getThemeColors(theme);
    return [
      {
        key: 'view12Words',
        title: t('settingsContent.settingsItem.backupPhrase.title'),
        onPress: () => navigation.navigate(REVEAL_BACKUP_PHRASE, { wallet }),
        hidden: !isBackedUp || !wallet.mnemonic,
      },
      {
        key: 'viewPrivateKey',
        title: t('settingsContent.settingsItem.backupPhrase.title'),
        onPress: () => navigation.navigate(REVEAL_BACKUP_PHRASE, { showPrivateKey: true, wallet }),
        hidden: !isBackedUp || !!wallet.mnemonic,
      },
      {
        key: 'backupNotFinished',
        title: t('settingsContent.settingsItem.backup.title'),
        labelBadge: {
          color: colors.negative,
          label: t('settingsContent.settingsItem.backup.label.notFinished'),
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
        headerProps={{ centerItems: [{ title: t('settingsContent.settingsItem.recoverySettings.screenTitle') }] }}
        inset={{ bottom: 'never' }}
      >
        <ScrollWrapper>
          <SettingsSection
            sectionTitle={t('settingsContent.settingsItem.recoverySettings.label.globalSettings')}
            sectionItems={this.getGlobalSection()}
          />
          <SettingsSection
            sectionTitle={t('settingsContent.settingsItem.recoverySettings.label.keyWalletSettings')}
            sectionItems={this.getKeyWalletSection()}
          />
        </ScrollWrapper>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  wallet: { backupStatus },
  appSettings: { data: { hasSeenRecoveryPortalIntro } },
}: RootReducerState): $Shape<Props> => ({
  backupStatus,
  hasSeenRecoveryPortalIntro,
});

const structuredSelector = createStructuredSelector({
  isSmartWalletActivated: isSmartWalletActivatedSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
});

export default withTheme(connect(combinedMapStateToProps, mapDispatchToProps)(RecoverySettings));

