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
import type { NavigationScreenProp } from 'react-navigation';
import { getEnv } from 'configs/envConfig';
import t from 'translations/translate';

// components
import ReviewAndConfirm from 'components/ReviewAndConfirm';

// constants
import { SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';
import { PPN_TOKEN } from 'configs/assetsConfig';

// selectors
import { availableStakeSelector } from 'selectors/paymentNetwork';


// models, types
import type { Asset } from 'models/Asset';
import type { SyntheticTransaction } from 'models/Transaction';
import type { RootReducerState } from 'reducers/rootReducer';

type Props = {
  navigation: NavigationScreenProp<*>,
  isOnline: boolean,
  supportedAssets: Asset[],
  availableStake: number,
};

class SendSyntheticConfirm extends React.Component<Props> {
  syntheticTransaction: SyntheticTransaction;
  assetData: Asset;

  constructor(props: Props) {
    super(props);
    const { navigation } = props;
    this.syntheticTransaction = navigation.getParam('syntheticTransaction');
    this.assetData = navigation.getParam('assetData', {});
  }

  onConfirmPress = () => {
    const { fromAmount, receiverEnsName } = this.syntheticTransaction;
    const { symbol, decimals, address: contractAddress } = this.assetData;
    const syntheticTransaction = { ...this.syntheticTransaction };
    const transactionPayload = {
      amount: fromAmount,
      to: getEnv().SYNTHETICS_CONTRACT_ADDRESS,
      receiverEnsName,
      symbol,
      contractAddress,
      decimals,
      usePPN: true,
      extra: { syntheticTransaction },
    };
    this.props.navigation.navigate(SEND_TOKEN_PIN_CONFIRM, { transactionPayload });
  };

  render() {
    const {
      isOnline,
      availableStake,
    } = this.props;

    const {
      fromAmount,
      toAmount,
      toAssetCode,
      toAddress,
      receiverEnsName,
    } = this.syntheticTransaction;

    let errorMessage;
    if (availableStake < fromAmount) errorMessage = t('error.transactionFailed.notEnoughStake');
    else if (!isOnline) errorMessage = t('error.transactionFailed.offline');

    const reviewData = [];

    if (receiverEnsName) {
      reviewData.push({
        label: t('transactions.label.recipientEnsName'),
        value: receiverEnsName,
      });
    }

    reviewData.push(
      {
        label: t('transactions.label.recipientAddress'),
        value: toAddress,
      },
      {
        label: t('transactions.label.recipientGet'),
        value: t('tokenValue', { value: toAmount, token: toAssetCode }),
      },
      {
        label: t('transactions.label.youPay'),
        value: t('tokenValue', { value: fromAmount, token: PPN_TOKEN }),
      },
      {
        label: t('transactions.label.transactionFee'),
        value: t('label.free'),
      },
    );


    return (
      <ReviewAndConfirm
        reviewData={reviewData}
        onConfirm={this.onConfirmPress}
        isConfirmDisabled={!!errorMessage}
        errorMessage={errorMessage}
      />
    );
  }
}

const mapStateToProps = ({
  session: { data: { isOnline } },
  assets: { supportedAssets },
}: RootReducerState): $Shape<Props> => ({
  isOnline,
  supportedAssets,
});

const structuredSelector = createStructuredSelector({
  availableStake: availableStakeSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default connect(combinedMapStateToProps)(SendSyntheticConfirm);
