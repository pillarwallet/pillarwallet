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
import React, { useState } from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import t from 'translations/translate';

// actions
import { completeOnboardingAction, setOnboardingPinCodeAction } from 'actions/onboardingActions';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import PinCode from 'components/PinCode';
import ErrorMessage from 'components/ErrorMessage';
import { MediumText } from 'components/Typography';

// constants
import { BIOMETRICS_PROMPT } from 'constants/navigationConstants';

// utils
import { validatePin } from 'utils/validators';
import { fontStyles, spacing } from 'utils/variables';
import { getSupportedBiometryType } from 'utils/keychain';

// types
import type { Dispatch } from 'reducers/rootReducer';


type Props = {
  completeOnboarding: () => void,
  setOnboardingPinCode: (pinCode: string) => void,
  navigation: NavigationScreenProp<*>,
  wallet: Object,
};

const ContentWrapper = styled.ScrollView`
  flex: 1;
`;

const HeaderText = styled(MediumText)`
  ${fontStyles.large};
  text-align: center;
  margin: ${spacing.large}px 0;
`;

const PinCodeConfirmation = ({
  setOnboardingPinCode,
  completeOnboarding,
  navigation,
}) => {
  const [errorMessage, setErrorMessage] = useState(null);

  const previousPinCode = navigation.getParam('pinCode');

  const handlePinSubmit = (pinCode: string) => {
    const validationError = validatePin(pinCode, previousPinCode);

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    getSupportedBiometryType((biometryType) => {
      setOnboardingPinCode(pinCode);
      if (biometryType) {
        navigation.navigate(BIOMETRICS_PROMPT, { biometryType });
      } else {
        completeOnboarding();
      }
    });
  };

  return (
    <ContainerWithHeader
      headerProps={{ centerItems: [{ title: t('auth:title.confirmPin') }] }}
    >
      {!!errorMessage && (
        <ErrorMessage wrapperStyle={{ marginTop: 0 }}>
          {errorMessage}
        </ErrorMessage>
      )}
      <ContentWrapper contentContainerStyle={{ padding: spacing.large, flexGrow: 1 }}>
        <HeaderText>
          {t('auth:label.reenterToConfirm')}
        </HeaderText>
        <PinCode
          onPinEntered={handlePinSubmit}
          onPinChanged={() => setErrorMessage(null)}
          showForgotButton={false}
          pinError={!!errorMessage}
          flex={false}
        />
      </ContentWrapper>
    </ContainerWithHeader>
  );
};

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  setOnboardingPinCode: (pinCode: string) => dispatch(setOnboardingPinCodeAction(pinCode)),
  completeOnboarding: () => dispatch(completeOnboardingAction()),
});

export default connect(null, mapDispatchToProps)(PinCodeConfirmation);
