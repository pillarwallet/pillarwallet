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
import { createStructuredSelector } from 'reselect';
import styled from 'styled-components/native';
import t from 'translations/translate';

// actions
import { resetEstimateTransactionAction } from 'actions/transactionEstimateActions';
import { calculateSablierCancelTransactionEstimateAction } from 'actions/sablierActions';

// constants
import { SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';
import { TRANSACTION_EVENT } from 'constants/historyConstants';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Button from 'components/Button';
import SablierStreamCircles from 'components/SablierStreamCircles';
import ContactSelector from 'components/ContactSelector';
import { Spacing } from 'components/Layout';
import ActivityFeed from 'components/ActivityFeed';
import ArrowIcon from 'components/ArrowIcon/ArrowIcon';
import Toast from 'components/Toast';
import Modal from 'components/Modal';

// services
import { getSablierCancellationTransaction } from 'services/sablier';

// selectors
import { sablierEventsSelector } from 'selectors/sablier';
import { accountHistorySelector } from 'selectors/history';

// utils
import { findEnsNameCaseInsensitive } from 'utils/common';
import { mapTransactionsHistory } from 'utils/feedData';
import { isSablierTransactionTag } from 'utils/sablier';

// types
import type { Asset, Balances } from 'models/Asset';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { NavigationScreenProp } from 'react-navigation';
import type { EnsRegistry } from 'reducers/ensRegistryReducer';
import type { TransactionFeeInfo } from 'models/Transaction';
import type { Stream } from 'models/Sablier';
import type { Accounts } from 'models/Account';

// local
import SablierCancellationModal from './SablierCancellationModal';


type Props = {
  navigation: NavigationScreenProp<*>,
  supportedAssets: Asset[],
  ensRegistry: EnsRegistry,
  balances: Balances,
  history: Object[],
  sablierEvents: Object[],
  accounts: Accounts,
  feeInfo: ?TransactionFeeInfo,
  isEstimating: boolean,
  calculateSablierCancelTransactionEstimate: (stream: Stream) => void,
  resetEstimateTransaction: () => void,
};

const SelectorWrapper = styled.View`
  align-items: center;
  padding: 30px 0 48px;
`;

const ButtonWrapper = styled.View`
  align-items: center;
  padding: 0px 20px;
`;

class OutgoingStream extends React.Component<Props> {
  componentDidMount() {
    this.props.resetEstimateTransaction();
  }

  onCancel = () => {
    const {
      navigation,
      calculateSablierCancelTransactionEstimate,
      resetEstimateTransaction,
    } = this.props;

    const { stream } = navigation.state.params;

    const transactionPayload = getSablierCancellationTransaction(stream);
    resetEstimateTransaction();
    calculateSablierCancelTransactionEstimate(stream);

    Modal.open(() => (
      <SablierCancellationModal
        recipient={stream.recipient}
        transactionPayload={transactionPayload}
        onCancel={this.onCancelConfirm}
      />
    ));
  }

  onCancelConfirm = () => {
    const { navigation, feeInfo } = this.props;

    const { stream } = navigation.state.params;
    let transactionPayload = getSablierCancellationTransaction(stream);

    if (!feeInfo) {
      Toast.show({
        message: t('toast.cannotCancelStream'),
        emoji: 'woman-shrugging',
        supportLink: true,
      });
      return;
    }

    transactionPayload = {
      ...transactionPayload,
      txFeeInWei: feeInfo?.fee,
      gasToken: feeInfo?.gasToken,
    };

    navigation.navigate(SEND_TOKEN_PIN_CONFIRM, { transactionPayload });
  }

  render() {
    const {
      navigation,
      ensRegistry,
      history,
      accounts,
      sablierEvents,
      isEstimating,
    } = this.props;

    const stream = navigation.getParam('stream');

    const recipient = {
      name: findEnsNameCaseInsensitive(ensRegistry, stream.recipient) || stream.recipient,
      ethAddress: stream.recipient,
    };

    const transactionsOnMainnet = mapTransactionsHistory(
      history,
      accounts,
      TRANSACTION_EVENT,
    );

    const relatedHistory = transactionsOnMainnet
      .filter(ev => isSablierTransactionTag(ev.tag) && ev.extra?.streamId === stream.id);

    const relatedSablierEvents = sablierEvents
      .filter(ev => ev.streamId === stream.id);

    const combinedHistory = [
      ...relatedHistory,
      ...relatedSablierEvents,
    ];

    return (
      <ContainerWithHeader
        inset={{ bottom: 'never' }}
        headerProps={{ centerItems: [{ title: t('sablierContent.title.outgoingStreamScreen') }] }}
        putContentInScrollView
      >

        <SablierStreamCircles
          stream={stream}
        />
        <SelectorWrapper>
          <ArrowIcon />
          <Spacing h={20} />
          <ContactSelector disabled selectedContact={recipient} />
        </SelectorWrapper>
        <ButtonWrapper>
          <Button
            title={t('sablierContent.button.cancelStream')}
            onPress={this.onCancel}
            isLoading={isEstimating}
          />
        </ButtonWrapper>
        <Spacing h={24} />
        <ActivityFeed
          navigation={navigation}
          feedData={combinedHistory}
          card
          cardHeaderTitle={t('sablierContent.title.streamingActivityFeed')}
        />
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  assets: { supportedAssets },
  ensRegistry: { data: ensRegistry },
  accounts: { data: accounts },
  transactionEstimate: { feeInfo, isEstimating },
}: RootReducerState): $Shape<Props> => ({
  supportedAssets,
  ensRegistry,
  accounts,
  feeInfo,
  isEstimating,
});

const structuredSelector = createStructuredSelector({
  history: accountHistorySelector,
  sablierEvents: sablierEventsSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  calculateSablierCancelTransactionEstimate: (
    stream: Stream,
  ) => dispatch(calculateSablierCancelTransactionEstimateAction(stream)),
  resetEstimateTransaction: () => dispatch(resetEstimateTransactionAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(OutgoingStream);
