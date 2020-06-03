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
import styled from 'styled-components/native';
import { connect } from 'react-redux';
import get from 'lodash.get';
import { BigNumber } from 'bignumber.js';

import type { RootReducerState } from 'reducers/rootReducer';

import { Label } from 'components/Typography';
import Spinner from 'components/Spinner';

import { defaultFiatCurrency, ETH } from 'constants/assetsConstants';

import { formatTransactionFee, getCurrencySymbol } from 'utils/common';
import { getRate } from 'utils/assets';

import type { Rates } from 'models/Asset';
import type { GasToken } from 'models/Transaction';


type Props = {
  baseFiatCurrency: ?string,
  rates: Rates,
  txFeeInWei: BigNumber | number,
  gasToken: ?GasToken,
  isLoading?: boolean,
};

type State = {
  isFiatValueVisible: boolean,
};


const LabelWrapper = styled.TouchableOpacity`
  flex-direction: row;
`;


class FeeLabelToggle extends React.Component<Props, State> {
  state = {
    isFiatValueVisible: false,
  };

  toggleValue = () => {
    this.setState(({ isFiatValueVisible }) => ({ isFiatValueVisible: !isFiatValueVisible }));
  };

  render() {
    const { isFiatValueVisible } = this.state;
    const {
      txFeeInWei,
      gasToken,
      baseFiatCurrency,
      rates,
      isLoading,
    } = this.props;

    if (isLoading) {
      return <Spinner width={20} height={20} />;
    }

    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const feeDisplayValue = formatTransactionFee(txFeeInWei, gasToken);
    const gasTokenSymbol = get(gasToken, 'symbol', ETH);
    const currencySymbol = getCurrencySymbol(fiatCurrency);

    const feeInFiat = parseFloat(feeDisplayValue) * getRate(rates, gasTokenSymbol, fiatCurrency);
    const feeInFiatDisplayValue = `${currencySymbol}${feeInFiat.toFixed(2)}`;
    const labelValue = isFiatValueVisible ? feeInFiatDisplayValue : feeDisplayValue;
    return (
      <LabelWrapper onPress={this.toggleValue}>
        <Label>Estimated fee: </Label>
        <Label>{labelValue}</Label>
      </LabelWrapper>
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


export default connect(mapStateToProps)(FeeLabelToggle);
