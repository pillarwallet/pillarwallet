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
import { WALLET_RECOVERY_OPTIONS } from 'constants/navigationConstants';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { TextLink, BaseText } from 'components/Typography';
import HTMLContentModal from 'components/Modals/HTMLContentModal';
import Button from 'components/Button';
import Checkbox from 'components/Checkbox';
import { spacing, fontStyles } from 'utils/variables';
import { themedColors } from 'utils/themes';

type Props = {
  navigation: NavigationScreenProp<*>,
};

type State = {
  visibleModal: string,
  hasAgreedToTerms: boolean,
  hasAgreedToPolicy: boolean,
};

const TERMS_OF_USE_MODAL = 'TERMS_OF_USE_MODAL';
const PRIVACY_POLICY_MODAL = 'PRIVACY_POLICY_MODAL';

const Wrapper = styled.View`
  flex: 1;
  padding: ${spacing.large}px;
  justify-content: space-between;
`;

const ContentWrapper = styled.View`
`;

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

const StyledTextLink = styled(TextLink)`
  ${fontStyles.regular};
  color: ${themedColors.primary};
`;

const StyledButton = styled(Button)`
  margin: 0 6px;
`;

class ImportWalletLegals extends React.Component<Props, State> {
  state = {
    visibleModal: '',
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

  closeModals = () => {
    this.setState({ visibleModal: '' });
  };

  render() {
    const { navigation } = this.props;
    const {
      visibleModal,
      hasAgreedToTerms,
      hasAgreedToPolicy,
    } = this.state;

    const canGoNext = hasAgreedToTerms && hasAgreedToPolicy;

    return (
      <ContainerWithHeader
        headerProps={({
          centerItems: [{ title: 'Recover wallet' }],
          customOnBack: this.handleBackAction,
        })}
      >
        <Wrapper>
          <ContentWrapper>
            <Checkbox
              onPress={() => { this.setState({ hasAgreedToTerms: !hasAgreedToTerms }); }}
              small
              lightText
              wrapperStyle={{ marginBottom: 16 }}
            >
              <CheckboxText>
                {'I have read, understand, and agree to the '}
                <StyledTextLink
                  onPress={() => { this.setState({ visibleModal: TERMS_OF_USE_MODAL }); }}
                >
                  Terms of Use
                </StyledTextLink>
              </CheckboxText>
            </Checkbox>
            <Checkbox
              onPress={() => { this.setState({ hasAgreedToPolicy: !hasAgreedToPolicy }); }}
              small
              lightText
            >
              <CheckboxText>
                {'I have read, understand, and agree to the '}
                <StyledTextLink
                  onPress={() => { this.setState({ visibleModal: PRIVACY_POLICY_MODAL }); }}
                >
                  Privacy policy
                </StyledTextLink>
              </CheckboxText>
            </Checkbox>
          </ContentWrapper>
          <ButtonWrapper>
            <StyledButton
              disabled={!canGoNext}
              title="Proceed"
              onPress={() => navigation.navigate(WALLET_RECOVERY_OPTIONS)}
            />
          </ButtonWrapper>
        </Wrapper>
        <HTMLContentModal
          isVisible={visibleModal === TERMS_OF_USE_MODAL}
          modalHide={this.closeModals}
          htmlEndpoint="terms_of_service"
        />
        <HTMLContentModal
          isVisible={visibleModal === PRIVACY_POLICY_MODAL}
          modalHide={this.closeModals}
          htmlEndpoint="privacy_policy"
        />
      </ContainerWithHeader>
    );
  }
}

export default ImportWalletLegals;
