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
import { Keyboard } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';

import { ScrollWrapper } from 'components/Layout';
import { Label, MediumText } from 'components/Typography';
import Button from 'components/Button';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';

import { SEND_BITCOIN_PIN_CONFIRM } from 'constants/navigationConstants';
import { BTC, defaultFiatCurrency } from 'constants/assetsConstants';

import { baseColors, fontSizes, spacing } from 'utils/variables';
import { satoshisToBtc } from 'utils/bitcoin';
import { getFormattedRate } from 'utils/assets';

import type { RootReducerState } from 'reducers/rootReducer';
import type { Rates } from 'models/Asset';

type Props = {
  navigation: NavigationScreenProp<*>,
  baseFiatCurrency: ?string,
  rates: Rates,
};

type State = {
  note: ?string,
};

const FooterWrapper = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: ${spacing.large}px;
  width: 100%;
  background-color: ${baseColors.snowWhite};
`;

const LabeledRow = styled.View`
  margin: 10px 0;
`;

const Value = styled(MediumText)`
  font-size: ${fontSizes.big}px;
`;

class SendBitcoinConfirm extends React.Component<Props, State> {
  source: string;

  constructor(props: Props) {
    super(props);

    this.source = this.props.navigation.getParam('source', '');
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
    const {
      outputs,
      fee,
    } = navigation.getParam('transactionPayload', {});

    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const output = outputs[0];
    const { value, address: to } = output;
    const amount = satoshisToBtc(value);
    const feeInBtc = satoshisToBtc(fee);
    const formattedAmountInFiat = getFormattedRate(rates, amount, BTC, fiatCurrency);
    const formattedFeeInFiat = getFormattedRate(rates, feeInBtc, BTC, fiatCurrency);

    return (
      <ContainerWithHeader
        headerProps={{ centerItems: [{ title: 'Review and confirm' }] }}
        keyboardAvoidFooter={(
          <FooterWrapper>
            <Button onPress={this.handleFormSubmit} title="Confirm Transaction" />
          </FooterWrapper>
        )}
      >
        <ScrollWrapper
          regularPadding
          disableAutomaticScroll
        >
          <LabeledRow>
            <Label>Amount</Label>
            <Value>{amount} BTC ({formattedAmountInFiat})</Value>
          </LabeledRow>
          <LabeledRow>
            <Label>Recipient Address</Label>
            <Value>{to}</Value>
          </LabeledRow>
          <LabeledRow>
            <Label>Total fee</Label>
            <Value>{feeInBtc} BTC ({formattedFeeInFiat})</Value>
          </LabeledRow>
        </ScrollWrapper>
      </ContainerWithHeader>
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
