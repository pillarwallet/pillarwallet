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
import { BigNumber } from 'bignumber.js';
import styled from 'styled-components/native';
import { createStructuredSelector } from 'reselect';
import get from 'lodash.get';
import { SDK_PROVIDER } from 'react-native-dotenv';
import isEmpty from 'lodash.isempty';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { Wrapper } from 'components/Layout';
import Button from 'components/Button';
import { TextLink, Label, BaseText } from 'components/Typography';
import Spinner from 'components/Spinner';

// configs
import { PPN_TOKEN } from 'configs/assetsConfig';

// utils
import { formatAmount, formatFiat, formatTransactionFee } from 'utils/common';
import { fontStyles, spacing } from 'utils/variables';
import { getBalance, getRate, calculateMaxAmount, isEnoughBalanceForTransactionFee } from 'utils/assets';
import { makeAmountForm, getAmountFormFields } from 'utils/formHelpers';
import { themedColors } from 'utils/themes';

// types
import type { NavigationScreenProp } from 'react-navigation';
import type { TopUpFee } from 'models/PaymentNetwork';
import type { Assets, Balances, Rates } from 'models/Asset';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';

// constants
import { FUND_CONFIRM } from 'constants/navigationConstants';
import { defaultFiatCurrency, ETH } from 'constants/assetsConstants';

// actions
import { estimateTopUpVirtualAccountAction } from 'actions/smartWalletActions';

// selectors
import { accountBalancesSelector } from 'selectors/balances';
import { accountAssetsSelector } from 'selectors/assets';
import { isGasTokenSupportedSelector } from 'selectors/smartWallet';


const ActionsWrapper = styled.View`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

const SendTokenDetails = styled.View``;

const SendTokenDetailsValue = styled(BaseText)`
  ${fontStyles.medium};
`;

const HelperText = styled(BaseText)`
  ${fontStyles.medium};
  color: ${themedColors.secondaryText};
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
  session: Object,
  estimateTopUpVirtualAccount: () => void,
  topUpFee: TopUpFee,
  rates: Rates,
  baseFiatCurrency: ?string,
  isGasTokenSupported: boolean,
};

type State = {
  value: ?{
    amount: ?string,
  },
  inputHasError: boolean,
};

const { Form } = t.form;
const MIN_TX_AMOUNT = 0.000000000000000001;

class FundTank extends React.Component<Props, State> {
  _form: t.form;
  formSubmitted: boolean = false;
  state = {
    value: null,
    inputHasError: false,
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
    this.setState({ value }, () => this.checkFormInputErrors());
  };

  handleFormSubmit = (isInitFlow: boolean) => {
    this.formSubmitted = true;
    const { navigation } = this.props;
    const formValues = this._form.getValue();

    if (!formValues) return;

    Keyboard.dismiss();
    navigation.navigate(FUND_CONFIRM, { amount: formValues.amount, isInitFlow });
  };

  useMaxValue = () => {
    const { balances } = this.props;
    const txFeeInWei = this.getTxFeeInWei();
    const token = PPN_TOKEN;
    const balance = getBalance(balances, token);
    const gasToken = this.getGasToken();
    const maxAmount = calculateMaxAmount(token, balance, txFeeInWei, gasToken);
    this.setState({
      value: {
        amount: formatAmount(maxAmount),
      },
    }, () => this.checkFormInputErrors);
  };

  getTxFeeInWei = (): BigNumber => {
    const gasTokenCost = get(this.props, 'topUpFee.feeInfo.gasTokenCost');
    if (this.props.isGasTokenSupported && gasTokenCost) return gasTokenCost;
    return get(this.props, 'topUpFee.feeInfo.totalCost', 0);
  };

  getGasToken = () => {
    return this.props.isGasTokenSupported
      ? get(this.props, 'topUpFee.feeInfo.gasToken')
      : null;
  };

  checkFormInputErrors = () => {
    const { inputHasError } = this.state;
    if (!this._form) return;
    if (!isEmpty(get(this._form.validate(), 'errors'))) {
      this.setState({ inputHasError: true });
    } else if (inputHasError) {
      this.setState({ inputHasError: false });
    }
  };

  render() {
    const { value, inputHasError } = this.state;
    const {
      assets,
      session,
      balances,
      topUpFee,
      rates,
      baseFiatCurrency,
      navigation,
    } = this.props;

    const { symbol: token, iconUrl, decimals } = assets[PPN_TOKEN] || {};
    const icon = iconUrl ? `${SDK_PROVIDER}/${iconUrl}?size=2` : '';
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const isInitFlow = navigation.getParam('isInitFlow', false);

    // balance
    const balance = getBalance(balances, token);
    const formattedBalance = formatAmount(balance);

    // balance in fiat
    const totalInFiat = balance * getRate(rates, PPN_TOKEN, fiatCurrency);
    const formattedBalanceInFiat = formatFiat(totalInFiat, baseFiatCurrency);

    // value
    const currentValue = (!!value && !!parseFloat(value.amount)) ? parseFloat(value.amount) : 0;

    // fee
    const gasToken = this.getGasToken();
    const txFeeInWei = this.getTxFeeInWei();
    const isEnoughForFee = isEnoughBalanceForTransactionFee(balances, {
      amount: currentValue,
      decimals,
      symbol: token,
      txFeeInWei,
      gasToken,
    });
    const feeSymbol = get(gasToken, 'symbol', ETH);
    const feeDisplayValue = formatTransactionFee(txFeeInWei, gasToken);

    // max amount
    const maxAmount = calculateMaxAmount(token, balance, txFeeInWei, gasToken);

    // value in fiat
    const valueInFiat = currentValue * getRate(rates, PPN_TOKEN, fiatCurrency);
    const valueInFiatOutput = formatFiat(valueInFiat, baseFiatCurrency);

    // form
    const formStructure = makeAmountForm(
      maxAmount,
      MIN_TX_AMOUNT,
      isEnoughForFee,
      this.formSubmitted,
      decimals,
      feeSymbol,
    );
    const formFields = getAmountFormFields({
      icon,
      currency: token,
      valueInFiatOutput,
      customProps: { inputWrapperStyle: { marginTop: spacing.large } },
    });

    return (
      <ContainerWithHeader
        headerProps={{ centerItems: [{ title: isInitFlow ? 'Stake initial PLR' : 'Fund PLR tank' }] }}
        footer={(
          <FooterInner>
            {!topUpFee.isFetched && balance > 0 && <Spinner width={20} height={20} />}
            {topUpFee.isFetched && <Label>Estimated fee: {feeDisplayValue}</Label>}
            {!!value && !!parseFloat(value.amount) && !inputHasError &&
            <Button
              disabled={!session.isOnline || !topUpFee.isFetched}
              small
              flexRight
              title="Next"
              onPress={() => this.handleFormSubmit(isInitFlow)}
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
            {topUpFee.isFetched &&
            <TouchableOpacity onPress={this.useMaxValue}>
              <TextLink>Send all</TextLink>
            </TouchableOpacity>
            }
          </ActionsWrapper>
        </Wrapper>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  session: { data: session },
  rates: { data: rates },
  paymentNetwork: { topUpFee },
  appSettings: { data: { baseFiatCurrency } },
}: RootReducerState): $Shape<Props> => ({
  rates,
  session,
  topUpFee,
  baseFiatCurrency,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
  assets: accountAssetsSelector,
  isGasTokenSupported: isGasTokenSupportedSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  estimateTopUpVirtualAccount: () => dispatch(estimateTopUpVirtualAccountAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(FundTank);
