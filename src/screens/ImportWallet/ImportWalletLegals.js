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

import * as React from 'react';
import { Platform, BackHandler } from 'react-native';
import type { NativeStackNavigationProp as NavigationScreenProp } from '@react-navigation/native-stack';
import styled from 'styled-components/native';
import t from 'translations/translate';
import type { Route } from '@react-navigation/native';

// Components
import ContainerWithHeader from 'components/legacy/Layout/ContainerWithHeader';
import { BaseText } from 'components/legacy/Typography';
import Button from 'components/legacy/Button';
import Checkbox from 'components/legacy/Checkbox';

// Utils
import { spacing, fontStyles } from 'utils/variables';
import { themedColors } from 'utils/themes';

// Services
import { firebaseRemoteConfig } from 'services/firebase';

// Constants
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';
import { IMPORT_WALLET, ONBOARDING_LEGAL_SCREEN, AUTH_FLOW } from 'constants/navigationConstants';

type Props = {
  navigation: NavigationScreenProp<*>,
  route: Route
};

type State = {
  hasAgreedToTerms: boolean,
  hasAgreedToPolicy: boolean,
};

class ImportWalletLegals extends React.Component<Props, State> {
  backHandler: any;
  state = {
    hasAgreedToTerms: false,
    hasAgreedToPolicy: false,
  };

  handleBackAction = () => {
    const { navigation, route } = this.props;
    const navigateTo = route?.params?.navigateTo || null;
    if (navigateTo) {
      navigation.navigate(AUTH_FLOW, { screen: navigateTo });
    } else {
      navigation.goBack();
    }
  };

  physicalBackAction = () => {
    this.handleBackAction();
    return true;
  };

  componentDidMount() {
    const { route } = this.props;
    const navigateTo = route?.params?.navigateTo || null;

    if (Platform.OS === 'android' && navigateTo) {
      this.backHandler = BackHandler.addEventListener('hardwareBackPress', this.physicalBackAction);
    }
  }

  componentWillUnmount() {
    if (Platform.OS === 'android' && this.backHandler) {
      this.backHandler.remove();
    }
  }

  openLegalScreen = (documentId: string, documentName: string) => {
    const { navigation } = this.props;
    navigation.navigate(ONBOARDING_LEGAL_SCREEN, { prismicDocumentId: documentId, prismicDocumentName: documentName });
  };

  render() {
    const { navigation } = this.props;
    const { hasAgreedToTerms, hasAgreedToPolicy } = this.state;

    const canGoNext = hasAgreedToTerms && hasAgreedToPolicy;
    const prismicTermsOfPolicyDocumentId = firebaseRemoteConfig.getString(
      REMOTE_CONFIG.PRISMIC_TERMS_OF_POLICY_DOCUMENT_ID,
    );
    const prismicPrivacyPolicyDocumentId = firebaseRemoteConfig.getString(
      REMOTE_CONFIG.PRISMIC_PRIVACY_POLICY_DOCUMENT_ID,
    );

    return (
      <ContainerWithHeader
        headerProps={{
          centerItems: [{ title: t('auth:title.recoverWallet') }],
          customOnBack: this.handleBackAction,
        }}
      >
        <Wrapper>
          <ContentWrapper>
            <Checkbox
              onPress={() => {
                this.setState({ hasAgreedToTerms: !hasAgreedToTerms });
              }}
              small
              lightText
              wrapperStyle={{ marginBottom: 16 }}
              checked={hasAgreedToTerms}
              testID={`${TAG}-checkbox-agree_to_terms`}
              // eslint-disable-next-line i18next/no-literal-string
              accessibilityLabel={`${TAG}-checkbox-agree_to_terms`}
            >
              <CheckboxText>
                {t('auth:withLink.readUnderstandAgreeTo', {
                  linkedText: t('auth:termsOfUse'),
                  onPress: () => this.openLegalScreen(prismicTermsOfPolicyDocumentId, t('auth:termsOfUse')),
                })}
              </CheckboxText>
            </Checkbox>
            <Checkbox
              onPress={() => {
                this.setState({ hasAgreedToPolicy: !hasAgreedToPolicy });
              }}
              small
              lightText
              checked={hasAgreedToPolicy}
              testID={`${TAG}-checkbox-agree_to_policy`}
              // eslint-disable-next-line i18next/no-literal-string
              accessibilityLabel={`${TAG}-checkbox-agree_to_policy`}
            >
              <CheckboxText>
                {t('auth:withLink.readUnderstandAgreeTo', {
                  linkedText: t('auth:privacyPolicy'),
                  onPress: () => this.openLegalScreen(prismicPrivacyPolicyDocumentId, t('auth:privacyPolicy')),
                })}
              </CheckboxText>
            </Checkbox>
          </ContentWrapper>
          <ButtonWrapper>
            <StyledButton
              disabled={!canGoNext}
              title={t('auth:button.proceed')}
              onPress={() => navigation.navigate(IMPORT_WALLET)}
              testID={`${TAG}-button-proceed`}
              // eslint-disable-next-line i18next/no-literal-string
              accessibilityLabel={`${TAG}-button-proceed`}
            />
          </ButtonWrapper>
        </Wrapper>
      </ContainerWithHeader>
    );
  }
}

export default ImportWalletLegals;

const Wrapper = styled.View`
  flex: 1;
  padding: ${spacing.large}px;
  justify-content: space-between;
`;

const ContentWrapper = styled.View``;

const ButtonWrapper = styled.View`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: ${spacing.large}px;
`;

const CheckboxText = styled(BaseText)`
  ${fontStyles.regular};
  color: ${themedColors.accent};
`;

const StyledButton = styled(Button)`
  margin: 0 6px;
`;

const TAG = 'ImportWalletLegals';
