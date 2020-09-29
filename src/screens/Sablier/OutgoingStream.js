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
import t from 'translations/translate';

import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Button from 'components/Button';
import SablierStreamCircles from 'components/SablierStreamCircles';
import Selector from 'components/Selector';
import { Spacing } from 'components/Layout';
import ActivityFeed from 'components/ActivityFeed';
import Modal from 'components/Modal';

import { getCancellationFeeAndTransaction } from 'services/sablier';
import { SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';
import { TRANSACTION_EVENT } from 'constants/historyConstants';
import { accountBalancesSelector } from 'selectors/balances';
import { useGasTokenSelector } from 'selectors/smartWallet';
import { isEnoughBalanceForTransactionFee } from 'utils/assets';
import { findEnsNameCaseInsensitive } from 'utils/common';
import { mapTransactionsHistory } from 'utils/feedData';
import { isSablierTransactionTag } from 'utils/sablier';
import { sablierEventsSelector } from 'selectors/sablier';
import { accountHistorySelector } from 'selectors/history';

import type { Rates, Asset, Balances } from 'models/Asset';
import type { RootReducerState } from 'reducers/rootReducer';
import type { NavigationScreenProp } from 'react-navigation';
import type { EnsRegistry } from 'reducers/ensRegistryReducer';
import type { Accounts } from 'models/Account';

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
};

type State = {
  isFetchingCancellationFee: boolean,
};

class OutgoingStream extends React.Component<Props, State> {
  state = {
    isFetchingCancellationFee: false,
  }

  onCancel = async () => {
    this.setState({ isFetchingCancellationFee: true });

    const { useGasToken, navigation } = this.props;
    const { stream } = navigation.state.params;

    const {
      txFeeInWei,
      gasToken,
      transactionPayload: cancellationPayload,
    } = await getCancellationFeeAndTransaction(stream, useGasToken);

    this.setState({ isFetchingCancellationFee: false });

    const { balances } = this.props;

    if (cancellationPayload) {
      const isDisabled = !isEnoughBalanceForTransactionFee(balances, cancellationPayload);

      const cancelData = {
        txFeeInWei,
        isDisabled,
        gasToken,
        recipient: stream.recipient,
      };

      Modal.open(() => (
        <SablierCancellationModal
          cancelData={cancelData}
          onCancel={() => this.onCancelConfirm(cancellationPayload)}
        />
      ));
    }
  }

  onCancelConfirm = (cancellationPayload) => {
    const { navigation } = this.props;

    navigation.navigate(SEND_TOKEN_PIN_CONFIRM, {
      transactionPayload: cancellationPayload,
    });
  }

  render() {
    const {
      navigation, ensRegistry, history, accounts, sablierEvents,
    } = this.props;
    const { isFetchingCancellationFee } = this.state;

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
        <Selector
          label={t('label.to')}
          disabled
          selectedOption={recipient}
        />
        <SablierStreamCircles
          stream={stream}
        />
        <Spacing h={40} />
        <Button
          title={t('sablierContent.button.cancelStream')}
          onPress={this.onCancel}
          isLoading={isFetchingCancellationFee}
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
}: RootReducerState): $Shape<Props> => ({
  rates,
  baseFiatCurrency,
  supportedAssets,
  ensRegistry,
  accounts,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
  useGasToken: useGasTokenSelector,
  history: accountHistorySelector,
  sablierEvents: sablierEventsSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});


export default connect(combinedMapStateToProps)(OutgoingStream);
