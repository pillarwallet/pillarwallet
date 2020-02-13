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
import type { NavigationScreenProp } from 'react-navigation';
import { TextInput as RNTextInput } from 'react-native';
import { connect } from 'react-redux';
import styled from 'styled-components/native';

// types
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';

// constants
import {
  ADD_EDIT_USER,
  HOME,
} from 'constants/navigationConstants';

// actions
import {
  createOneTimePasswordAction,
  verifyEmailAction,
  resetOneTimePasswordAction,
} from 'actions/userActions';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Spinner from 'components/Spinner';
import SendEmailCode from 'components/Verification/SendEmailCode';
import ConfirmCode from 'components/Verification/ConfirmCode';
import NoEmail from 'components/Verification/NoEmail';
import EmailVerified from 'components/Verification/EmailVerified';

// utils
import { spacing } from 'utils/variables';

const ContentWrapper = styled.View`
  padding: 30px ${spacing.layoutSides}px ${spacing.layoutSides}px;
`;

type Props = {
  createOneTimePassword: (walletId: string, field: Object) => void,
  resetOneTimePassword: () => void,
  verifyEmail: (walletId: string, code: string) => void,
  navigation: NavigationScreenProp<*>,
  walletId: string,
  email: string,
  sendingOneTimePassword: boolean,
  oneTimePasswordSent: boolean,
  isEmailVerified: boolean,
};

type State = {
  code: string,
};

class UserSettings extends React.PureComponent<Props, State> {
  emailInputRef: RNTextInput;
  state = {
    code: '',
  };

  sendOTP = () => {
    const { walletId, createOneTimePassword } = this.props;

    createOneTimePassword(walletId, {
      smsNotification: false,
    });
  }

  resetOTP = () => {
    const { resetOneTimePassword } = this.props;

    resetOneTimePassword();
  };

  confirmOTP = () => {
    const { verifyEmail, walletId } = this.props;
    const { code } = this.state;

    verifyEmail(walletId, code);
  };

  updateCode = (code: string) => {
    this.setState({ code });
  };

  setEmail = () => {
    const { navigation } = this.props;

    navigation.navigate(ADD_EDIT_USER);
  };

  goBack = () => {
    const { navigation } = this.props;

    navigation.navigate(HOME);
  };

  render() {
    const { code } = this.state;

    const {
      email,
      oneTimePasswordSent,
      sendingOneTimePassword,
      isEmailVerified,
    } = this.props;

    const hasEmail = !!email && email.trim().length > 0;
    const isConfirming = sendingOneTimePassword || oneTimePasswordSent;
    const showConfirmForm = !isEmailVerified && hasEmail && !isConfirming;

    return (
      <ContainerWithHeader
        headerProps={{ centerItems: [{ title: 'Verify your email' }] }}
        inset={{ bottom: 'never' }}
      >
        <ContentWrapper>
          {isEmailVerified && <EmailVerified onPressBack={this.goBack} />}
          {!hasEmail && <NoEmail onPressSetEmail={this.setEmail} />}

          {showConfirmForm && <SendEmailCode
            email={email}
            onPressSendCode={this.sendOTP}
          />}
          {!isEmailVerified && sendingOneTimePassword && <Spinner />}
          {!isEmailVerified && oneTimePasswordSent && <ConfirmCode
            code={code}
            updateCode={this.updateCode}
            onPressConfirm={this.confirmOTP}
            onPressCancel={this.resetOTP}
          />}
        </ContentWrapper>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  user: {
    data: {
      walletId,
      email,
      sendingOneTimePassword,
      oneTimePasswordSent,
      isEmailVerified,
    },
  },
}: RootReducerState): $Shape<Props> => ({
  walletId,
  email,
  sendingOneTimePassword,
  oneTimePasswordSent,
  isEmailVerified,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  createOneTimePassword: (walletId: string, field: Object) =>
    dispatch(createOneTimePasswordAction(walletId, field)),
  verifyEmail: (walletId: string, code: string) =>
    dispatch(verifyEmailAction(walletId, code)),
  resetOneTimePassword: () => dispatch(resetOneTimePasswordAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(UserSettings);
