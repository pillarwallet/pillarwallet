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

import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components/native';
import t from 'translations/translate';

// actions
import { finishOnboardingAction } from 'actions/onboardingActions';

// components
import { Container } from 'components/legacy/Layout';
import Button from 'components/legacy/Button';
import Loader from 'components/Loader';
import { MediumText } from 'components/legacy/Typography';

// utils
import { fontStyles } from 'utils/variables';

// types
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';


type Props = {
  isRegisteringUser: boolean,
  finishOnboarding: () => void,
};

const Text = styled(MediumText)`
  ${fontStyles.big};
  width: 100%;
  text-align: center;
  max-width: 230px;
  margin-bottom: 20px;
`;

const RetryApiRegistration = ({
  isRegisteringUser,
  finishOnboarding,
}: Props) => (
  <Container center>
    {!!isRegisteringUser && <Loader messages={[t('auth:loadingMessage.registering')]} />}
    {!isRegisteringUser && (
      <>
        <Text>{t('auth:label.registrationFailed')}</Text>
        <Button title={t('auth:button.tryAgain')} onPress={finishOnboarding} />
      </>
    )}
  </Container>
);

const mapStateToProps = ({
  onboarding: { isRegisteringUser },
}: RootReducerState): $Shape<Props> => ({
  isRegisteringUser,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  finishOnboarding: () => dispatch(finishOnboardingAction(true)), // true for retry
});

export default connect(mapStateToProps, mapDispatchToProps)(RetryApiRegistration);
