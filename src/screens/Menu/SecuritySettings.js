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
import t from 'translations/translate';

// actions
import { changeUseBiometricsAction, toggleOmitPinOnLoginAction } from 'actions/appSettingsActions';
import { resetIncorrectPasswordAction } from 'actions/authActions';

// constants
import { CHANGE_PIN_FLOW } from 'constants/navigationConstants';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { ScrollWrapper } from 'components/Layout';
import CheckAuth from 'components/CheckAuth';
import Toast from 'components/Toast';

// utils
import { getSupportedBiometryType, getKeychainDataObject, type KeyChainData } from 'utils/keychain';

// types
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';

// relative
import { SettingsSection } from './SettingsSection';


type State = {
  showPinModal: boolean,
  supportedBiometryType: ?string,
};

type Props = {
  navigation: NavigationScreenProp<*>,
  useBiometrics: ?boolean,
  changeUseBiometrics: (enabled: boolean, data: KeyChainData) => void,
  resetIncorrectPassword: () => void,
  toggleOmitPinOnLogin: () => void,
  omitPinOnLogin?: boolean,
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

class SecuritySettings extends React.Component<Props, State> {
  state = {
    showPinModal: false,
    supportedBiometryType: null,
  };

  componentDidMount() {
    getSupportedBiometryType((supportedBiometryType) => {
      // returns null, if the device haven't enrolled into fingerprint/FaceId. Even though it has hardware for it
      // and getBiometryType has default string value
      this.setState({ supportedBiometryType });
    });
  }

  handleChangeUseBiometrics = (enabled: boolean, data: KeyChainData) => {
    const { showPinModal, supportedBiometryType } = this.state;
    const { resetIncorrectPassword, changeUseBiometrics } = this.props;

    if (showPinModal) this.setState({ showPinModal: false });

    resetIncorrectPassword();

    // as for permission if it's iOS FaceID, otherwise – no permission needed
    if (enabled
      && Platform.OS === 'ios'
      && supportedBiometryType === Keychain.BIOMETRY_TYPE.FACE_ID) {
      requestPermission(PERMISSIONS.IOS.FACE_ID)
        .then((status) => {
          if (status === RESULTS.GRANTED) {
            changeUseBiometrics(enabled, data);
            return;
          }
          showFaceIDFailedMessage();
        })
        .catch(() => showFaceIDFailedMessage());
      return;
    }

    changeUseBiometrics(enabled, data);
  };

  getGlobalSettings = () => {
    const {
      navigation, useBiometrics, omitPinOnLogin, toggleOmitPinOnLogin,
    } = this.props;
    const { supportedBiometryType } = this.state;

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
    ];
  };

  handleBiometricPress = async () => {
    const { useBiometrics } = this.props;
    if (!useBiometrics) {
      this.setState({ showPinModal: true });
    } else {
      const keychainData = await getKeychainDataObject();
      if (keychainData) {
        this.handleChangeUseBiometrics(!useBiometrics, keychainData);
      } else {
        this.setState({ showPinModal: true });
      }
    }
  };

  getSmartWalletSettings = () => {
    return [
      {
        key: 'spendingLimits',
        title: t('settingsContent.settingsItem.spendingLimits.title'),
        subtitle: t('settingsContent.settingsItem.spendingLimits.title'),
        disabled: true,
        label: t('settingsContent.settingsItem.spendingLimits.label.notAvailableYet'),
      },
    ];
  };

  onPinValid = (pin, { mnemonic, privateKey }) => {
    const { useBiometrics } = this.props;
    this.handleChangeUseBiometrics(!useBiometrics, { mnemonic, privateKey, pin });
  };

  render() {
    const { showPinModal } = this.state;
    return (
      <ContainerWithHeader
        headerProps={{ centerItems: [{ title: t('settingsContent.settingsItem.securitySettings.screenTitle') }] }}
        inset={{ bottom: 'never' }}
      >
        <ScrollWrapper>
          <SettingsSection
            sectionTitle={t('settingsContent.settingsItem.securitySettings.label.globalSettings')}
            sectionItems={this.getGlobalSettings()}
          />
          <SettingsSection
            sectionTitle={t('settingsContent.settingsItem.securitySettings.label.smartWalletSettings')}
            sectionItems={this.getSmartWalletSettings()}
          />
        </ScrollWrapper>

        {/* BIOMETRIC LOGIN */}
        <CheckAuth
          onPinValid={this.onPinValid}
          revealMnemonic
          enforcePin
          hideLoader
          modalProps={{
            isVisible: showPinModal,
            onModalHide: () => this.setState({ showPinModal: false }),
          }}
        />
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  appSettings: { data: { useBiometrics, omitPinOnLogin } },
}: RootReducerState): $Shape<Props> => ({
  useBiometrics,
  omitPinOnLogin,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  changeUseBiometrics: (enabled: boolean, data: KeyChainData) => dispatch(
    changeUseBiometricsAction(enabled, data),
  ),
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
  toggleOmitPinOnLogin: () => dispatch(toggleOmitPinOnLoginAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(SecuritySettings);
