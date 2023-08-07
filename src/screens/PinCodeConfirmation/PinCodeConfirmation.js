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
import { Dimensions } from 'react-native';
import { connect, useDispatch } from 'react-redux';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import t from 'translations/translate';

// Actions
import { beginOnboardingAction, walletSetupAction, setOnboardingPinCodeAction } from 'actions/onboardingActions';
import { logEventAction } from 'actions/analyticsActions';

// Components
import ContainerWithHeader from 'components/legacy/Layout/ContainerWithHeader';
import PinCode from 'components/PinCode';
import ErrorMessage from 'components/ErrorMessage';
import { MediumText } from 'components/legacy/Typography';
import IconWithBackgroundGif from 'components/Gif/IconWithBackgroundGif';
import { Spacing } from 'components/legacy/Layout';

// Constants
import { HOME, ENALBE_BIOMETRICS_SCREEN } from 'constants/navigationConstants';
import { SET_FETCHING } from 'constants/onboardingConstants';

// Selectors
import { useRootSelector } from 'selectors';
import { maxPinCodeLengthSelector } from 'selectors/appSettings';

// Utils
import { validatePinWithConfirmation } from 'utils/validators';
import { spacing } from 'utils/variables';
import { getSupportedBiometryType } from 'utils/keychain';

// Types
import type { Dispatch } from 'reducers/rootReducer';

type Props = {
  beginOnboarding: () => void,
  setOnboardingPinCode: (pinCode: string) => void,
  navigation: NavigationScreenProp<*>,
  wallet: Object,
};

const { height } = Dimensions.get('window');

const PinCodeConfirmation = ({ setOnboardingPinCode, navigation }) => {
  const [errorMessage, setErrorMessage] = useState(null);
  const dispatch = useDispatch();

  const wallet = useRootSelector((root) => root.wallet.data);
  const maxPinCodeLength = useRootSelector(maxPinCodeLengthSelector);

  const previousPinCode = navigation.getParam('pinCode');

  const handlePinSubmit = (pinCode: string) => {
    const validationError = validatePinWithConfirmation(pinCode, previousPinCode, maxPinCodeLength);

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    dispatch(logEventAction('confirm_pin', { pinCode }));

    setOnboardingPinCode(pinCode);

    getSupportedBiometryType((biometryType) => {
      if (biometryType) {
        navigation.navigate(ENALBE_BIOMETRICS_SCREEN);
      } else {
        if (!wallet) {
          dispatch({ type: SET_FETCHING, payload: true });
          dispatch(walletSetupAction(false));
        }
        navigation.navigate(HOME);
      }
    });
  };

  return (
    <ContainerWithHeader headerProps={{ noBack: false }}>
      <ContentWrapper contentContainerStyle={{ padding: spacing.large, flexGrow: 1 }}>
        <IconWithBackgroundGif />
        <Spacing h={height * 0.05} />

        <MediumText fontSize={24} center>
          {t('auth:label.reenterToConfirm')}
        </MediumText>
        {!!errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
        <PinCode
          onPinEntered={handlePinSubmit}
          onPinChanged={() => setErrorMessage(null)}
          showForgotButton={false}
          pinError={!!errorMessage}
          flex={false}
          testIdTag={TAG}
        />
      </ContentWrapper>
    </ContainerWithHeader>
  );
};

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  setOnboardingPinCode: (pinCode: string) => dispatch(setOnboardingPinCodeAction(pinCode)),
  beginOnboarding: () => dispatch(beginOnboardingAction()),
});

export default connect(null, mapDispatchToProps)(PinCodeConfirmation);

const ContentWrapper = styled.ScrollView`
  flex: 1;
`;

const TAG = 'PinCodeConfirmation';
