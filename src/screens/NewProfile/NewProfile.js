// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import t from 'tcomb-form-native';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import { Container, ScrollWrapper } from 'components/Layout';
import { LEGAL_TERMS } from 'constants/navigationConstants';
import HeaderLink from 'components/HeaderLink';
import TextInput from 'components/TextInput';
import Title from 'components/Title';
import { updateLocalUserAction } from 'actions/userActions';
import { validateUserDetailsAction } from 'actions/onboardingActions';
import { USERNAME_EXISTS, USERNAME_OK } from 'constants/walletConstants';
import NextButton from './NextButton';

const { Form } = t.form;
const maxUsernameLength = 20;

const LoginForm = styled(Form)`
  margin: 10px 0 40px;
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

const Username = t.refinement(t.String, (username): boolean => {
  return username != null && username.length <= maxUsernameLength;
});

Username.getValidationErrorMessage = (username): string => {
  if (username != null && username.length > maxUsernameLength) {
    return `Username should be less than ${maxUsernameLength} characters.`;
  }
  return 'Please specify the username.';
};

const formStructure = t.struct({
  username: Username,
});

const defaultFormOptions = {
  fields: {
    username: {
      template: InputTemplate,
      maxLength: maxUsernameLength,
      config: {
        inputProps: {
          autoCapitalize: 'none',
        },
      },
    },
  },
};

type Props = {
  navigation: NavigationScreenProp<*>,
  updateUser: Function,
  validateUserDetails: Function,
  resetWalletState: Function,
  walletState: ?string,
};

type State = {
  value: ?{
    username: ?string,
  },
  formOptions: Object,
};

class NewProfile extends React.Component<Props, State> {
  _form: t.form;

  state = {
    value: null,
    formOptions: defaultFormOptions,
  };

  static navigationOptions = ({ navigation }: { navigation: NavigationScreenProp<*> }) => {
    const { params = {} } = navigation.state;
    return {
      headerRight: (
        <HeaderLink onPress={params.handleSubmit}>
          <NextButton />
        </HeaderLink>
      ),
    };
  };

  componentDidMount() {
    const { navigation } = this.props;
    navigation.setParams({
      handleSubmit: this.handleSubmit,
    });
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
    const { validateUserDetails } = this.props;
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
      this.setState({ formOptions: options });// eslint-disable-line
    }

    if (walletState === USERNAME_OK) {
      const { navigation, updateUser } = this.props;
      const value = this._form.getValue();
      updateUser({ username: value.username });
      navigation.navigate(LEGAL_TERMS);
    }
  }

  render() {
    const { value, formOptions } = this.state;
    return (
      <Container>
        <ScrollWrapper regularPadding>
          <Title title="choose your username" />
          <LoginForm
            innerRef={node => { this._form = node; }}
            type={formStructure}
            options={formOptions}
            value={value}
            onChange={this.handleChange}
          />
        </ScrollWrapper>
      </Container>
    );
  }
}

const mapStateToProps = ({ wallet: { walletState } }) => ({ walletState });

const mapDispatchToProps = (dispatch) => ({
  updateUser: (user: Object) => dispatch(updateLocalUserAction(user, true)),
  validateUserDetails: (user: Object) => dispatch(validateUserDetailsAction(user)),
});

export default connect(mapStateToProps, mapDispatchToProps)(NewProfile);
