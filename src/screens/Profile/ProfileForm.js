// @flow

import React from 'react';
import t from 'tcomb-form-native';
import styled from 'styled-components/native';
import TextInput from 'components/TextInput';
import { Wrapper } from 'components/Layout';
import { spacing } from 'utils/variables';
import Button from 'components/Button';
import { isValidEmail, isValidName, isValidCityName } from 'utils/validators';

const StyledWrapper = styled(Wrapper)`
  justify-content: space-between;
  padding-bottom: ${spacing.rhythm}px;
  margin-top: 25px;
`;

const FormFooter = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 0 20px;
  width: 100%;
`;

type Field = {
  name: string,
  type: string,
  label: string,
  config: Object,
}

type Props = {
  fields: Field[],
  onSubmit: Function,
  value: Object,
}

type State = {
  value: Object,
}

function InputTemplate(locals) {
  const { config } = locals;
  const errorMessage = locals.error;
  const inputProps = {
    autoCapitalize: config.autoCapitalize || 'words',
    onChange: locals.onChange,
    onBlur: locals.onBlur,
    value: locals.value,
    keyboardType: config.keyboardType || 'default',
    style: {
      fontSize: 24,
      lineHeight: 0,
    },
    placeholder: config.placeholder,
    ...locals.config.inputProps,
  };

  return (
    <TextInput
      errorMessage={errorMessage}
      id={locals.label}
      inputProps={inputProps}
      inputType="secondary"
      noBorder
    />
  );
}

const { Form } = t.form;

const maxLength = 100;
const halfMaxLength = maxLength / 2;

const FirstNameStruct = t.refinement(t.String, (firstName: string = ''): boolean => {
  return !!firstName && !!firstName.length && isValidName(firstName) && firstName.length <= halfMaxLength;
});

const LastNameStruct = t.refinement(t.String, (lastName: string = ''): boolean => {
  return !!lastName && !!lastName.length && isValidName(lastName) && lastName.length <= halfMaxLength;
});

const EmailStruct = t.refinement(t.String, (email: string = ''): boolean => {
  return !!email && !!email.length && isValidEmail(email) && email.length <= maxLength;
});

const CityStruct = t.refinement(t.String, (city: string = ''): boolean => {
  return !!city && !!city.length && isValidCityName(city) && city.length <= maxLength;
});

FirstNameStruct.getValidationErrorMessage = (firstName): string => {
  if (firstName) {
    if (!isValidName(firstName)) {
      return 'Please enter a valid first name';
    } else if (firstName.length > halfMaxLength) {
      return `First name should not be longer than ${halfMaxLength} symbols`;
    }
  }
  return 'Please specify your first name';
};

LastNameStruct.getValidationErrorMessage = (lastName): string => {
  if (lastName) {
    if (!isValidName(lastName)) {
      return 'Please enter a valid last name';
    } else if (lastName.length > halfMaxLength) {
      return `Last name should not be longer than ${halfMaxLength} symbols`;
    }
  }
  return 'Please specify your last name';
};

EmailStruct.getValidationErrorMessage = (email): string => {
  if (email) {
    if (!isValidEmail(email)) {
      return 'Please enter a valid email';
    } else if (email.length > maxLength) {
      return `Email should not be longer than ${maxLength} symbols`;
    }
  }
  return 'Please specify your email';
};

CityStruct.getValidationErrorMessage = (city): string => {
  if (city) {
    if (!isValidCityName(city)) {
      return 'Please enter a valid city';
    } else if (city.length > maxLength) {
      return `City should not be longer than ${maxLength} symbols`;
    }
  }
  return 'Please specify your city';
};


const defaultTypes = {
  string: t.String,
  number: t.Number,
  email: EmailStruct,
  firstName: FirstNameStruct,
  lastName: LastNameStruct,
  city: CityStruct,
};

const getFormStructure = (fields: Field[]) => {
  const fieldsStructure = fields.reduce((memo, field) => {
    memo[field.name] = defaultTypes[field.type];
    return memo;
  }, {});
  return t.struct(fieldsStructure);
};

const generateFormOptions = (fields: Field[]): Object => {
  const options = fields.reduce((memo, field) => {
    memo[field.name] = {
      template: InputTemplate,
      config: field.config,
    };

    return memo;
  }, {});
  return {
    fields: {
      ...options,
    },
  };
};

export default class ProfileForm extends React.Component<Props, State> {
  _form: t.form;

  constructor(props: Props) {
    super(props);
    this.state = {
      value: props.value || {},
    };
  }

  handleSubmit = () => {
    const { onSubmit } = this.props;
    const value = this._form.getValue();
    if (!value) return;
    onSubmit(value);
  };

  handleChange = (value: Object) => {
    this.setState({ value });
  };

  render() {
    const { value } = this.state;
    const { fields } = this.props;
    const formOptions = generateFormOptions(fields);
    const formStructure = getFormStructure(fields);

    return (
      <StyledWrapper flex={1}>
        <Form
          ref={node => { this._form = node; }}
          type={formStructure}
          options={formOptions}
          value={value}
          onChange={this.handleChange}
        />
        <FormFooter>
          <Button onPress={this.handleSubmit} title="Save" />
        </FormFooter>
      </StyledWrapper>
    );
  }
}
