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
import { Keyboard } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import t from 'translations/translate';

// constants
import { SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';

// components
import ReviewAndConfirm from 'components/ReviewAndConfirm';

// utils
import { formatTransactionFee } from 'utils/common';

// types
import type { RootReducerState } from 'reducers/rootReducer';


type Props = {
  navigation: NavigationScreenProp<*>,
  session: Object,
};

class SendTokenConfirm extends React.Component<Props> {
  source: string;

  constructor(props) {
    super(props);
    this.source = this.props.navigation.getParam('source', '');
  }

  handleFormSubmit = () => {
    Keyboard.dismiss();
    const { navigation } = this.props;
    const transactionPayload = { ...navigation.getParam('transactionPayload', {}) };
    navigation.navigate(SEND_TOKEN_PIN_CONFIRM, {
      transactionPayload,
      source: this.source,
    });
  };

  render() {
    const {
      session,
      navigation,
    } = this.props;
    const {
      amount,
      to,
      receiverEnsName,
      txFeeInWei,
      symbol,
      gasToken,
    } = navigation.getParam('transactionPayload', {});

    const feeDisplayValue = txFeeInWei === 0 ? 'free' : formatTransactionFee(txFeeInWei, gasToken);

    const reviewData = [
      {
        label: t('transactions.label.amount'),
        value: t('tokenValue', { value: amount, token: symbol }),
      },
    ];

    if (receiverEnsName) {
      reviewData.push({
        label: t('transactions.label.recipientEnsName'),
        value: receiverEnsName,
      });
    }

    reviewData.push(
      {
        label: t('transactions.label.recipientAddress'),
        value: to,
      },
      {
        label: t('transactions.label.transactionFee'),
        value: feeDisplayValue,
      },
    );

    return (
      <ReviewAndConfirm
        reviewData={reviewData}
        isConfirmDisabled={!session.isOnline}
        onConfirm={this.handleFormSubmit}
      />
    );
  }
}

const mapStateToProps = ({
  session: { data: session },
}: RootReducerState): $Shape<Props> => ({
  session,
});

export default connect(mapStateToProps)(SendTokenConfirm);
