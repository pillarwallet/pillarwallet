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

import React, { useEffect, useState } from 'react';
import styled from 'styled-components/native';
import t from 'translations/translate';

import FloatingBox from 'components/FloatingBox';
import Button from 'components/legacy/Button';
import { BaseText } from 'components/legacy/Typography';
import { Spacing } from 'components/legacy/Layout';

import { fontStyles, spacing } from 'utils/variables';

type Props = {|
  message: string,
  hasFailed: boolean,
  isFetching: boolean,
  onRetry: () => void,
|};

// TODO: use color: basic050Light when available
const Message = styled(BaseText)`
  ${fontStyles.small};
  color: #ffffff;
  text-align: center;
  margin-bottom: ${spacing.small}px;
`;

const Row = styled.View`
  flex-direction: row;
`;

const RowButton = styled(Button)`
  flex: 1;
`;

const RetryGraphQueryBox = ({
  message,
  hasFailed,
  isFetching,
  onRetry,
}: Props) => {
  const [isCancelled, setCancelled] = useState(false);
  const [firstRetry, setFirstRetry] = useState(true);

  useEffect(() => {
    if (!hasFailed) {
      setFirstRetry(true);
      setCancelled(false);
    }
  }, [hasFailed]);

  useEffect(() => {
    if (isFetching) setCancelled(false);
  }, [isFetching]);

  return (
    <FloatingBox isVisible={hasFailed && !isCancelled}>
      <Message>{message}</Message>
      <Row>
        <RowButton
          small
          danger
          title={t('button.cancel')}
          onPress={() => {
            setCancelled(true);
            setFirstRetry(true);
          }}
        />
        <Spacing w={spacing.small} />
        <RowButton
          small
          title={firstRetry ? t('button.retry') : t('button.tryAgain')}
          onPress={() => {
            setFirstRetry(false);
            onRetry();
          }}
          isLoading={isFetching}
        />
      </Row>
    </FloatingBox>
  );
};

export default RetryGraphQueryBox;
