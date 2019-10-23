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
import {
  FirstNameStruct,
  LastNameStruct,
  EmailStruct,
  CityStruct,
  PhoneStruct,
  CodeStruct,
} from 'components/ProfileForm/profileFormDefs';
import InputWithSwitch from 'components/Input/InputWithSwitch';
import { noop } from 'utils/common';

type Field = {
  name: string,
  type: string,
  label: string,
  onBlur?: Function,
  onSelect?: Function,
  options?: Object[],
  optionsTitle?: string,
}

type Props = {
  fields: Field[],
  value?: Object,
  buttonTitle?: string,
  getFormRef: Function,
  onChange?: Function,
}

type State = {
  value: Object,
}

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

const InputSwitchTemplate = (locals: Object) => {
  const { config = {} } = locals;
  const {
    inputType,
    label,
    fieldName,
    onBlur,
    onSelect,
    options,
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
      wrapperStyle={{ marginBottom: 20 }}
      options={options}
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
        onBlur: field.onBlur || noop,
        onSelect: field.onSelect || noop,
        options: field.options || [],
        optionsTitle: field.optionsTitle || '',
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
  constructor(props: Props) {
    super(props);
    this.state = {
      value: props.value || {},
    };
  }

  handleChange = (value: Object) => {
    const { onChange } = this.props;
    this.setState({ value });
    if (onChange) onChange(value);
  };

  render() {
    const { value } = this.state;
    const { fields, getFormRef } = this.props;
    const formOptions = generateFormOptions(fields);
    const formStructure = getFormStructure(fields);

    return (
      <Form
        ref={node => { getFormRef(node); }}
        type={formStructure}
        options={formOptions}
        value={value}
        onChange={this.handleChange}
      />
    );
  }
}
