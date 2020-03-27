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
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { ScrollWrapper } from 'components/Layout';
import CheckAuth from 'components/CheckAuth';
import { getBiometryType } from 'utils/settings';
import { CHANGE_PIN_FLOW } from 'constants/navigationConstants';
import { changeUseBiometricsAction } from 'actions/appSettingsActions';
import { resetIncorrectPasswordAction } from 'actions/authActions';
import { getSupportedBiometryType, getKeychainDataObject, type KeyChainData } from 'utils/keychain';

import type { Dispatch, RootReducerState } from 'reducers/rootReducer';

import { SettingsSection } from './SettingsSection';


type State = {
  showPinModal: boolean,
  supportedBiometryType: string,
};

type Props = {
  navigation: NavigationScreenProp<*>,
  useBiometrics: ?boolean,
  changeUseBiometrics: (enabled: boolean, data: KeyChainData) => void,
  resetIncorrectPassword: () => void,
}

class SecuritySettings extends React.Component<Props, State> {
  state = {
    showPinModal: false,
    supportedBiometryType: '',
  }

  componentDidMount() {
    getSupportedBiometryType(biometryType => {
      // returns null, if the device haven't enrolled into fingerprint/FaceId. Even though it has hardware for it
      // and getBiometryType has default string value
      this.setState({ supportedBiometryType: biometryType ? getBiometryType(biometryType) : '' });
    });
  }

  handleChangeUseBiometrics = (enabled: boolean, data: KeyChainData) => {
    const { resetIncorrectPassword, changeUseBiometrics } = this.props;
    this.setState({ showPinModal: false });
    resetIncorrectPassword();
    changeUseBiometrics(enabled, data);
  };

  getGlobalSettings = () => {
    const { navigation, useBiometrics } = this.props;
    const { supportedBiometryType } = this.state;

    return [
      {
        key: 'changePIN',
        title: 'Change PIN',
        onPress: () => navigation.navigate(CHANGE_PIN_FLOW),
      },
      {
        key: 'biometricLogin',
        title: 'Biometric login',
        onPress: this.handleBiometricPress,
        value: useBiometrics,
        toggle: true,
        hidden: !supportedBiometryType,
      },
    ];
  }

  handleBiometricPress = async () => {
    const { useBiometrics } = this.props;
    const keychainData = await getKeychainDataObject();
    if (keychainData) {
      this.handleChangeUseBiometrics(!useBiometrics, keychainData);
    } else {
      this.setState({ showPinModal: true });
    }
  }

  getSmartWalletSettings = () => {
    return [
      {
        key: 'spendingLimits',
        title: 'Spending limits',
        subtitle: 'Secure your funds by restricting larger transactions',
        disabled: true,
        label: 'soon',
      },
    ];
  }

  onPinValid = (pin, { mnemonic, privateKey }) => {
    const { useBiometrics } = this.props;
    this.handleChangeUseBiometrics(!useBiometrics, { mnemonic, privateKey });
  }

  render() {
    const { showPinModal } = this.state;
    return (
      <ContainerWithHeader
        headerProps={{ centerItems: [{ title: 'Security settings' }] }}
        inset={{ bottom: 'never' }}
      >
        <ScrollWrapper>
          <SettingsSection
            sectionTitle="Global"
            sectionItems={this.getGlobalSettings()}
          />
          <SettingsSection
            sectionTitle="Smart wallet"
            sectionItems={this.getSmartWalletSettings()}
          />
        </ScrollWrapper>

        {/* BIOMETRIC LOGIN */}
        <CheckAuth
          onPinValid={this.onPinValid}
          revealMnemonic
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
  appSettings: {
    data: {
      useBiometrics = false,
    },
  },
}: RootReducerState): $Shape<Props> => ({
  useBiometrics,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  changeUseBiometrics: (enabled: boolean, data: KeyChainData) => dispatch(
    changeUseBiometricsAction(enabled, data),
  ),
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(SecuritySettings);
