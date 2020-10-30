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
import { Keyboard, Platform } from 'react-native';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import debounce from 'lodash.debounce';
import t from 'translations/translate';

// actions
import { checkUsernameAvailabilityAction, resetUsernameCheckAction } from 'actions/onboardingActions';

// components
import { Wrapper, Spacing } from 'components/Layout';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { BaseText, MediumText, Paragraph } from 'components/Typography';
import Button from 'components/Button';
import ProfileImage from 'components/ProfileImage';
import Checkbox from 'components/Checkbox';
import HTMLContentModal, { ENDPOINTS } from 'components/Modals/HTMLContentModal';
import TextInput from 'components/TextInput';
import Modal from 'components/Modal';

// constants
import { PERMISSIONS, SET_WALLET_PIN_CODE } from 'constants/navigationConstants';

// utils
import { fontStyles, spacing } from 'utils/variables';
import { themedColors, getThemeColors } from 'utils/themes';
import { validateUsername } from 'utils/validators';
import { getEnsPrefix } from 'utils/common';

// types
import type { Theme } from 'models/Theme';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { User } from 'models/User';


const UsernameWrapper = styled(Wrapper)`
  margin: 36px 0 20px;
  align-self: center;
  justify-content: flex-end;
  align-items: center;
  position: relative;
  top: 2px;
`;

const Text = styled(MediumText)`
  ${fontStyles.big};
  width: 100%;
  text-align: center;
  max-width: 230px;
`;

const ContentWrapper = styled.View`
  flex: 1;
`;

const StyledWrapper = styled.View`
  flex-grow: 1;
  padding: 32px ${spacing.layoutSides}px ${spacing.layoutSides}px;
  min-height: 180px; ${''/* to add screen estate for error toast */}
`;

const CheckboxText = styled(BaseText)`
  ${fontStyles.regular};
  color: ${themedColors.accent};
`;

const FooterWrapper = styled.View`
  padding: 0 ${spacing.layoutSides}px 20px;
  width: 100%;
`;

const PROFILE_IMAGE_WIDTH = 144;

type Props = {
  navigation: NavigationScreenProp<*>,
  checkUsernameAvailability: (username: string) => void,
  resetUsernameCheck: () => void,
  user: ?User,
  theme: Theme,
  errorMessage: ?string,
};

export const getUsernameInputIcon = (
  colors: Object,
  isUsernameInputDirty: boolean,
  isCheckingUsername: boolean,
  user: ?User,
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

const NewProfile = ({
  user,
  checkUsernameAvailability,
  navigation,
  theme,
  errorMessage,
  resetUsernameCheck,
}: Props) => {
  useEffect(() => {
    // prepare for username check if no user set
    if (!user) resetUsernameCheck();
  }, []);

  const [usernameValue, setUsernameValue] = useState(null);
  const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false);
  const [hasAgreedToPolicy, setHasAgreedToPolicy] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  const isUsernameInputDirty = usernameValue !== null;

  const usernameValidationErrorMessage = isUsernameInputDirty ? validateUsername(usernameValue) : null;

  const onValidUsername = useCallback(
    debounce(() => { if (usernameValue) checkUsernameAvailability(usernameValue); }, 200),
    [usernameValue],
  );

  useEffect(() => {
    if (!isCheckingUsername
      && !usernameValidationErrorMessage
      && !errorMessage
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

  const existingUser = !!user?.walletId;

  const proceedToNextScreen = () => {
    Keyboard.dismiss();
    const navProps = usernameValue ? { username: usernameValue } : null;
    if (Platform.OS === 'android') {
      navigation.navigate(PERMISSIONS, navProps);
    } else {
      navigation.navigate(SET_WALLET_PIN_CODE, navProps);
    }
  };

  const renderChooseUsername = () => {
    const { statusIcon, iconColor } = getUsernameInputIcon(
      colors,
      isUsernameInputDirty,
      isCheckingUsername,
      user,
      usernameValidationErrorMessage,
      errorMessage,
    );

    return (
      <StyledWrapper>
        <TextInput
          errorMessage={usernameValidationErrorMessage || errorMessage}
          loading={isCheckingUsername}
          rightPlaceholder={!existingUser ? getEnsPrefix() : ''}
          iconProps={{
            icon: statusIcon,
            color: iconColor,
          }}
          inputProps={{
            value: usernameValue,
            autoCapitalize: 'none',
            disabled: !!existingUser,
            autoFocus: true,
            onChange: setUsernameValue,
          }}
          inputWrapperStyle={{ zIndex: 10 }}
        />
        <BaseText regular>{t('auth:label.cannotBeChanged')}</BaseText>
      </StyledWrapper>
    );
  };

  const renderWelcomeBack = () => (
    <Wrapper flex={1} center regularPadding>
      <ProfileImage
        uri={user?.profileImage}
        diameter={PROFILE_IMAGE_WIDTH}
        style={{ marginBottom: 47 }}
        userName={user?.username}
        initialsSize={48}
      />
      <UsernameWrapper>
        <Text>{t('auth:title.welcomeBack', { username: user?.username })}</Text>
      </UsernameWrapper>
      <Paragraph small light center style={{ marginBottom: 40, paddingLeft: 40, paddingRight: 40 }}>
        {t('auth:paragraph.successfullyRestoredWallet')}
      </Paragraph>
      <Button marginBottom="20px" onPress={proceedToNextScreen} title={t('auth:button.next')} />
    </Wrapper>
  );

  const hasAgreedToAllTerms = !!hasAgreedToTerms && !!hasAgreedToPolicy;

  const allowNext = isUsernameInputDirty
    && !usernameValidationErrorMessage
    && !errorMessage
    && !isCheckingUsername
    && (existingUser || hasAgreedToAllTerms);

  const headerProps = existingUser
    ? { default: true, floating: true, transparent: true }
    : { centerItems: [{ title: t('auth:title.chooseUsername') }] };

  const openLegalModal = (endpoint: string) => Modal.open(() => <HTMLContentModal htmlEndpoint={endpoint} />);

  return (
    <ContainerWithHeader
      headerProps={headerProps}
      putContentInScrollView={!existingUser}
      keyboardShouldPersistTaps="always"
      footer={!existingUser && (
        <FooterWrapper>
          <Checkbox
            onPress={() => setHasAgreedToTerms(!hasAgreedToTerms)}
            small
            lightText
            wrapperStyle={{ marginBottom: 16 }}
            checked={hasAgreedToTerms}
          >
            <CheckboxText>
              {t('auth:withLink.readUnderstandAgreeTo', {
                linkedText: t('auth:termsOfUse'),
                onPress: () => openLegalModal(ENDPOINTS.TERMS_OF_SERVICE),
              })}
            </CheckboxText>
          </Checkbox>
          <Checkbox
            onPress={() => setHasAgreedToPolicy(!hasAgreedToPolicy)}
            small
            lightText
            checked={hasAgreedToPolicy}
          >
            <CheckboxText>
              {t('auth:withLink.readUnderstandAgreeTo', {
                linkedText: t('auth:privacyPolicy'),
                onPress: () => openLegalModal(ENDPOINTS.PRIVACY_POLICY),
              })}
            </CheckboxText>
          </Checkbox>
          <Spacing h={22} />
          <Button
            title={t('auth:button.next')}
            onPress={proceedToNextScreen}
            disabled={!allowNext}
          />
        </FooterWrapper>
      )}
    >
      <ContentWrapper>
        {!existingUser && renderChooseUsername()}
        {existingUser && renderWelcomeBack()}
      </ContentWrapper>
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  onboarding: {
    user,
    errorMessage,
  },
}: RootReducerState): $Shape<Props> => ({
  user,
  errorMessage,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  checkUsernameAvailability: (username: string) => dispatch(checkUsernameAvailabilityAction(username)),
  resetUsernameCheck: () => dispatch(resetUsernameCheckAction(true)),
});

export default withTheme(connect(mapStateToProps, mapDispatchToProps)(NewProfile));
