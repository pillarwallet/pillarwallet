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

// components
import TextInput from 'components/TextInput';

// utils
import { spacing } from 'utils/variables';

const FormWrapper = styled.View`
  padding: 30px ${spacing.layoutSides}px ${spacing.layoutSides}px;
  display: flex;
  width: 200px;
`;

type Props = {
  updateCode: (code: string) => void,
  code: string,
};

const maxDigits = 5;

const ConfirmCode = (props: Props) => {
  const {
    code,
    updateCode,
  } = props;

  const inputProps = {
    value: code,
    onChange: updateCode,
    keyboardType: 'number-pad',
    maxLength: maxDigits,
  };

  return (
    <FormWrapper>
      <TextInput inputProps={inputProps} />
    </FormWrapper>
  );
};

export default ConfirmCode;
