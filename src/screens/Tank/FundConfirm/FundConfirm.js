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
import type { NavigationScreenProp } from 'react-navigation';
import { createStructuredSelector } from 'reselect';
import t from 'translations/translate';

// actions
import { estimateTopUpVirtualAccountAction, topUpVirtualAccountAction } from 'actions/smartWalletActions';

// constants
import { ASSETS } from 'constants/navigationConstants';
import { CHAIN } from 'constants/chainConstants';

// components
import ReviewAndConfirm from 'components/ReviewAndConfirm';

import { formatTransactionFee } from 'utils/common';
import { getGasToken, getTxFeeInWei } from 'utils/transactions';

// types
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { TopUpFee } from 'models/PaymentNetwork';

// selectors
import { useGasTokenSelector } from 'selectors/archanova';

// other
import { PPN_TOKEN } from 'configs/assetsConfig';


type Props = {
  navigation: NavigationScreenProp<*>,
  session: Object,
  topUpFee: TopUpFee,
  estimateTopUpVirtualAccount: (amount: string) => void,
  topUpVirtualAccount: (amount: string, payForGasWithToken: boolean) => void,
  useGasToken: boolean,
};

type State = {
  topUpButtonSubmitted: boolean,
};


class FundConfirm extends React.Component<Props, State> {
  state = {
    topUpButtonSubmitted: false,
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
    const { navigation, estimateTopUpVirtualAccount } = this.props;
    const amount = navigation.getParam('amount', '0');
    estimateTopUpVirtualAccount(amount);
  }

  handleFormSubmit = async () => {
    const {
      navigation, topUpVirtualAccount, useGasToken, topUpFee: { feeInfo },
    } = this.props;
    this.setState({ topUpButtonSubmitted: true });
    const amount = navigation.getParam('amount', '0');
    const payForGasWithToken = !!getGasToken(useGasToken, feeInfo);
    await topUpVirtualAccount(amount, payForGasWithToken);
    this.setState({ topUpButtonSubmitted: false }, () => navigation.navigate(ASSETS));
  };

  render() {
    const {
      session, navigation, topUpFee, useGasToken, topUpFee: { feeInfo },
    } = this.props;
    const { topUpButtonSubmitted } = this.state;
    const amount = navigation.getParam('amount', '0');
    const submitButtonTitle = !topUpButtonSubmitted ? t('ppnContent.button.fundTank') : t('label.processing');

    const gasToken = getGasToken(useGasToken, feeInfo);
    const feeDisplayValue = formatTransactionFee(CHAIN.ETHEREUM, getTxFeeInWei(useGasToken, feeInfo), gasToken);

    const reviewData = [
      {
        label: t('transactions.label.amount'),
        value: `${amount} ${PPN_TOKEN}`,
      },
      {
        label: t('transactions.label.recipient'),
        value: t('pillarTank'),
      },
      {
        label: t('transactions.label.transactionFee'),
        value: feeDisplayValue,
        isLoading: !topUpFee.isFetched,
      },
    ];

    return (
      <ReviewAndConfirm
        reviewData={reviewData}
        isConfirmDisabled={!session.isOnline || !topUpFee.isFetched || topUpButtonSubmitted}
        onConfirm={this.handleFormSubmit}
        submitButtonTitle={submitButtonTitle}
      />
    );
  }
}

const mapStateToProps = ({
  session: { data: session },
  paymentNetwork: { topUpFee },
}: RootReducerState): $Shape<Props> => ({
  session,
  topUpFee,
});

const structuredSelector = createStructuredSelector({
  useGasToken: useGasTokenSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  topUpVirtualAccount: (amount: string, payForGasWithToken: boolean) => {
    return dispatch(topUpVirtualAccountAction(amount, payForGasWithToken));
  },
  estimateTopUpVirtualAccount: (amount: string) => dispatch(estimateTopUpVirtualAccountAction(amount)),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(FundConfirm);
