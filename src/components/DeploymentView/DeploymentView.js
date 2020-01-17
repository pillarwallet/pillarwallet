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
import { connect } from 'react-redux';
import styled from 'styled-components/native';

import { SMART_WALLET_UPGRADE_STATUSES } from 'constants/smartWalletConstants';

import { BaseText, MediumText } from 'components/Typography';
import { Wrapper } from 'components/Layout';
import Button from 'components/Button';
import Spinner from 'components/Spinner';

import { fontStyles, spacing } from 'utils/variables';
import { getSmartWalletStatus } from 'utils/smartWallet';
import { themedColors } from 'utils/themes';

import type { SmartWalletStatus } from 'models/SmartWalletStatus';
import type { Accounts } from 'models/Account';


type Props = {
  buttonLabel?: string,
  message: Object,
  buttonAction?: ?Function,
  smartWalletState: Object,
  accounts: Accounts,
  forceRetry?: boolean,
  wrapperStyle?: Object,
  noPadding?: boolean,
}

const MessageTitle = styled(MediumText)`
  ${fontStyles.big};
  text-align: center;
`;

const Message = styled(BaseText)`
  padding-top: ${spacing.small}px;
  ${fontStyles.regular}
  color: ${themedColors.secondaryText};
  text-align: center;
`;

const SpinnerWrapper = styled.View`
  margin-top: ${spacing.mediumLarge}px;
`;

class DeploymentView extends React.PureComponent<Props> {
  render() {
    const {
      message = {},
      buttonLabel,
      buttonAction,
      smartWalletState,
      accounts,
      forceRetry,
      wrapperStyle,
      noPadding,
    } = this.props;
    const { title, message: bodyText } = message;

    const smartWalletStatus: SmartWalletStatus = getSmartWalletStatus(accounts, smartWalletState);
    if (smartWalletStatus.status === SMART_WALLET_UPGRADE_STATUSES.DEPLOYMENT_COMPLETE) return null;

    const { upgrade: { deploymentStarted } } = smartWalletState;
    const isDeploying = deploymentStarted
      || [
        SMART_WALLET_UPGRADE_STATUSES.DEPLOYING,
        SMART_WALLET_UPGRADE_STATUSES.TRANSFERRING_ASSETS,
      ].includes(smartWalletStatus.status);

    return (
      <Wrapper
        regularPadding={!noPadding}
        center
        style={{ marginTop: 40, marginBottom: spacing.large, ...wrapperStyle }}
      >
        <MessageTitle>{title}</MessageTitle>
        <Message>{bodyText}</Message>
        <Wrapper style={{ margin: spacing.small, width: '100%', alignItems: 'center' }}>
          {isDeploying && !forceRetry &&
            <SpinnerWrapper>
              <Spinner />
            </SpinnerWrapper>
          }
          {(!isDeploying || forceRetry) && buttonAction && buttonLabel &&
            <Button
              marginTop={spacing.mediumLarge.toString()}
              height={52}
              title={buttonLabel}
              onPress={buttonAction}
            />
          }
        </Wrapper>
      </Wrapper>
    );
  }
}

const mapStateToProps = ({
  accounts: { data: accounts },
  smartWallet: smartWalletState,
}) => ({
  smartWalletState,
  accounts,
});

export default connect(mapStateToProps)(DeploymentView);
