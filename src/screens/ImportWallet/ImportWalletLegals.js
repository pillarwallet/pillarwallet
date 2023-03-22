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
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native';
import t from 'translations/translate';

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
import { IMPORT_WALLET, ONBOARDING_LEGAL_SCREEN } from 'constants/navigationConstants';

type Props = {
  navigation: NavigationScreenProp<*>,
};

type State = {
  hasAgreedToTerms: boolean,
  hasAgreedToPolicy: boolean,
};

class ImportWalletLegals extends React.Component<Props, State> {
  state = {
    hasAgreedToTerms: false,
    hasAgreedToPolicy: false,
  };

  physicalBackAction = () => {
    this.handleBackAction();
    return true;
  };

  componentDidMount() {
    const { navigation } = this.props;
    const navigateTo = navigation.getParam('navigateTo', null);

    if (Platform.OS === 'android' && navigateTo) {
      BackHandler.addEventListener('hardwareBackPress', this.physicalBackAction);
    }
  }

  componentWillUnmount() {
    if (Platform.OS === 'android') {
      BackHandler.removeEventListener('hardwareBackPress', this.physicalBackAction);
    }
  }

  handleBackAction = () => {
    const { navigation } = this.props;
    const navigateTo = navigation.getParam('navigateTo', null);
    if (navigateTo) {
      navigation.navigate(navigateTo);
    } else {
      navigation.goBack(null);
    }
  };

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
