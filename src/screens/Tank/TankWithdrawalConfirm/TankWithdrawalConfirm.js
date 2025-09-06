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
import type { NativeStackNavigationProp as NavigationScreenProp } from '@react-navigation/native-stack';
import { createStructuredSelector } from 'reselect';
import t from 'translations/translate';
import type { Route } from '@react-navigation/native';

// actions
import { estimateWithdrawFromVirtualAccountAction, withdrawFromVirtualAccountAction } from 'actions/smartWalletActions';

// constants
import { CHAIN } from 'constants/chainConstants';

// components
import ReviewAndConfirm from 'components/ReviewAndConfirm';

// utils
import { formatTransactionFee, formatTokenAmount } from 'utils/common';
import { getGasToken, getTxFeeInWei } from 'utils/transactions';

// types
import type { WithdrawalFee } from 'models/PaymentNetwork';
import type { RootReducerState } from 'reducers/rootReducer';

// other
import { PPN_TOKEN } from 'configs/assetsConfig';

// selectors
import { useGasTokenSelector } from 'selectors/archanova';

type Props = {
  navigation: NavigationScreenProp<*>,
  route: Route,
  session: Object,
  withdrawalFee: WithdrawalFee,
  estimateWithdrawFromVirtualAccount: Function,
  withdrawFromVirtualAccount: Function,
  useGasToken: boolean,
};

type State = {
  buttonSubmitted: boolean,
};

class TankWithdrawalConfirm extends React.Component<Props, State> {
  state = {
    buttonSubmitted: false,
  };

  componentDidMount() {
    this.callEstimateMethod();
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.session.isOnline !== this.props.session.isOnline && this.props.session.isOnline) {
      this.callEstimateMethod();
    }
  }

  callEstimateMethod() {
    const { route, estimateWithdrawFromVirtualAccount } = this.props;
    const amount = route?.params?.amount || '0';
    estimateWithdrawFromVirtualAccount(amount);
  }

  handleFormSubmit = async () => {
    const {
      route,
      withdrawFromVirtualAccount,
      useGasToken,
      withdrawalFee: { feeInfo },
    } = this.props;
    this.setState({ buttonSubmitted: true });
    const amount = route?.params?.amount || '0';
    const payForGasWithToken = !!getGasToken(useGasToken, feeInfo);
    await withdrawFromVirtualAccount(amount, payForGasWithToken);
    this.setState({ buttonSubmitted: false });
  };

  render() {
    const {
      session,
      route,
      withdrawalFee,
      useGasToken,
      withdrawalFee: { feeInfo },
    } = this.props;
    const { buttonSubmitted } = this.state;
    const amount = route?.params?.amount || '0';
    const formattedAmount = formatTokenAmount(amount, PPN_TOKEN);

    const gasToken = getGasToken(useGasToken, feeInfo);
    const feeDisplayValue = formatTransactionFee(CHAIN.ETHEREUM, getTxFeeInWei(useGasToken, feeInfo), gasToken);

    const submitButtonTitle = buttonSubmitted ? t('label.processing') : t('ppnContent.button.withdrawFromTank');

    const reviewData = [
      {
        label: t('transactions.label.amount'),
        value: t('tokenValue', { value: formattedAmount, token: PPN_TOKEN }),
      },
      {
        label: t('transactions.label.receiver'),
        value: t('label.mainAccount'),
      },
      {
        label: t('transactions.label.transactionFee'),
        value: feeDisplayValue,
        isLoading: !withdrawalFee.isFetched,
      },
    ];

    return (
      <ReviewAndConfirm
        reviewData={reviewData}
        isConfirmDisabled={!session.isOnline || !withdrawalFee.isFetched || buttonSubmitted}
        onConfirm={this.handleFormSubmit}
        submitButtonTitle={submitButtonTitle}
      />
    );
  }
}

const mapStateToProps = ({ session: { data: session }, paymentNetwork: { withdrawalFee } }) => ({
  session,
  withdrawalFee,
});

const structuredSelector = createStructuredSelector({
  useGasToken: useGasTokenSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch) => ({
  withdrawFromVirtualAccount: (amount: string, payForGasWithToken: boolean) =>
    dispatch(withdrawFromVirtualAccountAction(amount, payForGasWithToken)),
  estimateWithdrawFromVirtualAccount: (amount: string) => dispatch(estimateWithdrawFromVirtualAccountAction(amount)),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(TankWithdrawalConfirm);
