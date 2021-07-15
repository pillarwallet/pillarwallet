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
import get from 'lodash.get';
import type { NavigationScreenProp } from 'react-navigation';
import { BigNumber } from 'bignumber.js';
import t from 'translations/translate';

// constants
import { ETH } from 'constants/assetsConstants';
import { CHAIN } from 'constants/chainConstants';

// actions
import { settleTransactionsAction, estimateSettleBalanceAction } from 'actions/smartWalletActions';

// components
import Toast from 'components/Toast';
import ReviewAndConfirm from 'components/ReviewAndConfirm';

// selectors
import { accountEthereumWalletAssetsBalancesSelector } from 'selectors/balances';
import { useGasTokenSelector } from 'selectors/archanova';

// types
import type { SettleTxFee, TxToSettle } from 'models/PaymentNetwork';
import type { WalletAssetsBalances, WalletAssetBalance } from 'models/Balances';

// utils
import { isEnoughBalanceForTransactionFee } from 'utils/assets';
import { formatAmount, formatTransactionFee } from 'utils/common';
import { getGasToken, getTxFeeInWei } from 'utils/transactions';


type Props = {
  navigation: NavigationScreenProp<*>,
  session: Object,
  settleTransactions: Function,
  settleTxFee: SettleTxFee,
  balances: WalletAssetsBalances,
  estimateSettleBalance: Function,
  useGasToken: boolean,
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
    const {
      navigation,
      settleTransactions,
      balances,
      useGasToken,
      settleTxFee: { feeInfo },
    } = this.props;
    const txFeeInWei = getTxFeeInWei(useGasToken, feeInfo);

    const gasToken = getGasToken(useGasToken, feeInfo);
    const payForGasWithToken = !!gasToken;
    const feeSymbol = get(gasToken, 'symbol', ETH);

    // add unsettled amounts to balances
    const combinedBalances = Object.keys(balances)
      .reduce((memo, assetAddress) => {
        const balanceData: WalletAssetBalance = balances[assetAddress];
        let balance = new BigNumber(balanceData.balance);
        this.txToSettle.forEach(asset => { balance = balance.plus(asset.value); });
        return {
          [assetAddress]: {
            ...balanceData,
            balance: balance.toString(),
          },
          ...memo,
        };
      }, {});

    const balanceCheckTransaction = {
      txFeeInWei,
      gasToken,
    };
    const isEnoughForFee = isEnoughBalanceForTransactionFee(combinedBalances, balanceCheckTransaction, CHAIN.ETHEREUM);

    if (!isEnoughForFee) {
      Toast.show({
        message: t('toast.notEnoughForTransactionFee', { feeSymbol }),
        emoji: 'hushed',
        autoClose: true,
      });
      return;
    }

    this.setState({ settleButtonSubmitted: true }, async () => {
      await settleTransactions(this.txToSettle, payForGasWithToken);
      this.setState({ settleButtonSubmitted: false }, () => navigation.dismiss());
    });
  };

  render() {
    const { settleButtonSubmitted } = this.state;
    const {
      session, settleTxFee, useGasToken, settleTxFee: { feeInfo },
    } = this.props;

    let submitButtonTitle = t('ppnContent.button.releaseTankFunds');
    if (!settleTxFee.isFetched) {
      submitButtonTitle = t('label.gettingFee');
    } else if (settleButtonSubmitted) {
      submitButtonTitle = t('label.processing');
    }

    const submitButtonDisabled = !session.isOnline
      || !settleTxFee.isFetched
      || settleButtonSubmitted;

    const gasToken = getGasToken(useGasToken, feeInfo);
    const feeDisplayValue = formatTransactionFee(CHAIN.ETHEREUM, getTxFeeInWei(useGasToken, feeInfo), gasToken);

    const txToSettle = this.txToSettle.map((asset: Object) =>
      `${formatAmount(asset.value.toNumber())} ${asset.symbol}`);

    const reviewData = [
      {
        label: t('transactions.label.assetsToSettle'),
        valueArray: txToSettle,
      },
      {
        label: t('transactions.label.transactionFee'),
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
  balances: accountEthereumWalletAssetsBalancesSelector,
  useGasToken: useGasTokenSelector,
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
