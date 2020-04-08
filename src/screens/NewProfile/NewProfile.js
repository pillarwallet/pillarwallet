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
import styled, { withTheme } from 'styled-components/native';
import { Keyboard, Platform } from 'react-native';
import t from 'tcomb-form-native';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import debounce from 'lodash.debounce';

import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import { Wrapper } from 'components/Layout';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { BaseText, MediumText, Paragraph, TextLink } from 'components/Typography';
import { PERMISSIONS, SET_WALLET_PIN_CODE } from 'constants/navigationConstants';
import Button from 'components/Button';
import ProfileImage from 'components/ProfileImage';
import { InputTemplate, Form } from 'components/ProfileForm';
import { Username, MAX_USERNAME_LENGTH, MIN_USERNAME_LENGTH } from 'components/ProfileForm/profileFormDefs';
import Checkbox from 'components/Checkbox';
import { NextFooter } from 'components/Layout/NextFooter';
import HTMLContentModal from 'components/Modals/HTMLContentModal';

import { fontStyles, spacing } from 'utils/variables';
import { themedColors, getThemeColors } from 'utils/themes';

import { validateUserDetailsAction, registerOnBackendAction } from 'actions/onboardingActions';
import { USERNAME_EXISTS, USERNAME_OK, CHECKING_USERNAME, INVALID_USERNAME } from 'constants/walletConstants';

import type { Theme } from 'models/Theme';

const LoginForm = styled(Form)`
  margin-top: 20px;
  width: 100%;
`;

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
  padding: ${spacing.layoutSides}px;
`;

const InnerWrapper = styled.View`
  padding: 0 4px;
`;

const CheckboxText = styled(BaseText)`
  ${fontStyles.regular};
  color: ${themedColors.accent};
`;

const StyledTextLink = styled(TextLink)`
  ${fontStyles.regular};
`;

const Label = styled(MediumText)`
  ${fontStyles.medium};
  margin-top: 30px;
  margin-bottom: ${spacing.large}px;
`;

const formStructure = t.struct({
  username: Username,
});

const PROFILE_IMAGE_WIDTH = 144;

const getDefaultFormOptions = (inputDisabled: boolean, showRightPlaceholder?: boolean) => ({
  fields: {
    username: {
      auto: 'placeholders',
      placeholder: 'Username',
      template: InputTemplate,
      maxLength: MAX_USERNAME_LENGTH,
      config: {
        isLoading: false,
        inputProps: {
          autoCapitalize: 'none',
          disabled: inputDisabled,
          autoFocus: false,
        },
        statusIcon: null,
        statusIconColor: null,
        inputType: 'bigText',
        rightPlaceholder: showRightPlaceholder ? '.pillar.eth' : null,
      },
    },
  },
});

type Props = {
  navigation: NavigationScreenProp<*>,
  validateUserDetails: Function,
  resetWalletState: Function,
  walletState: ?string,
  session: Object,
  apiUser: Object,
  retry?: boolean,
  registerOnBackend: Function,
  importedWallet: ?Object,
  theme: Theme,
};

type State = {
  value: ?{
    username: ?string,
  },
  formOptions: Object,
  hasAgreedToTerms: boolean,
  hasAgreedToPolicy: boolean,
  isPendingCheck: boolean,
  visibleModal: string,
};

const TERMS_OF_USE_MODAL = 'TERMS_OF_USE_MODAL';
const PRIVACY_POLICY_MODAL = 'PRIVACY_POLICY_MODAL';

class NewProfile extends React.Component<Props, State> {
  _form: t.form;

  constructor(props: Props) {
    super(props);
    const { apiUser, importedWallet } = props;
    const value = apiUser && apiUser.username ? { username: apiUser.username } : null;
    const inputDisabled = !!(apiUser && apiUser.id);
    const showRightPlaceholder = !importedWallet;
    this.state = {
      value,
      formOptions: getDefaultFormOptions(inputDisabled, showRightPlaceholder),
      hasAgreedToTerms: false,
      hasAgreedToPolicy: false,
      isPendingCheck: false,
      visibleModal: '',
    };
    this.validateUsername = debounce(this.validateUsername, 800);
  }

  validateUsername = (username, hasError) => {
    const { validateUserDetails } = this.props;

    if (!hasError && username.length >= MIN_USERNAME_LENGTH) {
      validateUserDetails({ username });
    }
    this.setState({ isPendingCheck: false });
  };

  handleChange = (value: Object) => {
    // Because the idea is to display the inputError label on proper circumstances
    // here we don't validate minimum length, that's done on
    // this.renderChooseUsernameScreen() const shouldNextButtonBeDisabled
    const validateUsername = t.validate(value, formStructure);
    const isValidUsername = validateUsername.isValid();
    const { message: errorMessage = '' } = validateUsername.firstError() || {};
    const hasError = !isValidUsername && value.username;
    const { theme } = this.props;
    const colors = getThemeColors(theme);
    const statusIcon = hasError ? 'close' : null;
    const iconColor = hasError ? colors.negative : 'transparent';
    const options = t.update(this.state.formOptions, {
      fields: {
        username: {
          hasError: { $set: hasError },
          error: { $set: errorMessage },
          config: {
            statusIcon: { $set: statusIcon },
            statusIconColor: { $set: iconColor },
          },
        },
      },
    });
    this.setState({ formOptions: options, value, isPendingCheck: true });
    this.validateUsername(value.username, hasError);
  };

  handleSubmit = () => {
    Keyboard.dismiss();
    const { apiUser } = this.props;

    if (apiUser && apiUser.id) {
      this.goToNextScreen();
    } else {
      this.proceedWithSignup();
    }
  };

  proceedWithSignup = async () => {
    const { validateUserDetails, walletState } = this.props;
    const value = this._form.getValue();
    if (!value) return;
    await validateUserDetails({ username: value.username });
    if (walletState === USERNAME_OK) {
      this.goToNextScreen();
    }
  };

  componentDidUpdate(prevProps: Props) {
    const { walletState, theme } = this.props;
    const colors = getThemeColors(theme);
    if (prevProps.walletState === walletState) return;

    if (walletState === USERNAME_EXISTS || walletState === INVALID_USERNAME) {
      const errorMessage = walletState === USERNAME_EXISTS ? 'Username taken' : 'Invalid username';

      const options = t.update(this.state.formOptions, {
        fields: {
          username: {
            hasError: { $set: true },
            error: { $set: errorMessage },
            config: {
              isLoading: { $set: false },
              statusIcon: { $set: 'close' },
              statusIconColor: { $set: colors.negative },
            },
          },
        },
      });
      this.setState({ formOptions: options }); // eslint-disable-line
    }

    if (walletState === CHECKING_USERNAME) {
      const options = t.update(this.state.formOptions, {
        fields: {
          username: {
            config: {
              isLoading: { $set: true },
              statusIcon: { $set: null },
            },
          },
        },
      });
      this.setState({ formOptions: options }); // eslint-disable-line
    }

    if (walletState === USERNAME_OK) {
      const options = t.update(this.state.formOptions, {
        fields: {
          username: {
            config: {
              isLoading: { $set: false },
              statusIcon: { $set: 'check' },
              statusIconColor: { $set: colors.positive },
            },
          },
        },
      });
      this.setState({ formOptions: options }); // eslint-disable-line
    }
  }

  goToNextScreen() {
    const {
      navigation,
      retry,
      registerOnBackend,
    } = this.props;
    const { value } = this.state;
    Keyboard.dismiss();
    if (retry) {
      registerOnBackend();
      return;
    }
    const navProps = value ? { username: value.username } : null;
    if (Platform.OS === 'android') {
      navigation.navigate(PERMISSIONS, navProps);
    } else {
      navigation.navigate(SET_WALLET_PIN_CODE, navProps);
    }
  }

  renderChooseUsernameScreen() {
    const { value, formOptions } = this.state;
    return (
      <StyledWrapper>
        <InnerWrapper>
          { /* <Paragraph>
            Pillar is next generation smart wallet, payment network and identity manager.
          </Paragraph> */ }
          <Label>Please choose a username</Label>
        </InnerWrapper>
        <LoginForm
          innerRef={node => { this._form = node; }}
          type={formStructure}
          options={formOptions}
          value={value}
          onChange={this.handleChange}
        />
        <InnerWrapper>
          <Paragraph>
            This is how other people will find and recognize you on the Pillar platform.
          </Paragraph>
        </InnerWrapper>
      </StyledWrapper>
    );
  }

  renderWelcomeBackScreen() {
    const { apiUser } = this.props;
    return (
      <Wrapper flex={1} center regularPadding>
        <ProfileImage
          uri={apiUser.profileLargeImage}
          diameter={PROFILE_IMAGE_WIDTH}
          style={{ marginBottom: 47 }}
          userName={apiUser.username}
          initialsSize={48}
        />
        <UsernameWrapper>
          <Text>Welcome back,</Text>
          <Text>{apiUser.username}.</Text>
        </UsernameWrapper>
        <Paragraph small light center style={{ marginBottom: 40, paddingLeft: 40, paddingRight: 40 }}>
          Your Pillar Wallet is now restored. We are happy to see you again.
        </Paragraph>
        <Button marginBottom="20px" onPress={this.handleSubmit} title="Next" />
      </Wrapper>
    );
  }

  closeModals = () => {
    this.setState({ visibleModal: '' });
  };


  render() {
    const {
      apiUser,
      retry,
      walletState,
      session,
      importedWallet,
    } = this.props;
    const {
      hasAgreedToTerms,
      hasAgreedToPolicy,
      value,
      formOptions,
      isPendingCheck,
      visibleModal,
    } = this.state;
    const {
      fields: { username: { hasError: usernameHasErrors = false } },
    } = formOptions;

    const isUsernameValid = value && value.username && !usernameHasErrors;
    const isCheckingUsernameAvailability = walletState === CHECKING_USERNAME;
    const canGoNext = !!isUsernameValid && !isCheckingUsernameAvailability && !isPendingCheck && session.isOnline;
    const hasAgreedToAllTerms = !!hasAgreedToTerms && !!hasAgreedToPolicy;
    const allowNext = importedWallet ? canGoNext : canGoNext && hasAgreedToAllTerms;

    const headerProps = !apiUser.walletId
      ? {
        centerItems: [
          {
            title: 'Choose username',
          },
        ],
      }
      : {
        default: true,
        floating: true,
        transparent: true,
      };

    return (
      <ContainerWithHeader
        noBack={!!retry}
        headerProps={headerProps}
        putContentInScrollView={!apiUser.walletId}
        footer={!apiUser.walletId && (
          <NextFooter
            onNextPress={this.handleSubmit}
            nextDisabled={!allowNext}
            wrapperStyle={{ paddingBottom: 15, paddingTop: 15 }}
          >
            {!importedWallet &&
            <React.Fragment>
              <Checkbox
                onPress={() => { this.setState({ hasAgreedToTerms: !hasAgreedToTerms }); }}
                small
                lightText
                wrapperStyle={{ marginBottom: 16 }}
                checked={hasAgreedToTerms}
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
                checked={hasAgreedToPolicy}
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
            </React.Fragment>}
          </NextFooter>
        )}
        shouldFooterAvoidKeyboard={false}
      >
        <ContentWrapper>
          {!apiUser.walletId && this.renderChooseUsernameScreen()}
          {apiUser.walletId && this.renderWelcomeBackScreen()}
        </ContentWrapper>

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

const mapStateToProps = ({
  wallet: { walletState, onboarding: { apiUser, importedWallet } },
  session: { data: session },
}: RootReducerState): $Shape<Props> => ({
  walletState,
  apiUser,
  importedWallet,
  session,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  validateUserDetails: (user: Object) => dispatch(validateUserDetailsAction(user)),
  registerOnBackend: () => dispatch(registerOnBackendAction()),
});

export default withTheme(connect(mapStateToProps, mapDispatchToProps)(NewProfile));
