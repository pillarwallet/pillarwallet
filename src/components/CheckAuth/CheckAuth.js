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
import { AppState } from 'react-native';
import styled from 'styled-components/native';
import { connect } from 'react-redux';
import get from 'lodash.get';
import t from 'translations/translate';

import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import { DECRYPTING, INVALID_PASSWORD } from 'constants/walletConstants';
import { checkAuthAction } from 'actions/authActions';
import { Container, Wrapper } from 'components/Layout';
import Loader from 'components/Loader';
import ErrorMessage from 'components/ErrorMessage';
import PinCode from 'components/PinCode';
import { addAppStateChangeListener, removeAppStateChangeListener } from 'utils/common';
import { getKeychainDataObject } from 'utils/keychain';
import { constructWalletFromMnemonic } from 'utils/wallet';
import SlideModal from 'components/Modals/SlideModal/SlideModal-old';
import Header from 'components/Header';
import type { EthereumWallet } from 'models/Wallet';


type HeaderProps = {
  title?: String,
  centerTitle?: boolean,
  onClose?: Function,
  onBack?: Function,
};

type ModalProps = {
  onModalHide: Function,
  onModalHidden?: Function,
  title?: string,
  centerTitle?: boolean,
  fullScreen?: boolean,
  showHeader?: boolean,
  isVisible?: boolean,
};

type ValidPinCallback = (pin: string, wallet: EthereumWallet) => Promise<void>;

type Props = {
  checkPin: (pin: string, onValidPin: Function, options: Object) => void,
  checkPrivateKey: (privateKey: string, onValidPin: Function) => void,
  wallet: Object,
  revealMnemonic: boolean,
  onPinValid: ValidPinCallback,
  isChecking: boolean,
  title?: string,
  useBiometrics: ?boolean,
  enforcePin?: boolean,
  modalProps?: ModalProps,
  headerProps?: HeaderProps,
  errorMessage?: string,
  hideLoader?: boolean,
  customCheckingMessage?: string,
};

type State = {
  biometricsShown: boolean,
  lastAppState: string,
  showPin: boolean,
};


const CheckAuthWrapper = styled(Container)`
  margin-top: auto;
  height: 100%;
  flex: 1;
`;

const ACTIVE_APP_STATE = 'active';
const BACKGROUND_APP_STATE = 'background';

class CheckAuth extends React.Component<Props, State> {
  static defaultProps = {
    revealMnemonic: false,
  };
  state = {
    biometricsShown: false,
    lastAppState: AppState.currentState,
    showPin: false,
  };

  _isMounted: boolean = false;

  componentDidMount() {
    addAppStateChangeListener(this.handleAppStateChange);
    const {
      useBiometrics, revealMnemonic, enforcePin, modalProps,
    } = this.props;
    const { lastAppState } = this.state;

    this._isMounted = true;

    // do nothing if auth isn't supposed to be checked
    if (modalProps && !get(modalProps, 'isVisible')) return;

    if (useBiometrics
      && !revealMnemonic
      && lastAppState !== BACKGROUND_APP_STATE
    ) {
      this.showBiometricLogin();
    } else if (lastAppState !== BACKGROUND_APP_STATE && !enforcePin) {
      this.checkPrivateKey();
    }
  }

  componentWillUnmount() { this._isMounted = false; }

  // special case for modals
  componentDidUpdate(prevProps: Props) {
    const { modalProps } = this.props;

    if (!modalProps || !prevProps.modalProps) return;
    if (modalProps.isVisible && !prevProps.modalProps.isVisible) {
      this.checkPrivateKey();
    }
  }

  hideModal = (modalProps?: ModalProps) => {
    if (!modalProps || !modalProps.isVisible) return;

    if (modalProps.onModalHide) {
      modalProps.onModalHide();
    }

    if (modalProps.onModalHidden) {
      modalProps.onModalHidden();
    }
  };

  checkPrivateKey = async (errorHandler?: Function) => {
    const {
      onPinValid, checkPrivateKey, modalProps, revealMnemonic, enforcePin,
    } = this.props;
    if (enforcePin) {
      this.setState({ showPin: true });
    } else {
      const keychainData = await getKeychainDataObject(errorHandler);
      if (keychainData) {
        const { privateKey, mnemonic } = keychainData;
        removeAppStateChangeListener(this.handleAppStateChange);
        checkPrivateKey(
          privateKey,
          (_, wallet) => onPinValid(_, (revealMnemonic && mnemonic) ? constructWalletFromMnemonic(mnemonic) : wallet),
        );
        this.hideModal(modalProps);
      } else {
        if (errorHandler) errorHandler();
        this.setState({ showPin: true });
      }
    }
  };

  handleAppStateChange = (nextAppState: string) => {
    const { useBiometrics, revealMnemonic } = this.props;
    const { lastAppState } = this.state;
    if (nextAppState === ACTIVE_APP_STATE
      && lastAppState === BACKGROUND_APP_STATE
      && !revealMnemonic) {
      if (useBiometrics) {
        this.showBiometricLogin();
      } else {
        this.checkPrivateKey();
      }
    }
    if (this._isMounted) this.setState({ lastAppState: nextAppState });
  };

  showBiometricLogin() {
    const { biometricsShown } = this.state;
    if (biometricsShown) return;
    this.setState({ biometricsShown: true }, () => {
      this.checkPrivateKey(() => this.setState({ biometricsShown: false }));
      this.setState({ biometricsShown: false });
    });
  }

  handlePinSubmit = (pin: string) => {
    const { checkPin, revealMnemonic } = this.props;
    checkPin(pin, this.onPinValidSuccess, revealMnemonic);
  };

  onPinValidSuccess = (pin: string, wallet: EthereumWallet) => {
    const { onPinValid } = this.props;
    onPinValid(pin, wallet);
    if (this._isMounted) this.setState({ showPin: false });
  };

  getPinError = (walletState: string) => {
    switch (walletState) {
      case INVALID_PASSWORD:
        return t('auth:error.invalidPin.default');
      default:
        return null;
    }
  };

  renderSlideModalWithPin = () => {
    const { modalProps } = this.props;
    if (!modalProps) return null;
    const {
      title = t('auth:enterPincode'),
      centerTitle = true,
      fullScreen = true,
      showHeader = true,
      onModalHidden,
      onModalHide,
      isVisible,
    } = modalProps;
    return (
      <SlideModal
        {...modalProps}
        title={title}
        centerTitle={centerTitle}
        fullScreen={fullScreen}
        showHeader={showHeader}
        onModalHidden={onModalHidden}
        onModalHide={onModalHide}
        isVisible={isVisible}
      >
        <Wrapper flex={1}>
          {this.renderPinCode()}
        </Wrapper>
      </SlideModal>
    );
  };

  renderWrappedPin = () => {
    const { headerProps, errorMessage } = this.props;
    if (!headerProps) return null;
    const { title = t('auth:enterPincode'), centerTitle = true } = headerProps;
    return (
      <Container>
        <Header {...headerProps} title={title} centerTitle={centerTitle} />
        {!!errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
        {this.renderPinCode()}
      </Container>
    );
  };

  renderPinCode = () => {
    const { wallet: { walletState } } = this.props;
    const pinError = this.getPinError(walletState);
    return (
      <CheckAuthWrapper>
        {!!pinError && <ErrorMessage>{pinError}</ErrorMessage>}
        <PinCode
          onPinEntered={this.handlePinSubmit}
          showForgotButton={false}
          pinError={!!pinError}
        />
      </CheckAuthWrapper>
    );
  };

  render() {
    const {
      wallet: { walletState },
      isChecking,
      enforcePin,
      modalProps,
      headerProps,
      hideLoader,
      customCheckingMessage,
    } = this.props;
    const { showPin } = this.state;

    if (!hideLoader && (walletState === DECRYPTING || isChecking)) {
      return (
        <Container style={{ flex: 1, width: '100%' }} center>
          <Loader messages={[customCheckingMessage || t('auth:checking', { capitalize: true })]} />
        </Container>
      );
    }

    if (enforcePin || showPin) {
      if (modalProps) return this.renderSlideModalWithPin();
      if (headerProps) return this.renderWrappedPin();
      return null;
    }
    return null;
  }
}

const mapStateToProps = ({
  wallet,
  appSettings: { data: { useBiometrics } },
}: RootReducerState): $Shape<Props> => ({
  wallet,
  useBiometrics,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  checkPin: (pin: string, onValidPin: ValidPinCallback, withMnemonic: boolean) => {
    dispatch(checkAuthAction(pin, null, onValidPin, withMnemonic));
  },
  checkPrivateKey: (privateKey: string, onValidPin: ValidPinCallback) => {
    dispatch(checkAuthAction(null, privateKey, onValidPin));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(CheckAuth);
