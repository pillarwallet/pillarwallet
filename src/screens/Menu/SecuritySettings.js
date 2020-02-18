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
import * as Keychain from 'react-native-keychain';
import type { NavigationScreenProp } from 'react-navigation';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { ScrollWrapper, Wrapper } from 'components/Layout';
import CheckPin from 'components/CheckPin';
import SlideModal from 'components/Modals/SlideModal';
import { spacing } from 'utils/variables';
import { getBiometryType } from 'utils/settings';
import { CHANGE_PIN_FLOW } from 'constants/navigationConstants';
import { changeUseBiometricsAction } from 'actions/appSettingsActions';
import { resetIncorrectPasswordAction } from 'actions/authActions';

import type { Dispatch, RootReducerState } from 'reducers/rootReducer';

import { SettingsSection } from './SettingsSection';

type State = {
  visibleModal: ?string,
  supportedBiometryType: string,
  setBiometrics: ?{
    enabled: boolean,
    privateKey?: string,
  },
}

type Props = {
  navigation: NavigationScreenProp<*>,
  useBiometrics: ?boolean,
  changeUseBiometrics: (enabled: boolean, privateKey?: string) => void,
  resetIncorrectPassword: () => void,
}

class SecuritySettings extends React.Component<Props, State> {
  state = {
    visibleModal: null,
    supportedBiometryType: '',
    setBiometrics: null,
  }

  componentDidMount() {
    Keychain.getSupportedBiometryType()
      .then(biometryType => {
        // returns null, if the device haven't enrolled into fingerprint/FaceId. Even though it has hardware for it
        // and getBiometryType has default string value
        this.setState({ supportedBiometryType: biometryType ? getBiometryType(biometryType) : '' });
      })
      .catch(() => null);
  }

  handleChangeUseBiometrics = (enabled: boolean, privateKey?: string) => {
    this.setState({
      visibleModal: null,
      setBiometrics: {
        enabled,
        privateKey,
      },
    });
  };

  handleBiometricsCheckPinModalClose = () => {
    const { resetIncorrectPassword, changeUseBiometrics } = this.props;
    const { setBiometrics } = this.state;
    if (!setBiometrics) return;
    const { enabled, privateKey } = setBiometrics;
    this.setState({ setBiometrics: null });
    resetIncorrectPassword();
    changeUseBiometrics(enabled, privateKey);
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
        onPress: () => this.setState({ visibleModal: 'checkPin' }),
        value: useBiometrics,
        toggle: true,
        hidden: !supportedBiometryType,
      },
    ];
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

  render() {
    const { useBiometrics } = this.props;
    const { visibleModal } = this.state;
    return (
      <ContainerWithHeader
        headerProps={{ centerItems: [{ title: 'Security settings' }] }}
      >
        <ScrollWrapper
          contentContainerStyle={{ paddingHorizontal: spacing.layoutSides }}
        >
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
        <SlideModal
          isVisible={visibleModal === 'checkPin'}
          onModalHidden={this.handleBiometricsCheckPinModalClose}
          title="Enter pincode"
          centerTitle
          fullScreen
          showHeader
          onModalHide={() => this.setState({ visibleModal: null })}
        >
          <Wrapper flex={1}>
            <CheckPin
              onPinValid={
                (pin, { privateKey }) => this.handleChangeUseBiometrics(
                  !useBiometrics, !useBiometrics ? privateKey : undefined,
                )
              }
            />
          </Wrapper>
        </SlideModal>
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
  changeUseBiometrics: (enabled: boolean, privateKey?: string) => dispatch(
    changeUseBiometricsAction(enabled, privateKey),
  ),
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(SecuritySettings);
