import React from 'react';
import Header from 'components/Header';
import { Container } from 'components/Layout';
import { BaseText } from 'components/Typography';
import Spinner from 'components/Spinner';
import PinCode from 'components/PinCode';
import ErrorMessage from 'components/ErrorMessage';
import { DECRYPTING, INVALID_PASSWORD } from 'constants/walletConstants';

const PinCodeUnlockScene = (props) => {
  const {
    onPinEntered,
    onForgotPin,
    walletState,
  } = props;

  const pinError = walletState === INVALID_PASSWORD ? 'Invalid pincode' : null;
  const showError = pinError ? <ErrorMessage>{pinError}</ErrorMessage> : null;

  if (walletState === DECRYPTING) {
    return (
      <Container center>
        <BaseText style={{ marginBottom: 20 }}>{walletState}</BaseText>
        <Spinner />
      </Container>
    );
  }

  return (
    <Container>
      <Header centerTitle title="enter pincode" />
      {showError}
      <PinCode
        onPinEntered={onPinEntered}
        pageInstructions=""
        onForgotPin={onForgotPin}
        pinError={!!pinError}
      />
    </Container>
  );
};

export default PinCodeUnlockScene;
