// @flow

import React from 'react';
import { KeyboardAvoidingView as RNKeyboardAvoidingView, Platform, View } from 'react-native';
import styled from 'styled-components/native';
import t from 'tcomb-form-native';
import TextInput from 'components/TextInput';
import { Container } from 'components/Layout';
import Button from 'components/Button';
import { isValidEmail } from 'utils/validators';

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

const FooterWrapper = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 0 20px;
  width: 100%;
`;

const KeyboardAvoidingView = Platform.OS === 'ios' ?
  styled(RNKeyboardAvoidingView)`
  position: absolute;
  bottom: 40px;
  left: 0;
  width: 100%;
`
  :
  styled(RNKeyboardAvoidingView)`
  width: 100%;
  flex: 1;
  justify-content: space-between;
  padding-bottom: 40px;`;

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
    />
  );
}

const { Form } = t.form;

const EmailStruct = t.refinement(t.String, (email: string): boolean => {
  return !!email.length && isValidEmail(email);
});

const defaultTypes = {
  string: t.String,
  number: t.Number,
  email: EmailStruct,
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
      error: field.config.error || `Please specify your ${field.label.toLowerCase()}`,
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

    const content = Platform.OS === 'ios' ?
      (
        <View style={{ flex: 1 }}>
          <Form
            ref={node => { this._form = node; }}
            type={formStructure}
            options={formOptions}
            value={value}
            onChange={this.handleChange}
          />
          <KeyboardAvoidingView behavior="position" keyboardVerticalOffset={180}>
            <FooterWrapper style={{ paddingTop: 20 }}>
              <Button onPress={this.handleSubmit} title="Save" />
            </FooterWrapper>
          </KeyboardAvoidingView>
        </View>)
      :
      (
        <KeyboardAvoidingView behavior="padding">
          <Form
            ref={node => { this._form = node; }}
            type={formStructure}
            options={formOptions}
            value={value}
            onChange={this.handleChange}
          />
          <FooterWrapper style={{ marginBottom: 40 }}>
            <Button onPress={this.handleSubmit} title="Save" />
          </FooterWrapper>
        </KeyboardAvoidingView>);
    return (
      <Container>
        {content}
      </Container>
    );
  }
}
