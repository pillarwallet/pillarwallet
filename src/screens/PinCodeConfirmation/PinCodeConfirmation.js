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
import { connect, useDispatch } from 'react-redux';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import t from 'translations/translate';

// Actions
import { beginOnboardingAction, setOnboardingPinCodeAction } from 'actions/onboardingActions';
import { logEventAction } from 'actions/analyticsActions';

// Components
import ContainerWithHeader from 'components/legacy/Layout/ContainerWithHeader';
import PinCode from 'components/PinCode';
import ErrorMessage from 'components/ErrorMessage';
import { MediumText } from 'components/legacy/Typography';

// Constants
import { HOME } from 'constants/navigationConstants';

// Selectors
import { useRootSelector } from 'selectors';
import { maxPinCodeLengthSelector } from 'selectors/appSettings';

// Utils
import { validatePinWithConfirmation } from 'utils/validators';
import { fontStyles, spacing } from 'utils/variables';

// Types
import type { Dispatch } from 'reducers/rootReducer';

type Props = {
  beginOnboarding: () => void,
  setOnboardingPinCode: (pinCode: string) => void,
  navigation: NavigationScreenProp<*>,
  wallet: Object,
};

const PinCodeConfirmation = ({ setOnboardingPinCode, navigation }) => {
  const [errorMessage, setErrorMessage] = useState(null);
  const dispatch = useDispatch();

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
    navigation.navigate(HOME);
  };

  return (
    <ContainerWithHeader headerProps={{ centerItems: [{ title: t('auth:title.confirmPin') }] }}>
      {!!errorMessage && <ErrorMessage wrapperStyle={{ marginTop: 0 }}>{errorMessage}</ErrorMessage>}
      <ContentWrapper contentContainerStyle={{ padding: spacing.large, flexGrow: 1 }}>
        <HeaderText>{t('auth:label.reenterToConfirm')}</HeaderText>
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

const HeaderText = styled(MediumText)`
  ${fontStyles.large};
  text-align: center;
  margin: ${spacing.large}px 0;
`;

const TAG = 'PinCodeConfirmation';
