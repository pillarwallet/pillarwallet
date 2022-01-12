// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

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
import { Platform } from 'react-native';
import t from 'translations/translate';
import styled from 'styled-components/native';
import { useNavigation } from 'react-navigation-hooks';
import { useDispatch } from 'react-redux';
import { debounce } from 'lodash';

// Actions
import { checkUsernameAvailabilityAction, resetUsernameCheckAction } from 'actions/onboardingActions';

// Utils
import { appFont, spacing, fontSizes } from 'utils/variables';
import { useThemeColors } from 'utils/themes';
import { validateUsername } from 'utils/validators';
import { getEnsPrefix } from 'utils/common';

// Selectors
import { useRootSelector } from 'selectors';

// Components
import { Container } from 'components/layout/Layout';
import TextInput from 'components/legacy/TextInput';
import HeaderBlock from 'components/HeaderBlock';
import SwipeButton from 'components/SwipeButton/SwipeButton';

// Constants
// import { CHAIN } from 'constants/chainConstants';

// Types
import type { OnboardingUser } from 'models/User';


const RegisterENS = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const colors = useThemeColors();
  const user = useRootSelector((root) => root.onboarding.user);
  const errorMessage = useRootSelector((root) => root.onboarding.errorMessage);
  const [usernameValue, setUsernameValue] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  const isUsernameInputDirty = usernameValue !== null;

  const usernameValidationErrorMessage = isUsernameInputDirty ? validateUsername(usernameValue) : null;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onValidUsername = useCallback(
    debounce(() => {
      if (usernameValue) dispatch(checkUsernameAvailabilityAction(usernameValue));
    }, 200),
    [usernameValue],
  );

  useEffect(() => {
    // prepare for username check if no user set
    if (!user) dispatch(resetUsernameCheckAction(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isCheckingUsername && !usernameValidationErrorMessage && !errorMessage && isUsernameInputDirty) {
      setIsCheckingUsername(true);
    } else if (isCheckingUsername && (usernameValidationErrorMessage || errorMessage)) {
      // reset if error occurred during update
      setIsCheckingUsername(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usernameValue, errorMessage]);

  useEffect(() => {
    // user updated, reset
    if (isCheckingUsername) setIsCheckingUsername(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!usernameValidationErrorMessage) onValidUsername();
    return onValidUsername.cancel;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onValidUsername, usernameValue]);

  const { statusIcon, iconColor } = getUsernameInputIcon(
    colors,
    isUsernameInputDirty,
    isCheckingUsername,
    user,
    usernameValidationErrorMessage,
    errorMessage,
  );

  const handleChangeText = (text: string) => {
    const ensName = text.replace(getEnsPrefix(), '');
    setUsernameValue(ensName);
  };

  return (
    <Container>
      <HeaderBlock
        centerItems={[{ title: t('title.registerEnsName') }]}
        leftItems={[{ close: true }]}
        navigation={navigation}
        noPaddingTop
      />
      <StyledWrapper>
        <TextInput
          errorMessage={usernameValidationErrorMessage}
          loading={isCheckingUsername}
          iconProps={{
            icon: statusIcon,
            color: iconColor,
          }}
          inputProps={{
            value: `${usernameValue}`,
            autoCapitalize: 'none',
            autoFocus: true,
            onChangeText: handleChangeText,
          }}
          rightPlaceholder={getEnsPrefix()}
          inputWrapperStyle={styles.inputWrapperStyles}
          itemHolderStyle={styles.itemHolderStyles}
          additionalStyle={styles.additionalStyle}
        />
      </StyledWrapper>
      <Footer behavior={Platform.OS === 'ios' ? 'position' : null}>
        <SwipeButton confirmTitle={t('button.swipeConfirm')} />
      </Footer>
    </Container>
  );
};

const styles = {
  inputWrapperStyles: {
    backgroundColor: 'transparent',
    zIndex: 10,
    marginTop: 20,
  },
  itemHolderStyles: {
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  additionalStyle: {
    fontSize: fontSizes.jumbo,
    fontFamily: appFont.regular,
    textAlign: 'center',
  },
};

const Footer = styled.KeyboardAvoidingView`
  padding: 20px 20px 20px;
`;

const StyledWrapper = styled.View`
  flex-grow: 1;
  padding: 32px ${spacing.layoutSides}px ${spacing.layoutSides}px;
`;

export default RegisterENS;

export const getUsernameInputIcon = (
  colors: Object,
  isUsernameInputDirty: boolean,
  isCheckingUsername: boolean,
  user: ?OnboardingUser,
  usernameValidationErrorMessage: ?string,
  errorMessage: ?string,
) => {
  let statusIcon = null;
  let iconColor = null;

  if (isUsernameInputDirty && !isCheckingUsername) {
    if (usernameValidationErrorMessage || errorMessage) {
      statusIcon = 'close'; // eslint-disable-line i18next/no-literal-string
      iconColor = colors.negative;
    } else if (user?.username) {
      statusIcon = 'check'; // eslint-disable-line i18next/no-literal-string
      iconColor = colors.positive;
    }
  }

  return { statusIcon, iconColor };
};
