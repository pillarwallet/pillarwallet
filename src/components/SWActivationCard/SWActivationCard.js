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
import { withNavigation } from 'react-navigation';

// components
import InsightWithButton from 'components/InsightWithButton';
import SWActivationModal from 'components/SWActivationModal';

// constants
import { SMART_WALLET_UPGRADE_STATUSES } from 'constants/smartWalletConstants';

// actions
import { deploySmartWalletAction } from 'actions/smartWalletActions';

// utils
import {
  getSmartWalletStatus,
  getDeployErrorMessage,
  isDeployingSmartWallet,
  getDeploymentData,
} from 'utils/smartWallet';

// types
import type { SmartWalletStatus } from 'models/SmartWalletStatus';
import type { Accounts } from 'models/Account';
import type { NavigationScreenProp } from 'react-navigation';
import type { Theme } from 'models/Theme';


type Props = {
  navigation: NavigationScreenProp<*>,
  message: string,
  buttonTitle: string,
  accounts: Accounts,
  smartWalletState: Object,
  onButtonPress?: () => void,
  title?: string,
  deploySmartWallet: () => void,
  theme: Theme,
};

type State = {
  isModalVisible: boolean,
};

class SWActivationCard extends React.Component<Props, State> {
  state = {
    isModalVisible: false,
  };

  closeActivationModal = () => {
    this.setState({ isModalVisible: false });
  };

  render() {
    const {
      title,
      buttonTitle = 'Activate Smart Wallet',
      message = 'To start sending assets you need to activate Smart Wallet',
      accounts,
      smartWalletState,
      onButtonPress,
      deploySmartWallet,
      navigation,
    } = this.props;
    const { isModalVisible } = this.state;

    const smartWalletStatus: SmartWalletStatus = getSmartWalletStatus(accounts, smartWalletState);
    if (smartWalletStatus.status === SMART_WALLET_UPGRADE_STATUSES.DEPLOYMENT_COMPLETE) return null;

    const { upgrade: { deploymentStarted } } = smartWalletState;

    const isDeploying = isDeployingSmartWallet(smartWalletState, accounts);

    const deploymentData = getDeploymentData(smartWalletState);

    const sendingBlockedMessage = smartWalletStatus.sendingBlockedMessage || {};
    const deploymentErrorMessage = deploymentData.error ?
      getDeployErrorMessage(deploymentData.error) : sendingBlockedMessage;

    let showMessage = message;
    if (deploymentStarted) {
      showMessage = 'Activating your account';
    } else if (smartWalletStatus.status === SMART_WALLET_UPGRADE_STATUSES.TRANSFERRING_ASSETS) {
      showMessage = 'Transferring assets';
    }

    return (
      <React.Fragment>
        {deploymentData.error ? (
          <InsightWithButton
            title={deploymentErrorMessage.title}
            description={deploymentErrorMessage.message}
            buttonTitle="Retry"
            onButtonPress={deploySmartWallet}
          />
        ) : (
          <InsightWithButton
            title={title}
            description={showMessage}
            buttonTitle={buttonTitle}
            onButtonPress={onButtonPress || (() => this.setState({ isModalVisible: true }))}
            spinner={isDeploying}
          />
        )}
        <SWActivationModal
          isModalVisible={isModalVisible}
          closeModal={this.closeActivationModal}
          navigation={navigation}
        />
      </React.Fragment>
    );
  }
}

const mapStateToProps = ({
  accounts: { data: accounts },
  smartWallet: smartWalletState,
}) => ({
  accounts,
  smartWalletState,
});

const mapDispatchToProps = (dispatch: Function) => ({
  deploySmartWallet: () => dispatch(deploySmartWalletAction()),
});

export default withNavigation(connect(mapStateToProps, mapDispatchToProps)(SWActivationCard));
