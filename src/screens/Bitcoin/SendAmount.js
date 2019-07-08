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
import { TouchableOpacity, Keyboard } from 'react-native';
import Toast from 'components/Toast';
import t from 'tcomb-form-native';
import styled from 'styled-components/native';
import { createStructuredSelector } from 'reselect';

// components
import { Container, Footer, Wrapper } from 'components/Layout';
import Button from 'components/Button';
import { TextLink, Label, BaseText } from 'components/Typography';
import Header from 'components/Header';

// utils
import { formatAmount, getCurrencySymbol, formatMoney } from 'utils/common';
import { baseColors, fontSizes, spacing, UIColors } from 'utils/variables';
import { getRate } from 'utils/assets';
import { makeAmountForm, getAmountFormFields } from 'utils/formHelpers';
import { unspentAmount, btcToSatoshis } from 'utils/bitcoin';

// types
import type { NavigationScreenProp } from 'react-navigation';
import type { Rates } from 'models/Asset';
import type {
  BitcoinUtxo,
  BitcoinTransactionTarget,
} from 'models/Bitcoin';

// constants
import { SEND_BITCOIN_CONFIRM } from 'constants/navigationConstants';
import { BTC, defaultFiatCurrency, SPEED_TYPES } from 'constants/assetsConstants';

// actions
import { updateAppSettingsAction } from 'actions/appSettingsActions';
import { refreshAddressBalanceAction } from 'actions/bitcoinActions';

// selectors
import { accountBalancesSelector } from 'selectors/balances';

import { collectOutputs } from 'services/bitcoin';

const ActionsWrapper = styled.View`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

const SendTokenDetails = styled.View``;

const SendTokenDetailsValue = styled(BaseText)`
  font-size: ${fontSizes.small};
  margin-bottom: 8px;
`;

const HelperText = styled(BaseText)`
  font-size: ${fontSizes.small};
  margin-bottom: ${spacing.rhythm / 2}px;
  color: ${UIColors.placeholderTextColor};
`;

const FooterInner = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-end;
  width: 100%;
`;

const BackgroundWrapper = styled.View`
  background-color: ${UIColors.defaultBackgroundColor};
  flex: 1;
`;

type Props = {
  address: string,
  navigation: NavigationScreenProp<*>,
  formValues?: Object,
  session: Object,
  rates: Rates,
  baseFiatCurrency: string,
  transactionSpeed: string,
  updateAppSettings: (path: string, value: string) => void,
  unspentTransactions: BitcoinUtxo[],
  refreshAddressBalance: (address: string) => void,
};

type State = {
  value: ?{
    amount: ?string,
  },
};

const { Form } = t.form;

const MIN_TX_AMOUNT = 0.00000001;

class SendBitcoinAmount extends React.Component<Props, State> {
  _form: t.form;
  fromAddress: string;
  toAddress: string;

  formSubmitted: boolean = false;
  enoughForFee: boolean = false;

  state = {
    value: null,
  };

  constructor(props: Props) {
    const { navigation } = props;

    super(props);

    this.fromAddress = navigation.getParam('fromAddress', '');
    this.toAddress = navigation.getParam('toAddress', '');
  }

  refreshBalance() {
    this.props.refreshAddressBalance(this.fromAddress);
  }

  componentDidMount() {
    this.refreshBalance();
  }

  totalBalance(): number {
    const { unspentTransactions } = this.props;

    return unspentAmount(unspentTransactions);
  }

  getTxSpeed = () => {
    return this.props.transactionSpeed || SPEED_TYPES.NORMAL;
  };

  handleChange = (value: Object) => {
    this.setState({ value });
  };

  handleFormSubmit = () => {
    this.formSubmitted = true;
    const { amount } = this._form.getValue();

    const {
      navigation,
      unspentTransactions,
    } = this.props;
    const transactionSpeed = this.getTxSpeed();

    if (!amount) return;
    const value = btcToSatoshis(parseFloat(amount));

    const targets: BitcoinTransactionTarget[] = [
      { value, address: this.toAddress },
    ];

    const changeAddress = this.fromAddress;
    const plan = collectOutputs(targets, transactionSpeed, unspentTransactions, () => {
      // TODO: change address should be an unused address
      return changeAddress;
    });

    if (!plan.isValid) {
      Toast.show({
        message: 'Please make sure you have enough funds',
        type: 'warning',
        title: 'Cannot create transaction',
        autoClose: false,
      });

      return;
    }

    Keyboard.dismiss();

    navigation.navigate(SEND_BITCOIN_CONFIRM, {
      plan,
    });
  };

  useMaxValue = (amount: number): void => {
    this.setState({
      value: { amount: formatAmount(amount) },
    });
  };

  render() {
    const { value } = this.state;
    const {
      session,
      rates,
      baseFiatCurrency,
    } = this.props;

    const balance = this.totalBalance();

    const decimals = 8;
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const currencySymbol = getCurrencySymbol(fiatCurrency);
    // Transaction fee depends on the inputs used,
    // so calculating it is not straightforward
    const transactionFee = 0.0001125;

    // balance
    const formattedBalance = formatAmount(balance);
    const assetRate = getRate(rates, BTC, fiatCurrency);

    // balance in fiat
    const totalInFiat = balance * assetRate;
    const formattedBalanceInFiat = formatMoney(totalInFiat);

    // max amount
    const maxAmount = balance - transactionFee;
    const isEnoughForFee = balance >= transactionFee;

    // value
    const currentValue = (!!value && !!parseFloat(value.amount)) ? parseFloat(value.amount) : 0;

    // value in fiat
    const valueInFiat = currentValue * assetRate;
    const formattedValueInFiat = formatMoney(valueInFiat);
    const valueInFiatOutput = `${currencySymbol}${formattedValueInFiat}`;

    // form
    const formStructure = makeAmountForm(maxAmount, MIN_TX_AMOUNT, isEnoughForFee, this.formSubmitted, decimals);
    const formFields = getAmountFormFields({ currency: BTC, valueInFiatOutput });

    return (
      <Container color={baseColors.white}>
        <Header
          onBack={() => this.props.navigation.goBack(null)}
          title="send Bitcoin"
          white
        />
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
              <SendTokenDetails>
                <Label small>Available Balance</Label>
                <SendTokenDetailsValue>
                  {formattedBalance} BTC
                  <HelperText> ({currencySymbol}{formattedBalanceInFiat})</HelperText>
                </SendTokenDetailsValue>
              </SendTokenDetails>
              <TouchableOpacity onPress={() => this.useMaxValue(maxAmount)}>
                <TextLink>Send All</TextLink>
              </TouchableOpacity>
            </ActionsWrapper>
          </Wrapper>
        </BackgroundWrapper>
        <Footer keyboardVerticalOffset={35} backgroundColor={UIColors.defaultBackgroundColor}>
          <FooterInner>
            {!!value && !!parseFloat(value.amount) &&
              <Button
                disabled={!session.isOnline}
                small
                flexRight
                title="Next"
                onPress={this.handleFormSubmit}
              />
            }
          </FooterInner>
        </Footer>
      </Container>
    );
  }
}

const mapStateToProps = ({
  session: { data: session },
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency, transactionSpeed } },
  bitcoin: { data: { unspentTransactions } },
}) => ({
  rates,
  session,
  baseFiatCurrency,
  transactionSpeed,
  unspentTransactions,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch) => ({
  updateAppSettings: (path: string, value: string) => dispatch(updateAppSettingsAction(path, value)),
  refreshAddressBalance: (address: string) => dispatch(refreshAddressBalanceAction(address, false)),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(SendBitcoinAmount);
