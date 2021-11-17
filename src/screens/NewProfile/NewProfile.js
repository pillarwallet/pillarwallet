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
import { Keyboard, Platform } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import { useDispatch } from 'react-redux';
import styled from 'styled-components/native';
import { debounce } from 'lodash';
import t from 'translations/translate';

// Components
import { Container, Content } from 'components/layout/Layout';
import HeaderBlock from 'components/HeaderBlock';
import { Wrapper, Spacing } from 'components/legacy/Layout';
import { BaseText, MediumText, Paragraph } from 'components/legacy/Typography';
import Button from 'components/legacy/Button';
import ProfileImage from 'components/ProfileImage';
import Checkbox from 'components/legacy/Checkbox';
import TextInput from 'components/legacy/TextInput';

// Constants
import { PERMISSIONS, SET_WALLET_PIN_CODE, TERMS_AND_PRIVACY } from 'constants/navigationConstants';
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';

// Selectors
import { useRootSelector } from 'selectors';

// Actions
import { checkUsernameAvailabilityAction, resetUsernameCheckAction } from 'actions/onboardingActions';

// Utils
import { fontStyles, spacing } from 'utils/variables';
import { useThemeColors, themedColors } from 'utils/themes';
import { validateUsername } from 'utils/validators';
import { getEnsPrefix } from 'utils/common';

// Types
import type { OnboardingUser } from 'models/User';

// Services
import { firebaseRemoteConfig } from 'services/firebase';

const PROFILE_IMAGE_WIDTH = 144;

const NewProfile = () => {
  const navigation = useNavigation();
  const colors = useThemeColors();

  const dispatch = useDispatch();

  const user = useRootSelector(root => root.onboarding.user);
  const errorMessage = useRootSelector(root => root.onboarding.errorMessage);

  const [usernameValue, setUsernameValue] = useState(null);
  const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false);
  const [hasAgreedToPolicy, setHasAgreedToPolicy] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  const prismicTermsOfPolicyDocumentId = firebaseRemoteConfig.getString(
    REMOTE_CONFIG.PRISMIC_TERMS_OF_POLICY_DOCUMENT_ID,
  );
  const prismicPrivacyPolicyDocumentId = firebaseRemoteConfig.getString(
    REMOTE_CONFIG.PRISMIC_PRIVACY_POLICY_DOCUMENT_ID,
  );

  const isUsernameInputDirty = usernameValue !== null;

  const usernameValidationErrorMessage = isUsernameInputDirty ? validateUsername(usernameValue) : null;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onValidUsername = useCallback(
    debounce(() => { if (usernameValue) dispatch(checkUsernameAvailabilityAction(usernameValue)); }, 200),
    [usernameValue],
  );

  useEffect(() => {
    // prepare for username check if no user set
    if (!user) dispatch(resetUsernameCheckAction(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const existingUser = !!user?.isExisting;

  const proceedToNextScreen = () => {
    Keyboard.dismiss();
    const navProps = usernameValue ? { username: usernameValue } : null;
    if (Platform.OS === 'android') {
      // $FlowFixMe: react-navigation types
      navigation.navigate(PERMISSIONS, navProps);
    } else {
      // $FlowFixMe: react-navigation types
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
            value: usernameValue || '',
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
        diameter={PROFILE_IMAGE_WIDTH}
        style={{ marginBottom: 47 }}
        userName={user?.username}
      />
      <UsernameWrapper>
        <Text>{t('auth:title.welcomeBack', { username: user?.username })}</Text>
      </UsernameWrapper>
      <Paragraph small light center style={{ marginBottom: 40, paddingLeft: 40, paddingRight: 40 }}>
        {t('auth:paragraph.successfullyRestoredWallet')}
      </Paragraph>
      <Button marginBottom={20} onPress={proceedToNextScreen} title={t('auth:button.next')} />
    </Wrapper>
  );

  const hasAgreedToAllTerms = !!hasAgreedToTerms && !!hasAgreedToPolicy;

  const allowNext = isUsernameInputDirty
    && !usernameValidationErrorMessage
    && !errorMessage
    && !isCheckingUsername
    && (existingUser || hasAgreedToAllTerms);

  const headerProps = existingUser
    ? { floating: true, transparent: true }
    : { centerItems: [{ title: t('auth:title.chooseUsername') }] };

  const openLegalScreen = (documentId: string, documentName: string) => {
    navigation.navigate(TERMS_AND_PRIVACY, { prismicDocumentId: documentId, prismicDocumentName: documentName });
  };

  return (
    <Container>
      <HeaderBlock {...headerProps} navigation={navigation} />

      <Content paddingHorizontal={0} paddingVertical={0} scrollEnabled={!existingUser}>
        <ContentWrapper>
          {!existingUser && renderChooseUsername()}
          {existingUser && renderWelcomeBack()}
        </ContentWrapper>

        {!existingUser && (
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
                  onPress: () => openLegalScreen(prismicTermsOfPolicyDocumentId, t('auth:termsOfUse')),
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
                  onPress: () => openLegalScreen(prismicPrivacyPolicyDocumentId, t('auth:privacyPolicy')),
                })}
              </CheckboxText>
            </Checkbox>
            <Spacing h={22} />
            <Button title={t('auth:button.next')} onPress={proceedToNextScreen} disabled={!allowNext} />
          </FooterWrapper>
        )}
      </Content>
    </Container>
  );
};

export default NewProfile;

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
`;

const CheckboxText = styled(BaseText)`
  ${fontStyles.regular};
  color: ${themedColors.accent};
`;

const FooterWrapper = styled.View`
  padding: 0 ${spacing.layoutSides}px 20px;
`;
