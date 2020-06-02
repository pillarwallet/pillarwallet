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

import { SEND_BITCOIN_PIN_CONFIRM } from 'constants/navigationConstants';
import { defaultFiatCurrency } from 'constants/assetsConstants';

import ReviewAndConfirm from 'components/ReviewAndConfirm';

import { satoshisToBtc } from 'utils/bitcoin';
import { getFormattedRate } from 'utils/assets';
import { formatUnits } from 'utils/common';

import type { RootReducerState } from 'reducers/rootReducer';
import type { AssetData, Rates } from 'models/Asset';

type Props = {
  navigation: NavigationScreenProp<*>,
  baseFiatCurrency: ?string,
  rates: Rates,
};

type State = {
  note: ?string,
};


class SendBitcoinConfirm extends React.Component<Props, State> {
  source: string;
  assetData: AssetData;

  constructor(props: Props) {
    super(props);

    const { navigation } = this.props;
    this.assetData = navigation.getParam('assetData', {});
    this.source = navigation.getParam('source', '');
  }

  handleFormSubmit = () => {
    Keyboard.dismiss();
    const { navigation } = this.props;
    const transactionPayload = { ...navigation.getParam('transactionPayload', {}) };
    navigation.navigate(SEND_BITCOIN_PIN_CONFIRM, {
      transactionPayload,
      source: this.source,
    });
  };

  render() {
    const {
      navigation,
      rates,
      baseFiatCurrency,
    } = this.props;
    const { token, decimals } = this.assetData;
    const {
      outputs,
      fee,
    } = navigation.getParam('transactionPayload', {});

    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const output = outputs[0];
    const { value, address: to } = output;
    const amount = satoshisToBtc(value);
    const feeInBtc = satoshisToBtc(fee);
    const formattedFeeInBtc = formatUnits(`${fee || ''}`, decimals);
    const formattedAmountInBtc = formatUnits(value.toString(), decimals);
    const formattedAmountInFiat = getFormattedRate(rates, amount, token, fiatCurrency);
    const formattedFeeInFiat = getFormattedRate(rates, feeInBtc, token, fiatCurrency);

    const reviewData = [
      {
        label: 'Amount',
        value: `${formattedAmountInBtc} BTC (${formattedAmountInFiat})`,
      },
      {
        label: 'Recipient Address',
        value: to,
      },
      {
        label: 'Total fee',
        value: `${formattedFeeInBtc} BTC (${formattedFeeInFiat})`,
      },
    ];

    return (
      <ReviewAndConfirm
        reviewData={reviewData}
        onConfirm={this.handleFormSubmit}
      />
    );
  }
}

const mapStateToProps = ({
  appSettings: { data: { baseFiatCurrency } },
  rates: { data: rates },
}: RootReducerState): $Shape<Props> => ({
  baseFiatCurrency,
  rates,
});

export default connect(mapStateToProps)(SendBitcoinConfirm);
