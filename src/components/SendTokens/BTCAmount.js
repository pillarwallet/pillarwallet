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
import { Keyboard } from 'react-native';
import t from 'tcomb-form-native';
import styled from 'styled-components/native';
import get from 'lodash.get';
import isEmpty from 'lodash.isempty';

// components
import { Wrapper } from 'components/Layout';
import Button from 'components/Button';
import { Label } from 'components/Typography';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import SendTokenDetails from 'components/SendTokenDetails';

// utils
import { satoshisToBtc } from 'utils/bitcoin';
import { spacing, UIColors } from 'utils/variables';
import { makeAmountForm, getAmountFormFields } from 'utils/btcFormHelpers';
import { getRate } from 'utils/assets';
import { formatFiat } from 'utils/common';

// types
import type { RootReducerState } from 'reducers/rootReducer';
import type { NavigationScreenProp } from 'react-navigation';
import type {
  BitcoinTransactionPlan,
  BitcoinTransactionTarget,
  BitcoinAddress,
  BitcoinUtxo,
  BitcoinBalance,
} from 'models/Bitcoin';
import type { Rates } from 'models/Asset';

// constants
import { SEND_BITCOIN_CONFIRM } from 'constants/navigationConstants';
import { BTC } from 'constants/assetsConstants';

const ActionsWrapper = styled.View`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

const FooterInner = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-end;
  width: 100%;
  padding: ${spacing.large}px;
  background-color: ${UIColors.defaultBackgroundColor};
`;

const BackgroundWrapper = styled.View`
  background-color: ${UIColors.defaultBackgroundColor};
  flexGrow: 1;
`;

type Props = {
  token: string;
  navigation: NavigationScreenProp<*>,
  addresses: BitcoinAddress[],
  unspentTransactions: BitcoinUtxo[],
  balances: BitcoinBalance,
  fiatCurrency: string,
  rates: Rates,
  onUpdateTransactionSpeed: (speed: string) => void,
};

type State = {
  value: ?{
    amount: ?string,
  },
  inputHasError: boolean,
};

const { Form } = t.form;
const MIN_TX_AMOUNT = 0.00000001;

class BTCAmount extends React.Component<Props, State> {
  _form: t.form;
  assetData: Object;
  formSubmitted: boolean = false;
  receiver: string;
  source: string;

  state = {
    value: null,
    inputHasError: false,
  };

  constructor(props: Props) {
    super(props);

    const { navigation } = this.props;

    this.assetData = navigation.getParam('assetData', {});
    this.receiver = navigation.getParam('receiver', '');
    this.source = navigation.getParam('source', '');
  }

  handleChange = (value: Object) => {
    // first update the amount, then after state is updated check for errors
    this.setState({ value });
    this.checkFormInputErrors();
  };

  handleFormSubmit = () => {
    const { unspentTransactions } = this.props;

    if (this.formSubmitted) {
      return;
    }
    this.formSubmitted = true;

    const value = this._form.getValue();
    if (!value) {
      return;
    }

    const transactionTarget: BitcoinTransactionTarget = {
      address: this.receiver,
      value: value.amount,
      isChange: false,
    };

    const transactionPayload: BitcoinTransactionPlan = {
      inputs: unspentTransactions,
      outputs: [transactionTarget],
      fee: 0.00000001,
      isValid: true,
    };
    const { navigation } = this.props;

    Keyboard.dismiss();
    navigation.navigate(SEND_BITCOIN_CONFIRM, {
      transactionPayload,
      source: this.source,
    });
    this.formSubmitted = false;
  };

  checkFormInputErrors = () => {
    if (!this._form) {
      return;
    }

    const { inputHasError } = this.state;
    if (!isEmpty(get(this._form.validate(), 'errors'))) {
      this.setState({ inputHasError: true });
    } else if (inputHasError) {
      this.setState({ inputHasError: false });
    }
  };

  render() {
    const {
      value,
      inputHasError,
    } = this.state;
    const {
      balances,
      addresses,
      rates,
      fiatCurrency,
    } = this.props;

    const { amount } = value || {};
    const { token, icon, decimals } = this.assetData;

    // balance
    const { address } = addresses[0];
    const { balance: satoshisBalance } = balances[address];

    const currentValue = (value && parseFloat(amount)) || 0;
    const balance = satoshisToBtc(satoshisBalance);

    const fee = 0.0001;
    const isEnoughForFee = balance >= (currentValue + fee);

    // value in fiat
    const valueInFiat = currentValue * getRate(rates, BTC, fiatCurrency);
    const valueInFiatOutput = formatFiat(valueInFiat, fiatCurrency);

    // form
    const formStructure = makeAmountForm(balance, MIN_TX_AMOUNT, isEnoughForFee, this.formSubmitted, decimals);
    const formFields = getAmountFormFields({ icon, currency: token, valueInFiatOutput });

    const showNextButton = !!amount && !!parseFloat(amount) && !inputHasError;

    return (
      <ContainerWithHeader
        headerProps={{ centerItems: [{ title: 'Send BTC' }] }}
        keyboardAvoidFooter={(
          <FooterInner>
            <Label>&nbsp;</Label>
            {showNextButton &&
              <Button
                small
                flexRight
                title="Next"
                onPress={this.handleFormSubmit}
              />
            }
          </FooterInner>
        )}
        minAvoidHeight={200}
      >
        <BackgroundWrapper>
          <Wrapper regularPadding>
            <Form
              ref={node => { this._form = node; }}
              type={formStructure}
              options={formFields}
              value={value}
              onChange={this.handleChange}
            />
            <ActionsWrapper>
              <SendTokenDetails
                rates={rates}
                fiatCurrency={fiatCurrency}
                balance={balance}
                token={token}
              />
            </ActionsWrapper>
          </Wrapper>
        </BackgroundWrapper>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  bitcoin: {
    data: {
      addresses,
      balances,
      unspentTransactions,
    },
  },
}: RootReducerState): $Shape<Props> => ({
  addresses,
  unspentTransactions,
  balances,
});

const combinedMapStateToProps = (state) => ({
  ...mapStateToProps(state),
});

export default connect(combinedMapStateToProps)(BTCAmount);
