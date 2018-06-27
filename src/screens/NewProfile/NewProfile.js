// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import t from 'tcomb-form-native';
import { connect } from 'react-redux';
import { KeyboardAvoidingView } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import { Container, ScrollWrapper } from 'components/Layout';
import { LEGAL_TERMS } from 'constants/navigationConstants';
import HeaderLink from 'components/HeaderLink';
import TextInput from 'components/TextInput';
import { Paragraph } from 'components/Typography';
import Title from 'components/Title';
import { updateLocalUserAction } from 'actions/userActions';
import { isValidFullname } from 'utils/validators';

const { Form } = t.form;
const maxUsernameLength = 60;

const LoginForm = styled(Form)`
  margin: 10px 0 40px;
`;

type Props = {
  navigation: NavigationScreenProp<*>,
  updateUser: Function,
}

type State = {
  value: ?{
    username: ?string,
    fullName: ?string,
  },
}

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

const FullName = t.refinement(t.String, (fullName): boolean => {
  return isValidFullname(fullName);
});

const Username = t.refinement(t.String, (username): boolean => {
  return username != null && username.length <= maxUsernameLength;
});

FullName.getValidationErrorMessage = (): string => {
  return 'Please provide your full name';
};

Username.getValidationErrorMessage = (username): string => {
  if (username != null && username.length > maxUsernameLength) {
    return `Username should be less than ${maxUsernameLength} characters.`;
  }
  return 'Please specify username.';
};

const formStructure = t.struct({
  username: Username,
  fullName: FullName,
});

const formOptions = {
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
    fullName: {
      template: InputTemplate,
      config: {
        inputProps: {
          autoCapitalize: 'words',
        },
      },
    },
  },
};

class NewProfile extends React.Component<Props, State> {
  _form: t.form;

  state = {
    value: null,
  };

  static navigationOptions = ({ navigation }: { navigation: NavigationScreenProp<*> }) => {
    const { params = {} } = navigation.state;
    return {
      headerRight: (
        <HeaderLink onPress={params.handleSubmit}>
          Next
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
    this.setState({
      value,
    });
  };

  handleSubmit = () => {
    const { navigation, updateUser } = this.props;
    const value = this._form.getValue();
    if (!value) return;
    const [firstName, ...lastName] = value.fullName.split(' ');
    updateUser({
      username: value.username,
      firstName,
      lastName: lastName.join(' '),
    });
    navigation.navigate(LEGAL_TERMS);
  };

  render() {
    const { value } = this.state;
    return (
      <Container>
        <ScrollWrapper regularPadding>
          <Title title="create profile" />
          <Paragraph>Fill out your profile.</Paragraph>
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

const mapDispatchToProps = (dispatch) => ({
  updateUser: (user: Object) => dispatch(updateLocalUserAction(user, true)),
});

export default connect(null, mapDispatchToProps)(NewProfile);
