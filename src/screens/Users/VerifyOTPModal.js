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
import t from 'translations/translate';

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
import ModalBox from 'components/ModalBox';
import BoxTitle from 'components/ModalBox/BoxTitle';
import BoxBody from 'components/ModalBox/BoxBody';
import StatusLabel from 'components/Verification/StatusLabel';
import ResendMessage from 'components/Verification/ResendMessage';

// constants
import { OTP_DIGITS } from 'constants/referralsConstants';

type StateProps = {|
  user: User,
  sendingOneTimePassword: boolean,
  verificationFailed: boolean,
|};

type DispatchProps = {|
  createOneTimePassword: (walletId: string, field: Object) => void,
  resetOneTimePassword: () => void,
  verifyEmail: (walletId: string, code: string) => void,
  verifyPhone: (walletId: string, code: string) => void,
|};

type OwnProps = {|
  verifyingField: string,
  onModalClose: () => void,
|};

type Props = {|
  ...StateProps,
  ...DispatchProps,
  ...OwnProps,
|};

class VerifyOTPModal extends React.PureComponent<Props> {
  modalRef = React.createRef();

  componentDidMount() {
    this.sendOTP();
  }

  componentDidUpdate(oldProps: Props) {
    const {
      user: {
        isEmailVerified: oldIsEmailVerified,
        isPhoneVerified: oldIsPhoneVerified,
      },
    } = oldProps;

    const {
      verifyingField,
      user: {
        isEmailVerified,
        isPhoneVerified,
      },
    } = this.props;

    if (verifyingField === 'email') {
      if (!oldIsEmailVerified && isEmailVerified) {
        this.closeModal();
      }
    }

    if (verifyingField === 'phone') {
      if (!oldIsPhoneVerified && isPhoneVerified) {
        this.closeModal();
      }
    }
  }

  sendOTP = () => {
    const {
      createOneTimePassword,
      user: { walletId },
      verifyingField,
    } = this.props;

    if (!walletId) return;

    createOneTimePassword(walletId, {
      smsNotification: verifyingField === 'phone',
    });
  };

  confirmOTP = (code) => {
    const {
      verifyPhone,
      verifyEmail,
      user: { walletId },
      verifyingField,
    } = this.props;

    if (!walletId) return;

    switch (verifyingField) {
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
    const {
      verificationFailed,
      resetOneTimePassword,
    } = this.props;

    if (verificationFailed) {
      resetOneTimePassword();
    }

    if (code.length === OTP_DIGITS) {
      this.confirmOTP(code);
    }
  };

  closeModal = () => {
    this.props.onModalClose();
    if (this.modalRef.current) this.modalRef.current.close();
  };

  render() {
    const {
      sendingOneTimePassword,
      verificationFailed,
      user,
      verifyingField,
    } = this.props;

    const titleText = verifyingField === 'email'
      ? t('profileContent.modal.verification.title.email')
      : t('profileContent.modal.verification.title.phone');

    const enteringCode = !sendingOneTimePassword;

    return (
      <ModalBox ref={this.modalRef} >
        <BoxTitle
          title={titleText}
          onPressClose={this.closeModal}
        />
        <StatusLabel
          user={user}
          field={verifyingField}
          sendingOneTimePassword={sendingOneTimePassword}
        />
        <BoxBody>
          {sendingOneTimePassword && <Spinner />}
          {enteringCode && <ConfirmCode
            updateCode={this.updateCode}
            errorMessage={verificationFailed ? t('profileContent.modal.verification.error') : null}
          />}
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
    verificationFailed,
  },
}: RootReducerState): StateProps => ({
  user,
  sendingOneTimePassword,
  verificationFailed,
});

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  createOneTimePassword: (walletId: string, field: Object) =>
    dispatch(createOneTimePasswordAction(walletId, field)),
  verifyEmail: (walletId: string, code: string) => dispatch(verifyEmailAction(walletId, code)),
  verifyPhone: (walletId: string, code: string) => dispatch(verifyPhoneAction(walletId, code)),
  resetOneTimePassword: () => dispatch(resetOneTimePasswordAction()),
});

export default (connect(mapStateToProps, mapDispatchToProps)(VerifyOTPModal): React.AbstractComponent<OwnProps>);
