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
import Button from 'components/Button';
import { MediumText } from 'components/Typography';
import TextInput from 'components/TextInput';

// utils
import { spacing } from 'utils/variables';

const FormWrapper = styled.View`
  padding: 30px ${spacing.layoutSides}px ${spacing.layoutSides}px;
  display: flex;
`;

const SpacedButton = styled(Button)`
  margin-bottom: ${spacing.layoutSides}px;
`;

type Props = {
  updateCode: (code: string) => void,
  onPressConfirm: () => void,
  onPressCancel: () => void,
  code: string,
};

const ConfirmCode = (props: Props) => {
  const {
    code,
    updateCode,
    onPressConfirm,
    onPressCancel,
  } = props;

  const inputProps = {
    label: 'Enter your code',
    value: code,
    onChange: updateCode,
    keyboardType: 'number-pad',
    maxLength: 12,
  };

  return (
    <React.Fragment>
      <FormWrapper>
        <MediumText>Enter your code:</MediumText>
        <TextInput inputProps={inputProps} />
        <SpacedButton onPress={onPressConfirm} title="Confirm" />
        <SpacedButton onPress={onPressCancel} title="Need a new code" secondary />
      </FormWrapper>
    </React.Fragment>
  );
};

export default ConfirmCode;
