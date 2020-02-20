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
import { connect } from 'react-redux';

// types
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { User } from 'models/User';

// actions
import {
  createOneTimePasswordAction,
  verifyEmailAction,
  verifyPhoneAction,
  resetOneTimePasswordAction,
} from 'actions/userActions';

// components
import Spinner from 'components/Spinner';
import ConfirmCode from 'components/Verification/ConfirmCode';
import ModalBox from 'components/ModalBox/ModalBox';
import BoxTitle from 'components/ModalBox/BoxTitle';
import BoxBody from 'components/ModalBox/BoxBody';
import StatusLabel from 'components/Verification/StatusLabel';
import ResendMessage from 'components/Verification/ResendMessage';
import CheckIcon from 'components/Verification/CheckIcon';

type Props = {
  createOneTimePassword: (walletId: string, field: Object) => void,
  resetOneTimePassword: () => void,
  verifyEmail: (walletId: string, code: string) => void,
  verifyPhone: (walletId: string, code: string) => void,
  navigation: NavigationScreenProp<*>,
  user: User,
  sendingOneTimePassword: boolean,
};

type State = {
  code: string,
};

class UserSettings extends React.PureComponent<Props, State> {
  verifyField: string;

  state = {
    code: '',
  };

  constructor(props) {
    super(props);

    const {
      state: { params: { field } },
    } = props.navigation;

    this.verifyField = field;
  }

  componentDidMount() {
    this.sendOTP();
  }

  sendOTP = () => {
    const {
      createOneTimePassword,
      user: { walletId },
    } = this.props;

    createOneTimePassword(walletId, {
      smsNotification: this.verifyField === 'phone',
    });
  }

  resetOTP = () => {
    const { resetOneTimePassword } = this.props;

    resetOneTimePassword();
  };

  confirmOTP = (code) => {
    const {
      verifyPhone,
      verifyEmail,
      user: { walletId },
    } = this.props;

    switch (this.verifyField) {
      case 'email':
        verifyEmail(walletId, code);
        break;

      case 'phone':
        verifyPhone(walletId, code);
        break;

      default:
        break;
    }
  };

  updateCode = (code: string) => {
    this.setState({ code }, () => {
      if (code.length === 5) {
        this.confirmOTP(code);
      }
    });
  };

  goBack = () => {
    const { navigation } = this.props;

    navigation.goBack(null);
  };

  render() {
    const { code } = this.state;
    const {
      sendingOneTimePassword,
      user,
      user: {
        isEmailVerified,
        isPhoneVerified,
      },
    } = this.props;
    const { verifyField } = this;

    const titleText = `Enter verification code (${
      verifyField === 'email' ? 'Email' : 'SMS'
    })`;

    const isVerified = verifyField === 'email' ?
      isEmailVerified : isPhoneVerified;
    const enteringCode = !isVerified && !sendingOneTimePassword;

    return (
      <ModalBox>
        <BoxTitle title={titleText} onPressClose={this.goBack} />
        <StatusLabel
          user={user}
          field={verifyField}
          sendingOneTimePassword={sendingOneTimePassword}
        />
        <BoxBody>
          {!isVerified && sendingOneTimePassword && <Spinner />}
          {enteringCode && <ConfirmCode
            code={code}
            updateCode={this.updateCode}
          />}
          {isVerified && <CheckIcon />}
        </BoxBody>
        {enteringCode && <ResendMessage onPressResend={this.sendOTP} />}
      </ModalBox>
    );
  }
}

const mapStateToProps = ({
  user: {
    data: user,
    sendingOneTimePassword,
  },
}: RootReducerState): $Shape<Props> => ({
  user,
  sendingOneTimePassword,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  createOneTimePassword: (walletId: string, field: Object) =>
    dispatch(createOneTimePasswordAction(walletId, field)),
  verifyEmail: (walletId: string, code: string) => dispatch(verifyEmailAction(walletId, code)),
  verifyPhone: (walletId: string, code: string) => dispatch(verifyPhoneAction(walletId, code)),
  resetOneTimePassword: () => dispatch(resetOneTimePasswordAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(UserSettings);
