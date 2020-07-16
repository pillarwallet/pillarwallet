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
import type { NavigationScreenProp } from 'react-navigation';
import t from 'translations/translate';

// actions
import { confirmPinForNewWalletAction } from 'actions/walletActions';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import PinCode from 'components/PinCode';
import ErrorMessage from 'components/ErrorMessage';
import { MediumText } from 'components/Typography';

// constants
import { BIOMETRICS_PROMPT, PIN_CODE_CONFIRMATION } from 'constants/navigationConstants';

// utils
import { validatePin } from 'utils/validators';
import { fontStyles, spacing } from 'utils/variables';
import { getSupportedBiometryType } from 'utils/keychain';

// types
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';


type Props = {
  confirmPinForNewWallet: (pin: string, shouldRegisterWallet?: boolean) => void,
  navigation: NavigationScreenProp<*>,
  wallet: Object,
};

type State = {
  errorMessage: string,
};

const ContentWrapper = styled.ScrollView`
  flex: 1;
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
    const { wallet: { onboarding: wallet }, confirmPinForNewWallet } = this.props;
    const previousPin = wallet.pin;
    const validationError = validatePin(pin, previousPin);

    if (validationError) {
      this.setState({
        errorMessage: validationError,
      });
      return;
    }

    getSupportedBiometryType(biometryType => this.handleBiometryType(pin, biometryType),
      () => { confirmPinForNewWallet(pin, true); });
  }

  handleBiometryType = (pin: string, biometryType?: string) => {
    const { confirmPinForNewWallet, navigation } = this.props;
    if (biometryType) {
      navigation.navigate(BIOMETRICS_PROMPT, { biometryType });
      confirmPinForNewWallet(pin);
    } else {
      confirmPinForNewWallet(pin, true);
    }
  }

  handlePinChange = () => {
    this.setState({
      errorMessage: '',
    });
  };

  render() {
    const { errorMessage } = this.state;
    return (
      <ContainerWithHeader
        headerProps={{ centerItems: [{ title: t('auth:title.confirmPin') }] }}
      >
        {!!errorMessage &&
        <ErrorMessage wrapperStyle={{ marginTop: 0 }}>
          {this.state.errorMessage}
        </ErrorMessage>
        }
        <ContentWrapper contentContainerStyle={{ padding: spacing.large, flexGrow: 1 }}>
          <HeaderText>
            {t('auth.reenterToConfirm')}
          </HeaderText>
          <PinCode
            onPinEntered={this.handlePinSubmit}
            onPinChanged={this.handlePinChange}
            showForgotButton={false}
            pinError={!!errorMessage}
            flex={false}
          />
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
