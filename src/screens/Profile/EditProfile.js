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
import { Dimensions } from 'react-native';
import t from 'tcomb-form-native';
import styled from 'styled-components/native';
import { Wrapper } from 'components/Layout';
import { spacing } from 'utils/variables';
import Button from 'components/Button';
import { InputTemplate, Form } from 'components/ProfileForm';
import {
  FirstNameStruct,
  LastNameStruct,
  EmailStruct,
  CityStruct,
} from 'components/ProfileForm/profileFormDefs';

const window = Dimensions.get('window');

const StyledWrapper = styled(Wrapper)`
  justify-content: space-between;
  padding-bottom: ${spacing.rhythm}px;
  margin-top: 25px;
`;

const FormFooter = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 10px 20px;
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
      config: { ...field.config, viewWidth: (window.width - 65), includeLabel: false },
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
