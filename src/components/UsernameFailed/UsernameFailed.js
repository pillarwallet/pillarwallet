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
import React, { useCallback, useEffect, useState } from 'react';
import styled, { withTheme } from 'styled-components/native';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import debounce from 'lodash.debounce';
import t from 'translations/translate';

// actions
import {
  checkUsernameAvailabilityAction,
  finishOnboardingAction,
  resetUsernameCheckAction,
} from 'actions/onboardingActions';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { BaseText } from 'components/Typography';
import Button from 'components/Button';
import TextInput from 'components/TextInput';
import { getUsernameInputIcon } from 'screens/NewProfile';

// utils
import { spacing } from 'utils/variables';
import { getThemeColors } from 'utils/themes';
import { validateUsername } from 'utils/validators';
import { getEnsPrefix } from 'utils/common';

// types
import type { Theme } from 'models/Theme';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { User } from 'models/User';


const ContentWrapper = styled.View`
  flex: 1;
`;

const StyledWrapper = styled.View`
  flex-grow: 1;
  padding: 32px ${spacing.layoutSides}px ${spacing.layoutSides}px;
`;

const FooterWrapper = styled.View`
  padding: 0 ${spacing.layoutSides}px 20px;
  width: 100%;
`;

type Props = {
  navigation: NavigationScreenProp<*>,
  checkUsernameAvailability: (username: string) => void,
  resetUsernameCheck: () => void,
  user: ?User,
  theme: Theme,
  errorMessage: ?string,
  finishOnboarding: () => void,
  savedUsername: ?string,
};

const UsernameFailed = ({
  user,
  checkUsernameAvailability,
  theme,
  errorMessage,
  resetUsernameCheck,
  finishOnboarding,
  savedUsername,
}: Props) => {
  useEffect(() => {
    // prepare for username check if no user set
    if (!user) resetUsernameCheck();
  }, []);

  const [usernameValue, setUsernameValue] = useState(savedUsername); // prefill with previously saved
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  // dirty if input has changed and no default value set
  const isUsernameInputDirty = usernameValue !== null && usernameValue !== savedUsername;

  const usernameValidationErrorMessage = isUsernameInputDirty ? validateUsername(usernameValue) : null;

  const onValidUsername = useCallback(
    debounce(() => { if (usernameValue) checkUsernameAvailability(usernameValue); }, 200),
    [usernameValue],
  );

  useEffect(() => {
    if (!isCheckingUsername
      && !usernameValidationErrorMessage
      && isUsernameInputDirty) {
      setIsCheckingUsername(true);
    } else if (isCheckingUsername && (usernameValidationErrorMessage || errorMessage)) {
      // reset if error occurred during update
      setIsCheckingUsername(false);
    }
  }, [usernameValue, errorMessage]);

  useEffect(() => {
    // user updated, reset
    if (isCheckingUsername) setIsCheckingUsername(false);
  }, [user]);

  useEffect(() => {
    if (!usernameValidationErrorMessage) onValidUsername();
    return onValidUsername.cancel;
  }, [onValidUsername, usernameValue]);

  const colors = getThemeColors(theme);

  const allowNext = isUsernameInputDirty
    && !usernameValidationErrorMessage
    && !errorMessage
    && !isCheckingUsername;

  const { statusIcon, iconColor } = getUsernameInputIcon(
    colors,
    isUsernameInputDirty,
    isCheckingUsername,
    user,
    usernameValidationErrorMessage,
    errorMessage,
  );

  return (
    <ContainerWithHeader
      headerProps={{ centerItems: [{ title: t('auth:title.chooseUsername') }], noBack: true }}
      keyboardShouldPersistTaps="always"
      footer={(
        <FooterWrapper>
          <Button
            title={t('auth:button.retry')}
            onPress={finishOnboarding}
            disabled={!allowNext}
          />
        </FooterWrapper>
      )}
    >
      <ContentWrapper>
        <StyledWrapper>
          <TextInput
            errorMessage={usernameValidationErrorMessage || errorMessage}
            loading={isCheckingUsername}
            rightPlaceholder={getEnsPrefix()}
            iconProps={{
              icon: statusIcon,
              color: iconColor,
            }}
            inputProps={{
              value: usernameValue,
              autoCapitalize: 'none',
              autoFocus: true,
              onChange: setUsernameValue,
            }}
          />
          <BaseText regular>{t('auth:label.cannotBeChanged')}</BaseText>
        </StyledWrapper>
      </ContentWrapper>
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  onboarding: {
    user,
    errorMessage,
  },
  user: { data: { username: savedUsername } },
}: RootReducerState): $Shape<Props> => ({
  user,
  savedUsername,
  errorMessage,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  checkUsernameAvailability: (username: string) => dispatch(checkUsernameAvailabilityAction(username)),
  resetUsernameCheck: () => dispatch(resetUsernameCheckAction()),
  finishOnboarding: () => dispatch(finishOnboardingAction()),
});

export default withTheme(connect(mapStateToProps, mapDispatchToProps)(UsernameFailed));
