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
import t from 'tcomb-form-native';
import { utils } from 'ethers';
import { BigNumber } from 'bignumber.js';
import styled from 'styled-components/native';
import { createStructuredSelector } from 'reselect';
import get from 'lodash.get';
import { SDK_PROVIDER } from 'react-native-dotenv';

// components
import { Container, Footer, Wrapper } from 'components/Layout';
import SingleInput from 'components/TextInput/SingleInput';
import Button from 'components/Button';
import { TextLink, Label, BaseText } from 'components/Typography';
import Header from 'components/Header';

// utils
import { parseNumber, formatAmount, isValidNumber, getCurrencySymbol, formatMoney } from 'utils/common';
import { fontSizes, spacing, UIColors } from 'utils/variables';
import { getBalance, getRate } from 'utils/assets';

// types
import type { NavigationScreenProp } from 'react-navigation';
import type { TopUpFee } from 'models/PaymentNetwork';
// import type { TokenTransactionPayload } from 'models/Transaction';
import type { Assets, Balances, Rates } from 'models/Asset';

// constants
// import { FUND_CONFIRM } from 'constants/navigationConstants';
import { ETH, defaultFiatCurrency } from 'constants/assetsConstants';

// actions
import { estimateTopUpVirtualAccountAction } from 'actions/smartWalletActions';

// selectors
import { accountBalancesSelector } from 'selectors/balances';


const { Form } = t.form;
const MIN_TX_AMOUNT = 0.000000000000000001;
const genericToken = require('assets/images/tokens/genericTokenIcon.png');

const getFormStructure = (
  maxAmount: number,
  minAmount: number,
  enoughForFee: boolean,
  formSubmitted: boolean,
  decimals: number) => {
  const Amount = t.refinement(t.String, (amount): boolean => {
    if (!isValidNumber(amount.toString())) return false;

    if (decimals === 0 && amount.toString().indexOf('.') > -1) {
      return false;
    }

    amount = parseNumber(amount.toString());
    const isValid = enoughForFee && amount <= maxAmount && amount >= minAmount;

    if (formSubmitted) return isValid && amount > 0;
    return isValid;
  });

  Amount.getValidationErrorMessage = (amount): string => {
    if (!isValidNumber(amount.toString())) {
      return 'Incorrect number entered.';
    }

    amount = parseNumber(amount.toString());
    if (!enoughForFee) {
      return 'Not enough ETH to process the transaction fee';
    } else if (amount >= maxAmount) {
      return 'Amount should not exceed the sum of total balance and est. network fee';
    } else if (amount < minAmount) {
      return 'Amount should be greater than 1 Wei (0.000000000000000001 ETH)';
    } else if (decimals === 0 && amount.toString().indexOf('.') > -1) {
      return 'Amount should not contain decimal places';
    }
    return 'Amount should be specified.';
  };

  return t.struct({
    amount: Amount,
  });
};

function AmountInputTemplate(locals) {
  const { config: { icon, valueInFiatOutput } } = locals;
  const errorMessage = locals.error;
  const inputProps = {
    autoFocus: true,
    onChange: locals.onChange,
    onBlur: locals.onBlur,
    placeholder: '0',
    value: locals.value,
    ellipsizeMode: 'middle',
    keyboardType: 'decimal-pad',
    textAlign: 'right',
    autoCapitalize: 'words',
  };

  return (
    <SingleInput
      innerImageURI={icon}
      fallbackSource={genericToken}
      errorMessage={errorMessage}
      id="amount"
      inputProps={inputProps}
      inlineLabel
      fontSize={fontSizes.giant}
      innerImageText={valueInFiatOutput}
      marginTop={30}
      noTint
      floatingImageStyle={{ marginRight: 3 }}
      white
    />
  );
}

const generateFormOptions = (config: Object): Object => ({
  fields: {
    amount: {
      template: AmountInputTemplate,
      config,
      transformer: {
        parse: (str = '') => str.toString().replace(/,/g, '.'),
        format: (value = '') => value.toString().replace(/,/g, '.'),
      },
    },
  },
});

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

type Props = {
  assets: Assets,
  navigation: NavigationScreenProp<*>,
  balances: Balances,
  session: Object,
  estimateTopUpVirtualAccount: Function,
  topUpFee: TopUpFee,
  rates: Rates,
  baseFiatCurrency: string,
};

type State = {
  value: ?{
    amount: ?string,
  },
};

class FundTank extends React.Component<Props, State> {
  _form: t.form;
  formSubmitted: boolean = false;
  enoughForFee: boolean = false;
  state = {
    value: null,
  };

  componentDidMount() {
    this.props.estimateTopUpVirtualAccount();
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.session.isOnline !== this.props.session.isOnline && this.props.session.isOnline) {
      this.props.estimateTopUpVirtualAccount();
    }
  }

  handleChange = (value: Object) => {
    this.setState({ value });
  };

  handleFormSubmit = () => {
    this.formSubmitted = true;
    // const txFeeInWei = this.getTxFeeInWei();
    const value = this._form.getValue();
    // const { navigation } = this.props;
    // const gasPrice = txFeeInWei.div(GAS_LIMIT).toNumber();

    if (!value) return;
    /*
    const transactionPayload: TokenTransactionPayload = {
      to: this.receiver,
      amount: value.amount,
      gasLimit: GAS_LIMIT,
      gasPrice,
      txFeeInWei,
      symbol: this.assetData.token,
      contractAddress: this.assetData.contractAddress,
      decimals: this.assetData.decimals,
    };
    */

    Keyboard.dismiss();
    /*
    navigation.navigate(FUND_CONFIRM, {
      transactionPayload,
    });
    */
  };

  useMaxValue = () => {
    const { balances } = this.props;
    const txFeeInWei = this.getTxFeeInWei();
    const token = ETH;
    const balance = getBalance(balances, token);
    const maxAmount = this.calculateMaxAmount(token, balance, txFeeInWei);
    this.enoughForFee = this.checkIfEnoughForFee(balances, txFeeInWei);
    this.setState({
      value: {
        amount: formatAmount(maxAmount),
      },
    });
  };

  calculateMaxAmount(token: string, balance: number | string, txFeeInWei: ?Object): number {
    if (typeof balance !== 'string') {
      balance = balance.toString();
    }
    if (token !== ETH) {
      return +balance;
    }
    const maxAmount = utils.parseUnits(balance, 'ether').sub(txFeeInWei);
    if (maxAmount.lt(0)) return 0;
    return new BigNumber(utils.formatEther(maxAmount)).toNumber();
  }

  checkIfEnoughForFee(balances: Balances, txFeeInWei): boolean {
    if (!balances[ETH]) return false;
    const ethBalance = getBalance(balances, ETH);
    const balanceInWei = utils.parseUnits(ethBalance.toString(), 'ether');
    return balanceInWei.gte(txFeeInWei);
  }

  getTxFeeInWei = () => {
    return get(this.props, 'topUpFee.feeInfo.totalCost', 0);
  };

  render() {
    const { value } = this.state;
    const {
      assets,
      session,
      balances,
      topUpFee,
      rates,
      baseFiatCurrency,
    } = this.props;
    const { symbol: token, iconUrl, decimals } = assets[ETH] || {};
    const icon = iconUrl ? `${SDK_PROVIDER}/${iconUrl}?size=3` : '';
    const balance = getBalance(balances, token);
    const formattedBalance = formatAmount(balance);
    const txFeeInWei = this.getTxFeeInWei();
    const maxAmount = this.calculateMaxAmount(token, balance, txFeeInWei);
    const isEnoughForFee = this.checkIfEnoughForFee(balances, txFeeInWei);
    const formStructure = getFormStructure(maxAmount, MIN_TX_AMOUNT, isEnoughForFee, this.formSubmitted, decimals);
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const totalInFiat = balance * getRate(rates, token, fiatCurrency);
    const formattedBalanceInFiat = formatMoney(totalInFiat);
    const currencySymbol = getCurrencySymbol(fiatCurrency);
    const currentValue = (!!value && !!parseFloat(value.amount)) ? parseFloat(value.amount) : 0;
    const valueInFiat = currentValue * getRate(rates, token, fiatCurrency);
    const formattedValueInFiat = formatMoney(valueInFiat);
    const valueInFiatOutput = `${currencySymbol}${formattedValueInFiat}`;
    const formOptions = generateFormOptions({ icon, currency: token, valueInFiatOutput });
    const feeInEth = formatAmount(utils.formatEther(this.getTxFeeInWei()));

    return (
      <Container>
        <Header
          onBack={() => this.props.navigation.goBack(null)}
          title="fund plr tank"
          white
        />
        <Wrapper regularPadding>
          <Form
            ref={node => { this._form = node; }}
            type={formStructure}
            options={formOptions}
            value={value}
            onChange={this.handleChange}
          />
          <ActionsWrapper>
            <SendTokenDetails>
              <Label small>Available Balance</Label>
              <SendTokenDetailsValue>
                {formattedBalance} {token}
                <HelperText> ({currencySymbol}{formattedBalanceInFiat})</HelperText>
              </SendTokenDetailsValue>
            </SendTokenDetails>
            <TouchableOpacity onPress={this.useMaxValue}>
              <TextLink>Send All</TextLink>
            </TouchableOpacity>
          </ActionsWrapper>
        </Wrapper>
        <Footer keyboardVerticalOffset={35}>
          <FooterInner>
            <Label>{`Estimated fee ${feeInEth} ETH`}</Label>
            {!!value && !!parseFloat(value.amount) &&
              <Button
                disabled={!session.isOnline || !topUpFee.isFetched}
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
  assets: { data: assets },
  session: { data: session },
  rates: { data: rates },
  paymentNetwork: { topUpFee },
  appSettings: { data: { baseFiatCurrency } },
}) => ({
  assets,
  rates,
  session,
  topUpFee,
  baseFiatCurrency,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch) => ({
  estimateTopUpVirtualAccount: () => dispatch(estimateTopUpVirtualAccountAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(FundTank);
