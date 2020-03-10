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

import React from 'react';
import t from 'tcomb-form-native';
import isEqual from 'lodash.isequal';
import isEmpty from 'lodash.isempty';
import get from 'lodash.get';
import {
  FirstNameStruct,
  LastNameStruct,
  EmailStruct,
  CityStruct,
  PhoneStruct,
  CodeStruct,
} from 'components/ProfileForm/profileFormDefs';
import InputWithSwitch from 'components/Input/InputWithSwitch';
import { spacing } from 'utils/variables';


type Field = {
  name: string,
  type: string,
  label: string,
  onBlur?: Function,
  onSelect?: Function,
  options?: Object[],
  optionsTitle?: string,
  hasVerification?: boolean,
  isVerified?: boolean,
  onPressVerify?: () => void,
  isModified?: boolean,
};

type Props = {
  fields: Field[],
  value?: Object,
  buttonTitle?: string,
  onUpdate?: (update: Object) => void,
};

type State = {
  value: Object,
};


const defaultTypes = {
  string: t.String,
  code: CodeStruct,
  phone: PhoneStruct,
  email: EmailStruct,
  firstName: FirstNameStruct,
  lastName: LastNameStruct,
  city: CityStruct,
  country: t.String,
};

const { Form } = t.form;

export const InputSwitchTemplate = (locals: Object) => {
  const { config = {} } = locals;
  const {
    inputType,
    label,
    fieldName,
    onBlur,
    onSelect,
    options,
    hasVerification,
    isModified,
    isVerified,
    onPressVerify,
  } = config;
  const errorMessage = locals.error;
  const inputProps = {
    autoCapitalize: config.autoCapitalize || 'words',
    onChange: locals.onChange,
    value: locals.value,
    keyboardType: config.keyboardType || 'default',
    placeholder: config.placeholder || '',
    fieldName,
    onBlur,
    onSelect,
    ...config.inputProps,
  };

  return (
    <InputWithSwitch
      errorMessage={errorMessage}
      inputType={inputType}
      inputProps={inputProps}
      label={label}
      wrapperStyle={{ marginTop: spacing.mediumLarge }}
      options={options}
      hasVerification={hasVerification}
      isModified={isModified}
      isVerified={isVerified}
      onPressVerify={onPressVerify}
    />
  );
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
      template: InputSwitchTemplate,
      config: {
        inputType: defaultTypes[field.type],
        label: field.label,
        fieldName: field.name,
        onBlur: field.onBlur,
        onSelect: field.onSelect,
        onPressVerify: field.onPressVerify,
        options: field.options,
        optionsTitle: field.optionsTitle || '',
        hasVerification: field.hasVerification,
        isModified: field.isModified,
        isVerified: field.isVerified,
      },
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
  _formRef: t.form;

  constructor(props: Props) {
    super(props);
    this.state = {
      value: props.value || {},
    };
  }

  handleChange = (value: Object) => {
    this.setState({ value });
    const key = Object.keys(value)[0];
    const { _formRef } = this;

    if (!_formRef) {
      return;
    }

    const component = _formRef.getComponent(key);

    component.validate();
  };

  handleBlur = (field: string, value: string) => {
    const component = this._formRef.getComponent(field);

    const result = component.validate();
    if (!isEmpty(get(result, 'errors'))) {
      return;
    }

    const { value: originalValue, onUpdate } = this.props;
    const isModified = !originalValue || !isEqual(value, originalValue[field]);

    if (isModified && onUpdate) {
      onUpdate({ [field]: value });
    }
  };

  render() {
    const { value } = this.state;
    const { value: originalValue, fields } = this.props;

    const formFields = fields.map(field => ({
      ...field,
      onBlur: this.handleBlur,
      isModified: !isEqual(value, originalValue),
    }));

    const formOptions = generateFormOptions(formFields);
    const formStructure = getFormStructure(formFields);

    return (
      <Form
        ref={node => { this._formRef = node; }}
        type={formStructure}
        options={formOptions}
        value={value}
        onChange={this.handleChange}
      />
    );
  }
}
