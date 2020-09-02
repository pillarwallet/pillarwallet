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
import isEmpty from 'lodash.isempty';
import t from 'translations/translate';

import type { User } from 'models/User';

// components
import { Label } from 'components/Typography';

// utils
import { spacing } from 'utils/variables';

const Message = styled(Label)`
  margin: 0 ${spacing.rhythm}px;
`;

type Props = {
  field: string,
  user: User,
  sendingOneTimePassword: boolean,
};

const statusText = (props: Props) => {
  const {
    sendingOneTimePassword,
    user,
    field,
  } = props;

  const destination = user[field];
  if (isEmpty(destination)) {
    return t([
      `error.noField.${field}`, // eslint-disable-line i18next/no-literal-string
      'error.noField.default',
    ]);
  }

  if (sendingOneTimePassword) {
    return t('label.sendingToReceiver', { receiver: destination });
  }

  return t('label.sentToReceiver', { receiver: destination });
};

const StatusLabel = (props: Props) => (
  <Message>{statusText(props)}</Message>
);

export default StatusLabel;
