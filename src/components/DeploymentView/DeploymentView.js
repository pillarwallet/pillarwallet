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
import get from 'lodash.get';
import type { NavigationScreenProp } from 'react-navigation';
import { createStructuredSelector } from 'reselect';

import { SMART_WALLET_UPGRADE_STATUSES } from 'constants/smartWalletConstants';
import {
  TRANSACTION_EVENT,
  TX_PENDING_STATUS,
} from 'constants/historyConstants';
import { COLLECTIBLE_TRANSACTION } from 'constants/collectiblesConstants';

import { BaseText, MediumText } from 'components/Typography';
import { Wrapper } from 'components/Layout';
import Button from 'components/Button';
import Spinner from 'components/Spinner';
import EventDetails from 'components/EventDetails';
import SlideModal from 'components/Modals/SlideModal';

import { baseColors, fontStyles, spacing } from 'utils/variables';
import { getSmartWalletStatus } from 'utils/smartWallet';
import {
  mapOpenSeaAndBCXTransactionsHistory,
  mapTransactionsHistory,
} from 'utils/feedData';
import { formatUnits } from 'utils/common';
import { getAssetData } from 'utils/assets';

import type { SmartWalletStatus } from 'models/SmartWalletStatus';
import type { Accounts } from 'models/Account';
import type { Asset } from 'models/Asset';
import type { ContactSmartAddressData } from 'models/Contacts';

import { supportedAssetsSelector } from 'selectors';
import { accountHistorySelector } from 'selectors/history';
import { accountCollectiblesHistorySelector } from 'selectors/collectibles';
import { accountAssetsSelector } from 'selectors/assets';

type Props = {
  navigation: NavigationScreenProp<*>,
  buttonLabel?: string,
  message: Object,
  buttonAction?: ?Function,
  smartWalletState: Object,
  accounts: Accounts,
  history: Object[],
  contacts: Object[],
  openSeaTxHistory: Object[],
  assets: Asset[],
  contactsSmartAddresses: ContactSmartAddressData[],
  forceRetry?: boolean,
  supportedAssets: Asset[],
}

type State = {
  showTransactionDetails: boolean,
}

const MessageTitle = styled(MediumText)`
  ${fontStyles.big};
  text-align: center;
`;

const Message = styled(BaseText)`
  padding-top: ${spacing.small}px;
  ${fontStyles.regular}
  color: ${baseColors.darkGray};
  text-align: center;
`;

const SpinnerWrapper = styled.View`
  margin-top: ${spacing.mediumLarge}px;
`;

class DeploymentView extends React.PureComponent<Props, State> {
  state = {
    showTransactionDetails: false,
  };

  handleTransactionDetailsClose = () => {
    this.setState({ showTransactionDetails: false });
  };

  render() {
    const {
      message = {},
      buttonLabel,
      buttonAction,
      smartWalletState,
      accounts,
      history,
      contacts,
      openSeaTxHistory,
      assets,
      contactsSmartAddresses,
      navigation,
      forceRetry,
      supportedAssets,
    } = this.props;
    const { showTransactionDetails } = this.state;
    const { title, message: bodyText } = message;

    const smartWalletStatus: SmartWalletStatus = getSmartWalletStatus(accounts, smartWalletState);
    if (smartWalletStatus.status === SMART_WALLET_UPGRADE_STATUSES.DEPLOYMENT_COMPLETE) return null;

    const {
      upgrade: {
        deploymentStarted,
        transfer: {
          transactions: upgradeTransferTransactions,
        },
      },
    } = smartWalletState;

    const isDeploying = deploymentStarted
      || [
        SMART_WALLET_UPGRADE_STATUSES.DEPLOYING,
        SMART_WALLET_UPGRADE_STATUSES.TRANSFERRING_ASSETS,
      ].includes(smartWalletStatus.status);

    let detailedTransaction;
    const pendingTransferTransaction = upgradeTransferTransactions.find(({ status }) => status === TX_PENDING_STATUS);
    const pendingTransferTransactionHash = get(pendingTransferTransaction, 'transactionHash');
    const matchingTransaction = history.find(({ hash }) => hash === pendingTransferTransactionHash);

    if (matchingTransaction) {
      if (matchingTransaction.tranType === 'collectible') {
        [detailedTransaction] = mapTransactionsHistory(
          mapOpenSeaAndBCXTransactionsHistory(openSeaTxHistory, [matchingTransaction]),
          contacts,
          contactsSmartAddresses,
          accounts,
          COLLECTIBLE_TRANSACTION,
        );
      } else {
        [detailedTransaction] = mapTransactionsHistory(
          [matchingTransaction],
          contacts,
          contactsSmartAddresses,
          accounts,
          TRANSACTION_EVENT,
        );
      }
    }

    if (detailedTransaction) {
      // $FlowFixMe
      const { decimals = 18 } = getAssetData(Object.values(assets), supportedAssets, detailedTransaction.asset);
      const value = formatUnits(detailedTransaction.value, decimals);
      detailedTransaction = {
        ...detailedTransaction,
        value,
      };
    }

    return (
      <Wrapper regularPadding center style={{ marginTop: 40, marginBottom: spacing.large }}>
        <MessageTitle>{title}</MessageTitle>
        <Message>{bodyText}</Message>
        <Wrapper style={{ margin: spacing.small, width: '100%', alignItems: 'center' }}>
          {isDeploying && !forceRetry &&
          <SpinnerWrapper>
            <Spinner />
          </SpinnerWrapper>}
          {!!detailedTransaction &&
            <Button
              marginTop="30"
              height={52}
              title="View ongoing transaction"
              onPress={() => this.setState({ showTransactionDetails: true })}
            />
          }
          {(!isDeploying || forceRetry) && buttonAction && buttonLabel &&
            <Button
              marginTop="30"
              height={52}
              title={buttonLabel}
              onPress={buttonAction}
            />
          }
        </Wrapper>
        {!!detailedTransaction &&
          <SlideModal
            isVisible={showTransactionDetails}
            title="transaction details"
            onModalHide={this.handleTransactionDetailsClose}
            eventDetail
          >
            <EventDetails
              eventData={detailedTransaction}
              eventType={detailedTransaction.type}
              eventStatus={detailedTransaction.status}
              onClose={this.handleTransactionDetailsClose}
              navigation={navigation}
            />
          </SlideModal>
        }
      </Wrapper>
    );
  }
}

const mapStateToProps = ({
  contacts: { data: contacts, contactsSmartAddresses: { addresses: contactsSmartAddresses } },
  accounts: { data: accounts },
  smartWallet: smartWalletState,
}) => ({
  smartWalletState,
  accounts,
  contacts,
  contactsSmartAddresses,
});

const structuredSelector = createStructuredSelector({
  history: accountHistorySelector,
  openSeaTxHistory: accountCollectiblesHistorySelector,
  assets: accountAssetsSelector,
  supportedAssets: supportedAssetsSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});


export default connect(combinedMapStateToProps)(DeploymentView);
