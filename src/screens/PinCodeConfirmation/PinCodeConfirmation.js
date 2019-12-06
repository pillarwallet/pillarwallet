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
import styled from 'styled-components/native';
import { Wrapper } from 'components/Layout';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import type { NavigationScreenProp } from 'react-navigation';
import PinCode from 'components/PinCode';
import ErrorMessage from 'components/ErrorMessage';
import { MediumText } from 'components/Typography';
import { confirmPinForNewWalletAction } from 'actions/walletActions';
import { validatePin } from 'utils/validators';
import { PIN_CODE_CONFIRMATION } from 'constants/navigationConstants';
import { fontStyles, spacing } from 'utils/variables';

type Props = {
  confirmPinForNewWallet: (pin: string) => Function,
  navigation: NavigationScreenProp<*>,
  wallet: Object,
};

type State = {
  errorMessage: string,
};

const ContentWrapper = styled.View`
  flex: 1;
  padding-top: ${spacing.medium}px;
`;

const HeaderText = styled(MediumText)`
  ${fontStyles.large};
  text-align: center;
  margin: ${spacing.large}px 0;
`;


class PinCodeConfirmation extends React.Component<Props, State> {
  state = {
    errorMessage: '',
  };

  constructor(props) {
    super(props);
    this.props.navigation.state.key = PIN_CODE_CONFIRMATION;
  }

  handlePinSubmit = (pin: string) => {
    const { onboarding: wallet } = this.props.wallet;
    const previousPin = wallet.pin;
    const validationError = validatePin(pin, previousPin);

    if (validationError) {
      this.setState({
        errorMessage: validationError,
      });
      return;
    }

    this.props.confirmPinForNewWallet(pin);
  };

  handlePinChange = () => {
    this.setState({
      errorMessage: '',
    });
  };

  render() {
    const { errorMessage } = this.state;
    return (
      <ContainerWithHeader
        headerProps={{ centerItems: [{ title: 'Confirm PIN code' }] }}
      >
        {!!errorMessage &&
        <ErrorMessage wrapperStyle={{ marginTop: 0 }}>
          {this.state.errorMessage}
        </ErrorMessage>
        }
        <ContentWrapper>
          <HeaderText>
            Re-enter to confirm
          </HeaderText>
          <Wrapper regularPadding style={{ justifyContent: 'space-between', flex: 1 }}>
            <PinCode
              onPinEntered={this.handlePinSubmit}
              onPinChanged={this.handlePinChange}
              pageInstructions="Confirm your Pincode"
              showForgotButton={false}
              pinError={!!errorMessage}
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
  confirmPinForNewWallet: (pin) => {
    dispatch(confirmPinForNewWalletAction(pin));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(PinCodeConfirmation);
