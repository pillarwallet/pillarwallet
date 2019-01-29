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
import styled from 'styled-components/native';
import { connect } from 'react-redux';
import { DECRYPTING, INVALID_PASSWORD } from 'constants/walletConstants';
import { checkPinAction } from 'actions/authActions';
import { Container, Wrapper } from 'components/Layout';
import { BaseText } from 'components/Typography';
import Spinner from 'components/Spinner';
import ErrorMessage from 'components/ErrorMessage';
import PinCode from 'components/PinCode';

type Props = {
  checkPin: (pin: string, onValidPin: Function, options: Object) => Function,
  wallet: Object,
  revealMnemonic: boolean,
  onPinValid: Function,
  isChecking: boolean,
  title?: string,
}

const CheckPinWrapper = styled(Wrapper)`
  margin-top: auto;
  height: 100%;
  flex: 1;
`;

class CheckPin extends React.Component<Props, *> {
  static defaultProps = {
    revealMnemonic: false,
  };

  handlePinSubmit = (pin: string) => {
    const {
      checkPin,
      onPinValid,
      revealMnemonic,
    } = this.props;
    const options = {
      mnemonic: revealMnemonic,
    };
    checkPin(pin, onPinValid, options);
  };

  getPinError = (walletState: string) => {
    switch (walletState) {
      case INVALID_PASSWORD:
        return 'Invalid pincode';
      default:
        return null;
    }
  };

  render() {
    const { wallet: { walletState }, isChecking } = this.props;
    const pinError = this.getPinError(walletState);
    const showError = pinError ? <ErrorMessage>{pinError}</ErrorMessage> : null;

    if (walletState === DECRYPTING || isChecking) {
      return (
        <Container center>
          <BaseText style={{ marginBottom: 20 }}>Checking</BaseText>
          <Spinner />
        </Container>
      );
    }

    return (
      <CheckPinWrapper>
        {showError}
        <PinCode
          onPinEntered={this.handlePinSubmit}
          pageInstructions=""
          showForgotButton={false}
          pinError={!!pinError}
        />
      </CheckPinWrapper>
    );
  }
}

const mapStateToProps = ({ wallet }) => ({ wallet });

const mapDispatchToProps = (dispatch: Function) => ({
  checkPin: (pin: string, onValidPin: Function, options: Object) => {
    dispatch(checkPinAction(pin, onValidPin, options));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(CheckPin);
