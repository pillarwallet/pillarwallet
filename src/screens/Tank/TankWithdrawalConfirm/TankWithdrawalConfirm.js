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
import get from 'lodash.get';
import type { NavigationScreenProp } from 'react-navigation';
import { BigNumber } from 'bignumber.js';

// actions
import {
  estimateWithdrawFromVirtualAccountAction,
  withdrawFromVirtualAccountAction,
} from 'actions/smartWalletActions';

// constants
import { ASSETS } from 'constants/navigationConstants';

// components
import ReviewAndConfirm from 'components/ReviewAndConfirm';

// utils
import { formatTransactionFee } from 'utils/common';

// types
import type { WithdrawalFee } from 'models/PaymentNetwork';

// other
import { PPN_TOKEN } from 'configs/assetsConfig';


type Props = {
  navigation: NavigationScreenProp<*>,
  session: Object,
  withdrawalFee: WithdrawalFee,
  estimateWithdrawFromVirtualAccount: Function,
  withdrawFromVirtualAccount: Function,
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
    const { navigation, estimateWithdrawFromVirtualAccount } = this.props;
    const amount = navigation.getParam('amount', '0');
    estimateWithdrawFromVirtualAccount(amount);
  }

  handleFormSubmit = async () => {
    const { navigation, withdrawFromVirtualAccount } = this.props;
    this.setState({ buttonSubmitted: true });
    const amount = navigation.getParam('amount', '0');
    const payForGasWithToken = !!get(this.props, 'withdrawalFee.feeInfo.gasTokenCost');
    await withdrawFromVirtualAccount(amount, payForGasWithToken);
    this.setState({ buttonSubmitted: false }, () => navigation.navigate(ASSETS));
  };

  getTxFeeInWei = (): BigNumber => {
    return get(this.props, 'withdrawalFee.feeInfo.gasTokenCost')
      || get(this.props, 'withdrawalFee.feeInfo.totalCost', 0);
  };

  render() {
    const { session, navigation, withdrawalFee } = this.props;
    const { buttonSubmitted } = this.state;
    const amount = navigation.getParam('amount', '0');

    const gasToken = get(this.props, 'withdrawalFee.feeInfo.gasToken');
    const feeDisplayValue = formatTransactionFee(this.getTxFeeInWei(), gasToken);

    const submitButtonTitle = buttonSubmitted
      ? 'Processing...'
      : 'Withdraw from PLR tank';

    const reviewData = [
      {
        label: 'Amount',
        value: `${amount} ${PPN_TOKEN}`,
      },
      {
        label: 'Recipient',
        value: 'Main Account',
      },
      {
        label: 'Transaction fee',
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

const mapStateToProps = ({
  session: { data: session },
  paymentNetwork: { withdrawalFee },
}) => ({
  session,
  withdrawalFee,
});

const mapDispatchToProps = (dispatch) => ({
  withdrawFromVirtualAccount: (
    amount: string,
    payForGasWithToken: boolean,
  ) => dispatch(withdrawFromVirtualAccountAction(amount, payForGasWithToken)),
  estimateWithdrawFromVirtualAccount: (amount: string) => dispatch(estimateWithdrawFromVirtualAccountAction(amount)),
});

export default connect(mapStateToProps, mapDispatchToProps)(TankWithdrawalConfirm);
