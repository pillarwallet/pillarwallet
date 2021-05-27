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
import { connect } from 'react-redux';
import { withNavigation } from 'react-navigation';
import t from 'translations/translate';

// components
import InsightWithButton from 'components/InsightWithButton';
import SWActivationModal from 'components/SWActivationModal';
import Modal from 'components/Modal';

// constants
import { ARCHANOVA_WALLET_UPGRADE_STATUSES } from 'constants/archanovaConstants';

// utils
import {
  getArchanovaWalletStatus,
  getDeployErrorMessage,
  isDeployingArchanovaWallet,
  getDeploymentData,
} from 'utils/archanova';

// types
import type { ArchanovaWalletStatus } from 'models/ArchanovaWalletStatus';
import type { Account } from 'models/Account';
import type { NavigationScreenProp } from 'react-navigation';
import type { Theme } from 'models/Theme';


type Props = {
  navigation: NavigationScreenProp<*>,
  message: string,
  buttonTitle: string,
  accounts: Account[],
  smartWalletState: Object,
  title?: string,
  theme: Theme,
};

const SWActivationCard = ({
  title,
  buttonTitle = t('smartWalletContent.activationCard.button.activate'),
  message = t('smartWalletContent.activationCard.description.default'),
  accounts,
  smartWalletState,
  navigation,
}: Props) => {
  const openActivationModal = () => Modal.open(() => <SWActivationModal navigation={navigation} />);

  const archanovaWalletStatus: ArchanovaWalletStatus = getArchanovaWalletStatus(accounts, smartWalletState);

  if (archanovaWalletStatus.status === ARCHANOVA_WALLET_UPGRADE_STATUSES.DEPLOYMENT_COMPLETE) return null;

  const { upgrade: { deploymentStarted } } = smartWalletState;

  const isDeploying = isDeployingArchanovaWallet(smartWalletState, accounts);

  const deploymentData = getDeploymentData(smartWalletState);

  const sendingBlockedMessage = archanovaWalletStatus.sendingBlockedMessage || {};
  const deploymentErrorMessage = deploymentData.error ?
    getDeployErrorMessage(deploymentData.error) : sendingBlockedMessage;

  let showMessage = message;
  if (deploymentStarted) {
    showMessage = t('smartWalletContent.activationCard.description.activating');
  }

  return (
    <React.Fragment>
      {!!deploymentData.error && (
        <InsightWithButton
          title={deploymentErrorMessage.title}
          description={deploymentErrorMessage.message}
          buttonTitle={t('button.retry')}
          onButtonPress={openActivationModal}
        />
      )}
      {!deploymentData.error && (
        <InsightWithButton
          title={title}
          description={showMessage}
          buttonTitle={buttonTitle}
          onButtonPress={openActivationModal}
          spinner={isDeploying}
        />
      )}
    </React.Fragment>
  );
};

const mapStateToProps = ({
  accounts: { data: accounts },
  smartWallet: smartWalletState,
}) => ({
  accounts,
  smartWalletState,
});

export default withNavigation(connect(mapStateToProps)(SWActivationCard));
