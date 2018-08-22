// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { Keyboard } from 'react-native';
import t from 'tcomb-form-native';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import { baseColors, spacing } from 'utils/variables';
import { Container, Footer, Wrapper } from 'components/Layout';
import { BaseText } from 'components/Typography';
import { LEGAL_TERMS, PIN_CODE_CONFIRMATION } from 'constants/navigationConstants';
import TextInput from 'components/TextInput';
import Spinner from 'components/Spinner';
import Header from 'components/Header';
import Button from 'components/Button';
import { validateUserDetailsAction } from 'actions/onboardingActions';
import { USERNAME_EXISTS, USERNAME_OK, CHECKING_USERNAME } from 'constants/walletConstants';

const { Form } = t.form;
const maxUsernameLength = 20;

const LoginForm = styled(Form)`
  margin: 10px 0 40px;
`;

const LoadingMessageWrapper = styled.View`
  align-items: center;
  flex-direction: row;
  margin: ${spacing.rhythm}px 0;
  width: 100%;
`;

const LoadingMessage = styled(BaseText)`
  color: ${baseColors.darkGray};
  margin-left: 10px;
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
    />
  );
}

const usernameRegex = /^[a-z0-9._-]+$/i;
const Username = t.refinement(t.String, (username): boolean => {
  return username != null && username.length <= maxUsernameLength && usernameRegex.test(username);
});

Username.getValidationErrorMessage = (username): string => {
  if (username != null && username.length > maxUsernameLength) {
    return `Username should be less than ${maxUsernameLength} characters.`;
  }
  if (username != null && !(usernameRegex.test(username))) {
    return 'Only use alpha-numeric characters, underscores, dashes or full stops.';
  }
  return 'Please specify the username.';
};

const formStructure = t.struct({
  username: Username,
});

const getDefaultFormOptions = (inputDisabled: boolean) => ({
  fields: {
    username: {
      template: InputTemplate,
      maxLength: maxUsernameLength,
      config: {
        inputProps: {
          autoCapitalize: 'none',
          disabled: inputDisabled,
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
  apiUser: Object,
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
          },
        },
      });
      this.setState({ formOptions: options }); // eslint-disable-line
    }

    if (walletState === USERNAME_OK) {
      this.goToNextScreen();
    }
  }

  goToNextScreen() {
    const { navigation } = this.props;
    Keyboard.dismiss();
    navigation.navigate(LEGAL_TERMS);
  }

  render() {
    const { value, formOptions } = this.state;
    const { walletState } = this.props;
    const isUsernameValid = value && value.username && value.username.length > 0;
    const isCheckingUsernameAvailability = walletState === CHECKING_USERNAME;
    const shouldNextButtonBeDisabled = !isUsernameValid || isCheckingUsernameAvailability;

    return (
      <Container>
        <Header
          title="choose username"
          onBack={() => this.props.navigation.goBack(PIN_CODE_CONFIRMATION)}
        />
        <Wrapper regularPadding>
          <LoginForm
            innerRef={node => { this._form = node; }}
            type={formStructure}
            options={formOptions}
            value={value}
            onChange={this.handleChange}
          />
          {isCheckingUsernameAvailability &&
            <LoadingMessageWrapper>
              <Spinner />
              <LoadingMessage>Checking username availability…</LoadingMessage>
            </LoadingMessageWrapper>
          }

        </Wrapper>

        <Footer>

          <Button
            small
            flexRight
            onPress={this.handleSubmit}
            disabled={shouldNextButtonBeDisabled}
            title="Next"
          />

        </Footer>
      </Container>
    );
  }
}

const mapStateToProps = ({ wallet: { walletState, onboarding: { apiUser } } }) => ({ walletState, apiUser });

const mapDispatchToProps = (dispatch) => ({
  validateUserDetails: (user: Object) => dispatch(validateUserDetailsAction(user)),
});

export default connect(mapStateToProps, mapDispatchToProps)(NewProfile);
