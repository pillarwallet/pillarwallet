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
import * as Keychain from 'react-native-keychain';
import type { NavigationScreenProp } from 'react-navigation';

// actions
import { confirmPinForNewWalletAction } from 'actions/walletActions';

// components
import { Wrapper } from 'components/Layout';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import PinCode from 'components/PinCode';
import ErrorMessage from 'components/ErrorMessage';
import { MediumText } from 'components/Typography';

// constants
import { BIOMETRICS_PROMPT, PIN_CODE_CONFIRMATION } from 'constants/navigationConstants';

// utils
import { validatePin } from 'utils/validators';
import { fontStyles, spacing } from 'utils/variables';


type Props = {
  confirmPinForNewWallet: (pin: string, shouldRegisterWallet?: boolean) => void,
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
    const { wallet: { onboarding: wallet }, confirmPinForNewWallet, navigation } = this.props;
    const previousPin = wallet.pin;
    const validationError = validatePin(pin, previousPin);

    if (validationError) {
      this.setState({
        errorMessage: validationError,
      });
      return;
    }

    Keychain.getSupportedBiometryType()
      .then((biometryType) => {
        if (biometryType) {
          navigation.navigate(BIOMETRICS_PROMPT, { biometryType });
          confirmPinForNewWallet(pin);
        } else {
          confirmPinForNewWallet(pin, true);
        }
      })
      .catch(() => { confirmPinForNewWallet(pin, true); });
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

const mapStateToProps = ({
  wallet,
}: RootReducerState): $Shape<Props> => ({
  wallet,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  confirmPinForNewWallet: (pin: string, shouldRegisterWallet?: boolean) => {
    dispatch(confirmPinForNewWalletAction(pin, shouldRegisterWallet));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(PinCodeConfirmation);
