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
import styled from 'styled-components/native';
import { Keyboard } from 'react-native';
import t from 'tcomb-form-native';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import { Container, Footer, Wrapper } from 'components/Layout';
import { BoldText, Paragraph } from 'components/Typography';
import { SET_WALLET_PIN_CODE } from 'constants/navigationConstants';
import Header from 'components/Header';
import Button from 'components/Button';
import ProfileImage from 'components/ProfileImage';
import { validateUserDetailsAction, registerOnBackendAction } from 'actions/onboardingActions';
import { USERNAME_EXISTS, USERNAME_OK, CHECKING_USERNAME, INVALID_USERNAME } from 'constants/walletConstants';
import { fontSizes, fontWeights } from 'utils/variables';
import { InputTemplate, Form } from 'components/ProfileForm';
import { Username, MAX_USERNAME_LENGTH } from 'components/ProfileForm/profileFormDefs';

const IntroParagraph = styled(Paragraph)`
  margin: 10px 0 50px;
`;

const LoginForm = styled(Form)``;

const UsernameWrapper = styled(Wrapper)`
  margin: 36px 0 20px;
  align-self: center;
  justify-content: flex-end;
  align-items: center;
  position: relative;
  top: 2px;
`;

const Text = styled(BoldText)`
  line-height: ${fontSizes.large};
  font-size: ${fontSizes.large};
  font-weight: ${fontWeights.bold};
  width: 100%;
  text-align: center;
  max-width: 230px;
`;

const formStructure = t.struct({
  username: Username,
});

const PROFILE_IMAGE_WIDTH = 144;

const getDefaultFormOptions = (inputDisabled: boolean, isLoading?: boolean) => ({
  fields: {
    username: {
      auto: 'placeholders',
      placeholder: 'Username',
      template: InputTemplate,
      maxLength: MAX_USERNAME_LENGTH,
      config: {
        isLoading,
        inputProps: {
          autoCapitalize: 'none',
          disabled: inputDisabled,
          autoFocus: true,
        },
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
};

type State = {
  value: ?{
    username: ?string,
  },
  formOptions: Object,
};

class NewProfile extends React.Component<Props, State> {
  _form: t.form;

  constructor(props: Props) {
    super(props);
    const { apiUser } = props;
    const value = apiUser && apiUser.username ? { username: apiUser.username } : null;
    const inputDisabled = !!(apiUser && apiUser.id);
    this.state = {
      value,
      formOptions: getDefaultFormOptions(inputDisabled),
    };
  }

  handleChange = (value: Object) => {
    // Because the idea is to display the inputError label on proper circumstances
    // here we don't validate minimum length, that's done on
    // this.renderChooseUsernameScreen() const shouldNextButtonBeDisabled
    const validateUsername = t.validate(value, formStructure);
    const isValidUsername = validateUsername.isValid();
    const { message: errorMessage = '' } = validateUsername.firstError() || {};

    const options = t.update(this.state.formOptions, {
      fields: {
        username: {
          hasError: { $set: !isValidUsername && value.username },
          error: { $set: errorMessage },
        },
      },
    });
    this.setState({ formOptions: options, value });
  };

  handleSubmit = () => {
    Keyboard.dismiss();
    const { validateUserDetails, apiUser } = this.props;

    if (apiUser && apiUser.id) {
      this.goToNextScreen();
      return;
    }

    const value = this._form.getValue();
    if (!value) return;
    validateUserDetails({ username: value.username });
  };

  componentDidUpdate(prevProps: Props) {
    const { walletState } = this.props;
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
            },
          },
        },
      });
      this.setState({ formOptions: options }); // eslint-disable-line
      this.goToNextScreen();
    }
  }

  goToNextScreen() {
    const {
      navigation,
      retry,
      registerOnBackend,
      apiUser,
    } = this.props;
    Keyboard.dismiss();
    if (retry) {
      registerOnBackend();
      return;
    }
    const navigationParams = {};
    if (apiUser && apiUser.id) navigationParams.returningUser = true;
    navigation.navigate(SET_WALLET_PIN_CODE, navigationParams);
  }

  renderChooseUsernameScreen() {
    const { value, formOptions } = this.state;
    const {
      walletState,
      session,
      retry,
    } = this.props;
    const {
      fields: { username: { hasError: usernameHasErrors = false } },
    } = formOptions;

    const isUsernameValid = value && value.username && !usernameHasErrors;
    const isCheckingUsernameAvailability = walletState === CHECKING_USERNAME;
    const shouldNextButtonBeDisabled = !isUsernameValid || isCheckingUsernameAvailability || !session.isOnline;
    return (
      <React.Fragment>
        <Wrapper>
          <Header
            title="let's get started"
            onBack={retry ? undefined : () => this.props.navigation.goBack()}
          />
          <Wrapper regularPadding>
            <IntroParagraph light small>
              Choose your unique username now. It cannot be changed in future.
            </IntroParagraph>
            <LoginForm
              innerRef={node => { this._form = node; }}
              type={formStructure}
              options={formOptions}
              value={value}
              onChange={this.handleChange}
            />
          </Wrapper>
        </Wrapper>
        <Footer>
          {!!isUsernameValid &&
          <Button
            onPress={this.handleSubmit}
            disabled={shouldNextButtonBeDisabled}
            title="Next"
          />
          }
        </Footer>
      </React.Fragment>
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
          initialsSize={fontSizes.extraGiant}
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

  render() {
    const { apiUser } = this.props;

    return (
      <Container>
        {!apiUser.walletId && this.renderChooseUsernameScreen()}
        {apiUser.walletId && this.renderWelcomeBackScreen()}
      </Container>
    );
  }
}

const mapStateToProps = ({
  wallet: { walletState, onboarding: { apiUser } },
  session: { data: session },
}) => ({
  walletState,
  apiUser,
  session,
});

const mapDispatchToProps = (dispatch) => ({
  validateUserDetails: (user: Object) => dispatch(validateUserDetailsAction(user)),
  registerOnBackend: () => dispatch(registerOnBackendAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(NewProfile);
