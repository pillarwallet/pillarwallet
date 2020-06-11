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
import { BackHandler, Platform } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native';

// actions
import { setPinForNewWalletAction } from 'actions/walletActions';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import PinCode from 'components/PinCode';
import { MediumText, Paragraph } from 'components/Typography';

// utils
import { validatePin } from 'utils/validators';
import { fontStyles, spacing } from 'utils/variables';

// types
import type { ImportedWallet } from 'reducers/walletReducer';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';


const ContentWrapper = styled.ScrollView`
  flex: 1;
`;

const HeaderText = styled(MediumText)`
  ${fontStyles.large};
  text-align: center;
  margin-top: ${spacing.large}px;
  margin-bottom: 9px;
`;

type Props = {
  setPinForNewWallet: (pin: string) => void,
  navigation: NavigationScreenProp<*>,
  importedWallet: ImportedWallet,
};

type State = {
  error: string,
};

class SetWalletPinCode extends React.Component<Props, State> {
  noBack: boolean;
  state = {
    error: '',
  };

  constructor(props: Props) {
    super(props);
    this.noBack = props.navigation.getParam('noBack', false);
  }

  componentDidMount() {
    if (Platform.OS !== 'android' && !this.noBack) return;
    BackHandler.addEventListener('hardwareBackPress', this.handleNavigationBack);
  }

  componentWillUnmount() {
    if (Platform.OS !== 'android' && !this.noBack) return;
    BackHandler.removeEventListener('hardwareBackPress', this.handleNavigationBack);
  }

  handleNavigationBack = () => false;

  handlePinSubmit = (pin: string) => {
    const validationError = validatePin(pin);
    if (validationError) {
      this.setState({ error: validationError });
      return;
    }
    this.props.setPinForNewWallet(pin);
  };

  handlePinChange = () => {
    this.setState({ error: '' });
  };

  render() {
    const { error } = this.state;
    const { navigation, importedWallet } = this.props;
    const username = navigation.getParam('username', '');
    let welcomeText = 'Welcome to Pillar';
    if (username) welcomeText += `,\n${username}`;

    return (
      <ContainerWithHeader
        headerProps={{
          centerItems: [{ title: 'Create PIN code' }],
          noBack: this.noBack,
        }}
      >
        <ContentWrapper contentContainerStyle={{ padding: spacing.large, flexGrow: 1 }}>
          {!importedWallet &&
          <HeaderText>
            {`${welcomeText}!`}
          </HeaderText>}
          <Paragraph center>
            Now let’s create a PIN code to secure your account.
          </Paragraph>
          <PinCode
            onPinEntered={this.handlePinSubmit}
            onPinChanged={this.handlePinChange}
            pageInstructions="Setup your Pincode"
            showForgotButton={false}
            pinError={!!error}
            flex={false}
          />
        </ContentWrapper>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  wallet: { onboarding: { importedWallet } },
}: RootReducerState): $Shape<Props> => ({
  importedWallet,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  setPinForNewWallet: (pin: string) => {
    dispatch(setPinForNewWalletAction(pin));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(SetWalletPinCode);
