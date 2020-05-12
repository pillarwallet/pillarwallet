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
import { BigNumber } from 'bignumber.js';
import get from 'lodash.get';
import isEmpty from 'lodash.isempty';
import type { NavigationScreenProp } from 'react-navigation';

// constants
import { ETH } from 'constants/assetsConstants';

// actions
import { settleTransactionsAction, estimateSettleBalanceAction } from 'actions/smartWalletActions';

// components
import Toast from 'components/Toast';
import ReviewAndConfirm from 'components/ReviewAndConfirm';

// selectors
import { accountBalancesSelector } from 'selectors/balances';

// types
import type { Balances } from 'models/Asset';
import type { SettleTxFee, TxToSettle } from 'models/PaymentNetwork';

// utils
import { isEnoughBalanceForTransactionFee } from 'utils/assets';
import { formatAmount, formatTransactionFee } from 'utils/common';


type Props = {
  navigation: NavigationScreenProp<*>,
  session: Object,
  settleTransactions: Function,
  settleTxFee: SettleTxFee,
  balances: Balances,
  estimateSettleBalance: Function,
};

type State = {
  settleButtonSubmitted: boolean,
};


class SettleBalanceConfirm extends React.Component<Props, State> {
  txToSettle: TxToSettle[] = [];
  state = {
    settleButtonSubmitted: false,
  };

  constructor(props) {
    super(props);
    this.txToSettle = props.navigation.getParam('txToSettle', []);
  }

  componentDidMount() {
    const { estimateSettleBalance } = this.props;
    estimateSettleBalance(this.txToSettle);
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.session.isOnline !== this.props.session.isOnline && this.props.session.isOnline) {
      const { estimateSettleBalance } = this.props;
      estimateSettleBalance(this.txToSettle);
    }
  }

  handleFormSubmit = async () => {
    const { navigation, settleTransactions, balances } = this.props;
    const txFeeInWei = this.getTxFeeInWei();

    const gasToken = get(this.props, 'settleTxFee.feeInfo.gasToken');
    const feeSymbol = isEmpty(gasToken) ? ETH : gasToken.symbol;
    const isEnoughForFee = isEnoughBalanceForTransactionFee(balances, {
      txFeeInWei,
      gasToken,
    });
    if (!isEnoughForFee) {
      Toast.show({
        message: `Not enough ${feeSymbol} to cover the withdrawal transaction fee`,
        type: 'warning',
        title: 'Balance Issue',
        autoClose: true,
      });
      return;
    }

    this.setState({ settleButtonSubmitted: true });
    await settleTransactions(this.txToSettle);
    this.setState({ settleButtonSubmitted: false }, () => navigation.dismiss());
  };

  getTxFeeInWei = (): BigNumber => {
    return get(this.props, 'settleTxFee.feeInfo.gasTokenCost')
      || get(this.props, 'settleTxFee.feeInfo.totalCost', 0);
  };

  render() {
    const { settleButtonSubmitted } = this.state;
    const { session, settleTxFee } = this.props;

    let submitButtonTitle = 'Release Funds';
    if (!settleTxFee.isFetched) {
      submitButtonTitle = 'Getting the fee...';
    } else if (settleButtonSubmitted) {
      submitButtonTitle = 'Processing...';
    }

    const submitButtonDisabled = !session.isOnline
      || !settleTxFee.isFetched
      || settleButtonSubmitted;

    const gasToken = get(this.props, 'settleTxFee.feeInfo.gasToken');
    const feeDisplayValue = formatTransactionFee(this.getTxFeeInWei(), gasToken);

    const txToSettle = this.txToSettle.map((asset: Object) =>
      `${formatAmount(asset.value.toNumber())} ${asset.symbol}`);

    const reviewData = [
      {
        label: 'Assets to settle',
        valueArray: txToSettle,
      },
      {
        label: 'Transaction fee',
        value: feeDisplayValue,
        isLoading: !settleTxFee.isFetched,
      },
    ];

    return (
      <ReviewAndConfirm
        reviewData={reviewData}
        onConfirm={this.handleFormSubmit}
        isConfirmDisabled={submitButtonDisabled}
        submitButtonTitle={submitButtonTitle}
      />
    );
  }
}

const mapStateToProps = ({
  session: { data: session },
  paymentNetwork: { settleTxFee },
}) => ({
  session,
  settleTxFee,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch) => ({
  settleTransactions: (
    transactions,
    payForGasWithToken,
  ) => dispatch(settleTransactionsAction(transactions, payForGasWithToken)),
  estimateSettleBalance: (transactions) => dispatch(estimateSettleBalanceAction(transactions)),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(SettleBalanceConfirm);
