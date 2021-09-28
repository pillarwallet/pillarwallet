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
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import t from 'translations/translate';
import type { NavigationScreenProp } from 'react-navigation';

// actions
import { changePinAction, resetIncorrectPasswordAction } from 'actions/authActions';

// constants
import { MENU } from 'constants/navigationConstants';

// components
import { Container, Wrapper } from 'components/legacy/Layout';
import { BaseText } from 'components/legacy/Typography';
import ErrorMessage from 'components/ErrorMessage';
import PinCode from 'components/PinCode';
import Button from 'components/legacy/Button';
import Header from 'components/Header';
import Loader from 'components/Loader';

// utils
import { validatePinWithConfirmation } from 'utils/validators';

// types
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';


type Props = {
  changePin: (newPin: string, currentPin: string) => void,
  isChangingPin: boolean,
  navigation: NavigationScreenProp<*>,
  resetIncorrectPassword: () => void,
};

const ConfirmNewPin = ({
  resetIncorrectPassword,
  navigation,
  isChangingPin,
  changePin,
}: Props) => {
  const [pinError, setPinError] = useState(null);
  const [pinSuccessfullyChanged, setPinSuccessfullyChanged] = useState(false);
  const [newPinSubmitted, setNewPinSubmitted] = useState(false);
  const maxPinCodeLength = 4;

  useEffect(() => {
    // on isChangingPin change to false when pin was set
    if (!isChangingPin && newPinSubmitted && !pinSuccessfullyChanged) {
      setPinSuccessfullyChanged(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChangingPin]);

  const handlePinSubmit = (enteredPin: string) => {
    const currentPin = navigation.getParam('currentPin');
    const newPin = navigation.getParam('newPin');
    const validationError = validatePinWithConfirmation(enteredPin, newPin, maxPinCodeLength);

    if (validationError) {
      setPinError(validationError);
      return;
    }

    changePin(enteredPin, currentPin);
    setNewPinSubmitted(true);
  };

  const handleScreenDismissal = () => {
    resetIncorrectPassword();
    navigation.dismiss();
  };

  if (isChangingPin) {
    return (
      <Container center>
        <Loader />
      </Container>
    );
  }

  if (pinSuccessfullyChanged) {
    return (
      <Container>
        <Wrapper flex={1} center regularPadding>
          <BaseText style={{ marginBottom: 20 }}>{t('label.pinChanged', { exclamation: true })}</BaseText>
          <Button title={t('button.continue')} onPress={() => navigation.navigate(MENU)} />
        </Wrapper>
      </Container>
    );
  }

  return (
    <Container>
      <Header
        title={t('title.confirmNewPin')}
        centerTitle
        onClose={handleScreenDismissal}
      />
      {!!pinError && <ErrorMessage>{pinError}</ErrorMessage>}
      <PinCode
        onPinEntered={handlePinSubmit}
        onPinChanged={() => setPinError(null)}
        showForgotButton={false}
        pinError={!!pinError}
        maxPinCodeLength={maxPinCodeLength}
      />
    </Container>
  );
};

const mapStateToProps = ({
  wallet: { isChangingPin },
}: RootReducerState): $Shape<Props> => ({
  isChangingPin,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  changePin: (newPin: string, currentPin: string) => dispatch(changePinAction(newPin, currentPin)),
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(ConfirmNewPin);
