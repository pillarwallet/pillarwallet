// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { Keyboard } from 'react-native';
import t from 'tcomb-form-native';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import { Container, Footer, Wrapper } from 'components/Layout';
import { Paragraph } from 'components/Typography';
import { SET_WALLET_PIN_CODE } from 'constants/navigationConstants';
import TextInput from 'components/TextInput';
import Header from 'components/Header';
import Button from 'components/Button';
import Title from 'components/Title';
import ProfileImage from 'components/ProfileImage';
import { validateUserDetailsAction, registerOnBackendAction } from 'actions/onboardingActions';
import { USERNAME_EXISTS, USERNAME_OK, CHECKING_USERNAME } from 'constants/walletConstants';
import { isIphoneX } from 'utils/common';

const { Form } = t.form;
const MIN_USERNAME_LENGTH = 4;
const MAX_USERNAME_LENGTH = 30;

const IntroParagraph = styled(Paragraph)`
  margin: 10px 0 50px;
`;

const LoginForm = styled(Form)`
`;

function InputTemplate(locals) {
  const errorMessage = locals.error;
  const inputProps = {
    onChange: locals.onChange,
    onBlur: locals.onBlur,
    value: locals.value,
    keyboardType: locals.keyboardType,
    style: {
      fontSize: 24,
      lineHeight: 0,
    },
    ...locals.config.inputProps,
  };

  return (
    <TextInput
      errorMessage={errorMessage}
      id={locals.label}
      label={locals.label}
      inputProps={inputProps}
      inputType="secondary"
      noBorder
      loading={locals.config.isLoading}
    />
  );
}
const usernameRegex = /^[a-z]+[a-z0-9-]+[a-z0-9]$/i;
const startsWithNumberRegex = /[0-9]/i;
const Username = t.refinement(t.String, (username): boolean => {
  return username != null
    && username.length >= MIN_USERNAME_LENGTH
    && username.length <= MAX_USERNAME_LENGTH
    && usernameRegex.test(username);
});

Username.getValidationErrorMessage = (username): string => {
  if (username != null && username.length < MIN_USERNAME_LENGTH) {
    return `Username should be longer than ${MIN_USERNAME_LENGTH - 1} characters.`;
  }
  if (username != null && username.length > MAX_USERNAME_LENGTH) {
    return `Username should be less than ${MAX_USERNAME_LENGTH + 1} characters.`;
  }
  if (username != null && !(usernameRegex.test(username))) {
    if (startsWithNumberRegex.test(username)) return 'Username can not start with a number';
    if (username.startsWith('-') || username.endsWith('-')) return 'Username can not start or end with a dash';
    return 'Only use alpha-numeric characters or dashes';
  }
  return 'Please specify the username.';
};

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
    const options = t.update(this.state.formOptions, {
      fields: {
        username: {
          hasError: { $set: false },
          error: { $set: '' },
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

    if (walletState === USERNAME_EXISTS) {
      const options = t.update(this.state.formOptions, {
        fields: {
          username: {
            hasError: { $set: true },
            error: { $set: 'Username taken' },
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
    const isUsernameValid = value && value.username && value.username.length > 0;
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
          {!!value && !!value.username && value.username.length > 2 &&
          <Button
            onPress={this.handleSubmit}
            disabled={shouldNextButtonBeDisabled}
            title="Next"
            marginBottom={isIphoneX() ? '20px' : '0px'}
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
          uri={apiUser.profileImage}
          diameter={PROFILE_IMAGE_WIDTH}
          style={{ marginBottom: 47 }}
        />
        <Title
          title={`Welcome back, ${apiUser.username}!`}
          align="center"
          noBlueDot
        />
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
