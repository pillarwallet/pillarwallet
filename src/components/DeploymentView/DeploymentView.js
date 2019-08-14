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

import { BaseText, BoldText } from 'components/Typography';
import { Wrapper } from 'components/Layout';
import Button from 'components/Button';
import Spinner from 'components/Spinner';

import { baseColors, fontSizes, spacing } from 'utils/variables';

import { SMART_WALLET_DEPLOYMENT_ERRORS } from 'constants/smartWalletConstants';

type Props = {
  buttonLabel?: string,
  message: Object,
  buttonAction?: ?Function,
  isDeploying?: boolean,
}

const MessageTitle = styled(BoldText)`
  font-size: ${fontSizes.large}px;
  text-align: center;
`;

const Message = styled(BaseText)`
  padding-top: 20px;
  font-size: ${fontSizes.extraSmall}px;
  color: ${baseColors.darkGray};
  text-align: center;
`;

const SpinnerWrapper = styled.View`
  margin-top: ${spacing.mediumLarge}px;
`;

export const getDeployErrorMessage = (errorType: string) => {
  return {
    title: 'Smart Wallet deployment failed',
    message: errorType === SMART_WALLET_DEPLOYMENT_ERRORS.INSUFFICIENT_FUNDS
      ? 'You need to top up your Smart Account first'
      : 'There was an error on our server. Please try to re-deploy the account by clicking the button bellow',
  };
};

export const DeploymentView = (props: Props) => {
  const {
    isDeploying,
    message = {},
    buttonLabel,
    buttonAction,
  } = props;
  const { title, message: bodyText } = message;

  return (
    <Wrapper regularPadding center style={{ marginTop: 40, marginBottom: spacing.large }}>
      <MessageTitle>{ title }</MessageTitle>
      <Message>{ bodyText }</Message>
      <Wrapper style={{ margin: spacing.small, width: '100%', alignItems: 'center' }}>
        {isDeploying &&
        <SpinnerWrapper>
          <Spinner />
        </SpinnerWrapper>}
        {!isDeploying && buttonAction && buttonLabel && <Button
          marginTop={spacing.mediumLarge.toString()}
          height={52}
          title={buttonLabel}
          onPress={buttonAction}
        />}
      </Wrapper>
    </Wrapper>
  );
};
