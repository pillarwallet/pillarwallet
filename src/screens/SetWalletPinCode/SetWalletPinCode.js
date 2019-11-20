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
import styled from 'styled-components/native';
import { Wrapper } from 'components/Layout';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import PinCode from 'components/PinCode';
import { setPinForNewWalletAction } from 'actions/walletActions';
import { validatePin } from 'utils/validators';
import { baseColors } from 'utils/variables';

const ContentWrapper = styled.View`
  flex: 1;
`;

type Props = {
  setPinForNewWallet: (pin: string) => Function,
  wallet: Object,
  navigation: NavigationScreenProp<*>,
};

type State = {
  error: string,
};

class SetWalletPinCode extends React.Component<Props, State> {
  state = {
    error: '',
  };

  handlePinSubmit = (pin: string) => {
    const validationError = validatePin(pin);
    if (validationError) {
      this.setState({
        error: validationError,
      });
      return;
    }

    this.props.setPinForNewWallet(pin);
  };

  handlePinChange = () => {
    this.setState({
      error: '',
    });
  };

  render() {
    const { error } = this.state;
    return (
      <ContainerWithHeader
        headerProps={{ centerItems: [{ title: 'Create PIN code' }] }}
        backgroundColor={baseColors.card}
      >
        <ContentWrapper>
          <Wrapper regularPadding style={{ justifyContent: 'space-between', flex: 1 }}>
            <PinCode
              onPinEntered={this.handlePinSubmit}
              onPinChanged={this.handlePinChange}
              pageInstructions="Setup your Pincode"
              showForgotButton={false}
              pinError={!!error}
              flex={false}
            />
          </Wrapper>
        </ContentWrapper>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({ wallet }) => ({ wallet });

const mapDispatchToProps = (dispatch: Function) => ({
  setPinForNewWallet: (pin) => {
    dispatch(setPinForNewWalletAction(pin));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(SetWalletPinCode);
