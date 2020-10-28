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
import { ETH } from 'constants/assetsConstants';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Button from 'components/Button';
import SablierStreamCircles from 'components/SablierStreamCircles';
import Selector from 'components/Selector';
import { Spacing } from 'components/Layout';
import ActivityFeed from 'components/ActivityFeed';
import ArrowIcon from 'components/ArrowIcon/ArrowIcon';

// services
import { getSablierCancellationTransaction } from 'services/sablier';

// selectors
import { accountBalancesSelector } from 'selectors/balances';
import { sablierEventsSelector } from 'selectors/sablier';
import { accountHistorySelector } from 'selectors/history';

// utils
import { isEnoughBalanceForTransactionFee } from 'utils/assets';
import { findEnsNameCaseInsensitive } from 'utils/common';
import { mapTransactionsHistory } from 'utils/feedData';
import { isSablierTransactionTag } from 'utils/sablier';

// types
import type { Rates, Asset, Balances } from 'models/Asset';
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
  useGasToken: boolean,
  rates: Rates,
  baseFiatCurrency: ?string,
  supportedAssets: Asset[],
  ensRegistry: EnsRegistry,
  balances: Balances,
  history: Object[],
  sablierEvents: Object[],
  accounts: Accounts,
  feeInfo: ?TransactionFeeInfo,
  isEstimating: boolean,
  estimateErrorMessage: ?string,
  calculateSablierCancelTransactionEstimate: (stream: Stream) => void,
  resetEstimateTransaction: () => void,
};

type State = {
  isCancellationModalVisible: boolean,
};

const SelectorWrapper = styled.View`
  align-items: center;
  padding: 30px 0 48px;
`;

class OutgoingStream extends React.Component<Props, State> {
  state = {
    isCancellationModalVisible: false,
  }

  componentDidMount() {
    this.props.resetEstimateTransaction();
  }

  onCancel = () => {
    const { navigation, calculateSablierCancelTransactionEstimate } = this.props;
    const { stream } = navigation.state.params;

    calculateSablierCancelTransactionEstimate(stream);

    this.setState({ isCancellationModalVisible: true });
  }

  onCancelConfirm = () => {
    const {
      navigation,
      feeInfo,
    } = this.props;
    this.setState({ isCancellationModalVisible: false });

    const { stream } = navigation.state.params;
    let transactionPayload = getSablierCancellationTransaction(stream);

    transactionPayload = {
      ...transactionPayload,
      txFeeInWei: feeInfo?.fee,
      gasToken: feeInfo?.gasToken,
    };

    navigation.navigate(SEND_TOKEN_PIN_CONFIRM, { transactionPayload });
  }

  render() {
    const {
      balances,
      navigation,
      ensRegistry,
      history,
      accounts,
      sablierEvents,
      feeInfo,
      isEstimating,
      estimateErrorMessage,
    } = this.props;
    const { isCancellationModalVisible } = this.state;

    const stream = navigation.getParam('stream');


    let notEnoughForFee;
    if (feeInfo) {
      notEnoughForFee = !isEnoughBalanceForTransactionFee(balances, {
        ...getSablierCancellationTransaction(stream),
        txFeeInWei: feeInfo.fee,
        gasToken: feeInfo.gasToken,
      });
    }

    const errorMessage = notEnoughForFee
      ? t('error.notEnoughTokenForFee', { token: feeInfo?.gasToken?.symbol || ETH })
      : estimateErrorMessage;

    const cancelData = {
      feeInfo,
      errorMessage,
      recipient: stream.recipient,
    };

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
          <Selector
            disabled
            selectedOption={recipient}
          />
        </SelectorWrapper>
        <Button
          title={t('sablierContent.button.cancelStream')}
          onPress={this.onCancel}
          isLoading={isEstimating}
          marginLeft={20}
          marginRight={20}
        />
        <Spacing h={24} />
        <ActivityFeed
          navigation={navigation}
          feedData={combinedHistory}
          card
          cardHeaderTitle={t('sablierContent.title.streamingActivityFeed')}
        />
        <SablierCancellationModal
          isVisible={isCancellationModalVisible}
          cancelData={cancelData}
          onModalHide={() => this.setState({ isCancellationModalVisible: false })}
          onCancel={this.onCancelConfirm}
        />
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency } },
  assets: { supportedAssets },
  ensRegistry: { data: ensRegistry },
  accounts: { data: accounts },
  transactionEstimate: { isEstimating, feeInfo, errorMessage: estimateErrorMessage },
}: RootReducerState): $Shape<Props> => ({
  rates,
  baseFiatCurrency,
  supportedAssets,
  ensRegistry,
  accounts,
  isEstimating,
  feeInfo,
  estimateErrorMessage,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
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
