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
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { Wrapper } from 'components/Layout';
import Button from 'components/Button';
import { TextLink, Label, BaseText } from 'components/Typography';

// configs
import { PPN_TOKEN } from 'configs/assetsConfig';

// utils
import { formatAmount, formatFiat } from 'utils/common';
import { baseColors, fontSizes, spacing, fontStyles } from 'utils/variables';
import { getRate, calculateMaxAmount, checkIfEnoughForFee } from 'utils/assets';
import { makeAmountForm, getAmountFormFields } from 'utils/formHelpers';

// types
import type { NavigationScreenProp } from 'react-navigation';
import type { WithdrawalFee } from 'models/PaymentNetwork';
import type { Assets, Balances, Rates } from 'models/Asset';

// constants
import { TANK_WITHDRAWAL_CONFIRM } from 'constants/navigationConstants';
import { defaultFiatCurrency } from 'constants/assetsConstants';

// actions
import { estimateWithdrawFromVirtualAccountAction } from 'actions/smartWalletActions';

// selectors
import { accountBalancesSelector } from 'selectors/balances';
import { availableStakeSelector } from 'selectors/paymentNetwork';
import { accountAssetsSelector } from 'selectors/assets';


const ActionsWrapper = styled.View`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

const SendTokenDetails = styled.View``;

const SendTokenDetailsValue = styled(BaseText)`
  font-size: ${fontSizes.medium}px;
  margin-bottom: 8px;
`;

const HelperText = styled(BaseText)`
  ${fontStyles.medium};
  margin-bottom: ${spacing.rhythm / 2}px;
  color: ${baseColors.secondaryText};
  margin-left: 4px;
`;

const FooterInner = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-end;
  width: 100%;
  padding: ${spacing.large}px;
`;

const TextRow = styled.View`
  flex-direction: row;
`;

type Props = {
  assets: Assets,
  navigation: NavigationScreenProp<*>,
  balances: Balances,
  availableStake: number,
  session: Object,
  estimateWithdrawFromVirtualAccount: Function,
  withdrawalFee: WithdrawalFee,
  rates: Rates,
  baseFiatCurrency: string,
};

type State = {
  value: ?{
    amount: ?string,
  },
};

const { Form } = t.form;
const MIN_TX_AMOUNT = 0.000000000000000001;

class TankWithdrawal extends React.Component<Props, State> {
  _form: t.form;
  formSubmitted: boolean = false;
  enoughForFee: boolean = false;
  state = {
    value: null,
  };

  componentDidMount() {
    this.props.estimateWithdrawFromVirtualAccount(this.getMaxAmount().toString());
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.session.isOnline !== this.props.session.isOnline && this.props.session.isOnline) {
      this.props.estimateWithdrawFromVirtualAccount(this.getMaxAmount().toString());
    }
  }

  getMaxAmount() {
    const { availableStake } = this.props;
    const token = PPN_TOKEN;
    const txFeeInWei = this.getTxFeeInWei();
    return calculateMaxAmount(token, availableStake, txFeeInWei);
  }

  handleChange = (value: Object) => {
    this.setState({ value });
  };

  handleFormSubmit = () => {
    this.formSubmitted = true;
    const { navigation } = this.props;
    const formValues = this._form.getValue();

    if (!formValues) return;

    Keyboard.dismiss();
    navigation.navigate(TANK_WITHDRAWAL_CONFIRM, { amount: formValues.amount });
  };

  useMaxValue = () => {
    const { balances } = this.props;
    const txFeeInWei = this.getTxFeeInWei();
    const maxAmount = this.getMaxAmount();
    this.enoughForFee = checkIfEnoughForFee(balances, txFeeInWei);
    this.setState({
      value: {
        amount: formatAmount(maxAmount),
      },
    });
  };

  getTxFeeInWei = (): BigNumber => {
    return get(this.props, 'withdrawalFee.feeInfo.totalCost', 0);
  };

  render() {
    const { value } = this.state;
    const {
      assets,
      availableStake,
      session,
      balances,
      withdrawalFee,
      rates,
      baseFiatCurrency,
    } = this.props;

    const { symbol: token, iconMonoUrl, decimals } = assets[PPN_TOKEN] || {};
    const icon = iconMonoUrl ? `${SDK_PROVIDER}/${iconMonoUrl}?size=2` : '';
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;

    // balance
    const balance = availableStake;
    const formattedBalance = formatAmount(balance);

    // balance in fiat
    const totalInFiat = balance * getRate(rates, PPN_TOKEN, fiatCurrency);
    const formattedBalanceInFiat = formatFiat(totalInFiat, baseFiatCurrency);

    // fee
    const txFeeInWei = this.getTxFeeInWei();
    const isEnoughForFee = checkIfEnoughForFee(balances, txFeeInWei);
    const feeInEth = formatAmount(utils.formatEther(this.getTxFeeInWei()));

    // max amount
    const maxAmount = calculateMaxAmount(token, balance, txFeeInWei);

    // value
    const currentValue = (!!value && !!parseFloat(value.amount)) ? parseFloat(value.amount) : 0;

    // value in fiat
    const valueInFiat = currentValue * getRate(rates, PPN_TOKEN, fiatCurrency);
    const valueInFiatOutput = formatFiat(valueInFiat, baseFiatCurrency);

    // form
    const formStructure = makeAmountForm(maxAmount, MIN_TX_AMOUNT, isEnoughForFee, this.formSubmitted, decimals);
    const formFields = getAmountFormFields({
      icon,
      currency: token,
      valueInFiatOutput,
    });

    return (
      <ContainerWithHeader
        headerProps={{ centerItems: [{ title: 'Withdraw from PLR tank' }] }}
        backgroundColor={baseColors.card}
        keyboardAvoidFooter={(
          <FooterInner>
            <Label>Estimated fee {feeInEth} ETH</Label>
            {!!value && !!parseFloat(value.amount) &&
            <Button
              disabled={!session.isOnline || !withdrawalFee.isFetched}
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
              <TextRow>
                <SendTokenDetailsValue>
                  {formattedBalance} {token}
                </SendTokenDetailsValue>
                <HelperText>{formattedBalanceInFiat}</HelperText>
              </TextRow>
            </SendTokenDetails>
            <TouchableOpacity onPress={this.useMaxValue}>
              <TextLink>Send All</TextLink>
            </TouchableOpacity>
          </ActionsWrapper>
        </Wrapper>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  session: { data: session },
  rates: { data: rates },
  paymentNetwork: { withdrawalFee },
  appSettings: { data: { baseFiatCurrency } },
}) => ({
  rates,
  session,
  withdrawalFee,
  baseFiatCurrency,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
  assets: accountAssetsSelector,
  availableStake: availableStakeSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch) => ({
  estimateWithdrawFromVirtualAccount: (amount) => dispatch(estimateWithdrawFromVirtualAccountAction(amount)),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(TankWithdrawal);
