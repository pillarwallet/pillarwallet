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
import InsightWithButton from 'components/InsightWithButton';
import SWActivationModal from 'components/SWActivationModal';
import SlideModal from 'components/Modals/SlideModal';

import { SMART_WALLET_UPGRADE_STATUSES } from 'constants/smartWalletConstants';
import { getSmartWalletStatus } from 'utils/smartWallet';

import type { SmartWalletStatus } from 'models/SmartWalletStatus';
import type { Accounts } from 'models/Account';

type Props = {
  message: string,
  buttonTitle: string,
  accounts: Accounts,
  smartWalletState: Object,
  onButtonPress?: () => void,
  forceRetry?: boolean,
  title?: string,
};

type State = {
  isModalVisible: boolean,
};

class SWActivationCard extends React.Component<Props, State> {
  state = {
    isModalVisible: false,
  };

  render() {
    const {
      title, message, buttonTitle, accounts, smartWalletState, onButtonPress, forceRetry,
    } = this.props;
    const { isModalVisible } = this.state;

    const smartWalletStatus: SmartWalletStatus = getSmartWalletStatus(accounts, smartWalletState);
    if (smartWalletStatus.status === SMART_WALLET_UPGRADE_STATUSES.DEPLOYMENT_COMPLETE) return null;

    const { upgrade: { deploymentStarted } } = smartWalletState;

    const isDeploying = deploymentStarted
      || [
        SMART_WALLET_UPGRADE_STATUSES.DEPLOYING,
        SMART_WALLET_UPGRADE_STATUSES.TRANSFERRING_ASSETS,
      ].includes(smartWalletStatus.status);

    return (
      <React.Fragment>
        <InsightWithButton
          title={title}
          description={message}
          buttonTitle={buttonTitle}
          onButtonPress={onButtonPress || (() => this.setState({ isModalVisible: true }))}
          spinner={isDeploying && !forceRetry}
        />
        <SlideModal
          isVisible={isModalVisible}
          onModalHide={() => {
            this.setState({ isModalVisible: false });
          }}
        >
          <SWActivationModal
            onModalClose={(action) => {
              this.setState({ isModalVisible: false }, action);
            }}
          />
        </SlideModal>
      </React.Fragment>
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

export default connect(mapStateToProps)(SWActivationCard);
