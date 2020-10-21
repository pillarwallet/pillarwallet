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
import type { NavigationScreenProp } from 'react-navigation';
import { Platform, Linking } from 'react-native';
import * as Keychain from 'react-native-keychain';
import { PERMISSIONS, request as requestPermission, RESULTS } from 'react-native-permissions';
import { createStructuredSelector } from 'reselect';
import t from 'translations/translate';

// actions
import { changeUseBiometricsAction, toggleOmitPinOnLoginAction } from 'actions/appSettingsActions';
import { resetIncorrectPasswordAction } from 'actions/authActions';

// constants
import {
  BACKUP_WALLET_IN_SETTINGS_FLOW,
  CHANGE_PIN_FLOW, MANAGE_CONNECTED_DEVICES, RECOVERY_PORTAL_SETUP_INTRO,
  RECOVERY_PORTAL_SETUP_SIGN_UP,
  REVEAL_BACKUP_PHRASE,
} from 'constants/navigationConstants';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { ScrollWrapper } from 'components/Layout';
import CheckAuth from 'components/CheckAuth';
import Toast from 'components/Toast';

// utils
import { getSupportedBiometryType, getKeychainDataObject, type KeyChainData } from 'utils/keychain';
import { getThemeColors } from 'utils/themes';

// types
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { BackupStatus } from 'reducers/walletReducer';
import type { Theme } from 'models/Theme';

// selectors
import { isSmartWalletActivatedSelector } from 'selectors/smartWallet';

// relative
import { SettingsSection } from './SettingsSection';


type WalletObject = {
  mnemonic: ?string,
  privateKey: ?string,
};

type State = {
  showPinModal: boolean,
  supportedBiometryType: ?string,
  pin: ?string,
  wallet: ?WalletObject
};

type Props = {
  navigation: NavigationScreenProp<*>,
  useBiometrics: ?boolean,
  changeUseBiometrics: (enabled: boolean, data: KeyChainData) => void,
  resetIncorrectPassword: () => void,
  toggleOmitPinOnLogin: () => void,
  omitPinOnLogin?: boolean,
  backupStatus: BackupStatus,
  isSmartWalletActivated: boolean,
  hasSeenRecoveryPortalIntro: boolean,
  theme: Theme,
};

const showFaceIDFailedMessage = () => {
  Toast.show({
    message: t('toast.failedToGetFaceIDPermission'),
    emoji: 'pensive',
    supportLink: true,
    link: t('label.faceIDSettings'),
    onLinkPress: () => Linking.openURL('app-settings:'),
    autoClose: true,
  });
};

class WalletSettings extends React.Component<Props, State> {
  state = {
    supportedBiometryType: null,
    wallet: null,
    pin: null,
    showPinModal: false,
  };

  componentDidMount() {
    getSupportedBiometryType((supportedBiometryType) => {
      // returns null, if the device haven't enrolled into fingerprint/FaceId. Even though it has hardware for it
      // and getBiometryType has default string value
      this.setState({ supportedBiometryType });
    });
    this.retrieveWalletObject();
  }

  retrieveWalletObject = async () => {
    const { useBiometrics, resetIncorrectPassword } = this.props;
    resetIncorrectPassword();
    if (!useBiometrics) {
      this.setState({ showPinModal: true });
    } else {
      const keychainData = await getKeychainDataObject();
      if (keychainData) {
        const { pin, ...restWalletInfo } = keychainData;
        this.setState({ wallet: restWalletInfo, pin });
      } else {
        this.setState({ showPinModal: true });
      }
    }
  }

  getGlobalSettings = () => {
    const {
      navigation,
      useBiometrics,
      omitPinOnLogin,
      toggleOmitPinOnLogin,
      isSmartWalletActivated,
      hasSeenRecoveryPortalIntro,
    } = this.props;
    const { supportedBiometryType } = this.state;

    const recoveryPortalSubtitle = isSmartWalletActivated
      ? t('settingsContent.settingsItem.recoveryPortal.subtitle.default')
      : t('settingsContent.settingsItem.recoveryPortal.subtitle.smartWalletNotActivated');

    const recoveryPortalNavigationPath = hasSeenRecoveryPortalIntro
      ? RECOVERY_PORTAL_SETUP_SIGN_UP
      : RECOVERY_PORTAL_SETUP_INTRO;

    return [
      {
        key: 'changePIN',
        title: t('settingsContent.settingsItem.changePIN.title'),
        onPress: () => navigation.navigate(CHANGE_PIN_FLOW),
      },
      {
        key: 'biometricLogin',
        title: t('settingsContent.settingsItem.biometricLogin.title'),
        onPress: this.handleBiometricPress,
        value: useBiometrics,
        toggle: true,
        hidden: !supportedBiometryType,
      },
      {
        key: 'requirePINonLogin',
        title: t('settingsContent.settingsItem.requirePinOnLogin.title'),
        onPress: toggleOmitPinOnLogin,
        value: !omitPinOnLogin,
        toggle: true,
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

  handleBiometricPress = async () => {
    const { useBiometrics, changeUseBiometrics } = this.props;
    const { wallet, pin, supportedBiometryType } = this.state;
    if (!pin) return;

    // ask for permission if it's iOS FaceID, otherwise – no permission needed
    if (!useBiometrics
      && Platform.OS === 'ios'
      && supportedBiometryType === Keychain.BIOMETRY_TYPE.FACE_ID) {
      requestPermission(PERMISSIONS.IOS.FACE_ID)
        .then((status) => {
          if (status === RESULTS.GRANTED) {
            changeUseBiometrics(!useBiometrics, { ...wallet, pin });
            return;
          }
          showFaceIDFailedMessage();
        })
        .catch(() => showFaceIDFailedMessage());
      return;
    }

    changeUseBiometrics(!useBiometrics, { ...wallet, pin });
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
        hidden: !isBackedUp || !wallet?.mnemonic,
      },
      {
        key: 'viewPrivateKey',
        title: t('settingsContent.settingsItem.backupPhrase.title'),
        onPress: () => navigation.navigate(REVEAL_BACKUP_PHRASE, { showPrivateKey: true, wallet }),
        hidden: !isBackedUp || !!wallet?.mnemonic,
      },
      {
        key: 'backupNotFinished',
        title: t('settingsContent.settingsItem.backup.title'),
        labelBadge: {
          color: colors.negative,
          label: t('settingsContent.settingsItem.backup.label.notFinished'),
        },
        onPress: () => navigation.navigate(BACKUP_WALLET_IN_SETTINGS_FLOW, {
          mnemonicPhrase: wallet?.mnemonic,
        }),
        hidden: isBackedUp,
      },
    ];
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

  onPinValid = (pin, { mnemonic, privateKey }) => {
    this.setState({ pin, wallet: { mnemonic: mnemonic?.phrase, privateKey }, showPinModal: false });
  };

  render() {
    const { wallet, showPinModal } = this.state;
    const { navigation } = this.props;

    if (!wallet) {
      if (showPinModal) {
        return (
          <CheckAuth
            onPinValid={this.onPinValid}
            revealMnemonic
            enforcePin
            modalProps={{
              isVisible: true,
              onModalHide: () => {
                if (!wallet) navigation.goBack();
              },
            }}
          />
        );
      }
      return null;
    }

    return (
      <ContainerWithHeader
        headerProps={{ centerItems: [{ title: t('settingsContent.settingsItem.walletSettings.screenTitle') }] }}
        inset={{ bottom: 'never' }}
      >
        <ScrollWrapper>
          <SettingsSection
            sectionTitle={t('settingsContent.settingsItem.recoverySettings.label.globalSettings')}
            sectionItems={this.getGlobalSettings()}
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
  appSettings: { data: { useBiometrics, omitPinOnLogin, hasSeenRecoveryPortalIntro } },
  wallet: { backupStatus },
}: RootReducerState): $Shape<Props> => ({
  useBiometrics,
  omitPinOnLogin,
  hasSeenRecoveryPortalIntro,
  backupStatus,
});

const structuredSelector = createStructuredSelector({
  isSmartWalletActivated: isSmartWalletActivatedSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  changeUseBiometrics: (enabled: boolean, data: KeyChainData) => dispatch(
    changeUseBiometricsAction(enabled, data),
  ),
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
  toggleOmitPinOnLogin: () => dispatch(toggleOmitPinOnLoginAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(WalletSettings);
