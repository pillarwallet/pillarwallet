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

// utils
import { spacing } from 'utils/variables';

const Label = styled(MediumText)`
  padding-bottom: ${spacing.layoutSides}px;
`;

type Props = {
  onPressSendCode: () => void,
  email: string,
};

const SendEmailCode = (props: Props) => {
  const { email, onPressSendCode } = props;

  return (
    <React.Fragment>
      <Label>Verify your email:</Label>
      <Label>{email}</Label>
      <Button onPress={onPressSendCode} title="Send code" />
    </React.Fragment>
  );
};

export default SendEmailCode;
