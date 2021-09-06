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
import tForm from 'tcomb-form-native';
import styled from 'styled-components/native';
import { createStructuredSelector } from 'reselect';
import get from 'lodash.get';
import isEmpty from 'lodash.isempty';
import t from 'translations/translate';

// components
import ContainerWithHeader from 'components/legacy/Layout/ContainerWithHeader';
import { Wrapper } from 'components/legacy/Layout';
import Button from 'components/legacy/Button';
import { TextLink, Label, BaseText } from 'components/legacy/Typography';
import FeeLabelToggle from 'components/FeeLabelToggle';

// configs
import { getPlrAddressForChain, PPN_TOKEN } from 'configs/assetsConfig';

// utils
import { formatAmount, formatFiat } from 'utils/common';
import { fontStyles, spacing } from 'utils/variables';
import {
  getBalance,
  calculateMaxAmount,
  isEnoughBalanceForTransactionFee,
  findAssetByAddress,
  getAssetsAsList,
} from 'utils/assets';
import { makeAmountForm, getAmountFormFields } from 'utils/formHelpers';
import { themedColors } from 'utils/themes';
import { getGasToken, getTxFeeInWei } from 'utils/transactions';
import { getAssetRateInFiat } from 'utils/rates';

// types
import type { NavigationScreenProp } from 'react-navigation';
import type { TopUpFee } from 'models/PaymentNetwork';
import type { AssetByAddress } from 'models/Asset';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { WalletAssetsBalances } from 'models/Balances';
import type { Currency, RatesPerChain } from 'models/Rates';

// constants
import { FUND_CONFIRM } from 'constants/navigationConstants';
import { defaultFiatCurrency, ETH } from 'constants/assetsConstants';
import { CHAIN } from 'constants/chainConstants';

// actions
import { estimateTopUpVirtualAccountAction } from 'actions/smartWalletActions';

// selectors
import { accountEthereumWalletAssetsBalancesSelector } from 'selectors/balances';
import { accountEthereumAssetsSelector } from 'selectors/assets';
import { useGasTokenSelector } from 'selectors/archanova';


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

const FormWrapper = styled.View`
  z-index: 10;
`;

type Props = {
  assets: AssetByAddress,
  navigation: NavigationScreenProp<*>,
  balances: WalletAssetsBalances,
  session: Object,
  estimateTopUpVirtualAccount: () => void,
  topUpFee: TopUpFee,
  ratesPerChain: RatesPerChain,
  baseFiatCurrency: ?Currency,
  useGasToken: boolean,
};

type State = {
  value: ?{
    amount: ?string,
  },
  inputHasError: boolean,
};

const { Form } = tForm.form;
const MIN_TX_AMOUNT = 0.000000000000000001;

class FundTank extends React.Component<Props, State> {
  _form: tForm.form;
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

  handleFormSubmit = () => {
    this.formSubmitted = true;
    const { navigation } = this.props;
    const formValues = this._form.getValue();

    if (!formValues) return;

    Keyboard.dismiss();
    navigation.navigate(FUND_CONFIRM, { amount: formValues.amount });
  };

  useMaxValue = () => {
    const { balances, useGasToken, topUpFee: { feeInfo }, assets } = this.props;
    const txFeeInWei = getTxFeeInWei(useGasToken, feeInfo);

    const plrAddress = getPlrAddressForChain(CHAIN.ETHEREUM);
    const { address } = findAssetByAddress(getAssetsAsList(assets), plrAddress) ?? {};
    const token = PPN_TOKEN;

    const balance = getBalance(balances, address);
    const gasToken = getGasToken(useGasToken, feeInfo);
    const maxAmount = calculateMaxAmount(token, balance, txFeeInWei, gasToken);
    this.setState({
      value: {
        amount: formatAmount(maxAmount),
      },
    }, () => this.checkFormInputErrors);
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
      ratesPerChain,
      baseFiatCurrency,
      useGasToken,
      topUpFee: { feeInfo },
    } = this.props;

    const plrAddress = getPlrAddressForChain(CHAIN.ETHEREUM);
    const { symbol: token, iconUrl, decimals, address } = findAssetByAddress(getAssetsAsList(assets), plrAddress) ?? {};
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;

    const ethereumRates = ratesPerChain[CHAIN.ETHEREUM] ?? {};

    // balance
    const balance = getBalance(balances, address);
    const formattedBalance = formatAmount(balance);

    // balance in fiat
    const totalInFiat = balance * getAssetRateInFiat(ethereumRates, plrAddress, fiatCurrency);
    const formattedBalanceInFiat = formatFiat(totalInFiat, baseFiatCurrency);

    // value
    const currentValue = (!!value && !!parseFloat(value.amount)) ? parseFloat(value.amount) : 0;

    // fee
    const gasToken = getGasToken(useGasToken, feeInfo);
    const txFeeInWei = getTxFeeInWei(useGasToken, feeInfo);
    const balanceCheckTransaction = {
      amount: currentValue,
      decimals,
      symbol: token,
      txFeeInWei,
      gasToken,
    };
    const isEnoughForFee = isEnoughBalanceForTransactionFee(balances, balanceCheckTransaction, CHAIN.ETHEREUM);
    const feeSymbol = get(gasToken, 'symbol', ETH);

    // max amount
    const maxAmount = parseFloat(calculateMaxAmount(token, balance, txFeeInWei, gasToken));

    // value in fiat
    const valueInFiat = currentValue * getAssetRateInFiat(ethereumRates, plrAddress, fiatCurrency);
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
      icon: iconUrl,
      valueInFiatOutput,
      customProps: { inputWrapperStyle: { marginTop: spacing.large } },
    });

    return (
      <ContainerWithHeader
        headerProps={{ centerItems: [{ title: t('ppnContent.title.fundTankScreen') }] }}
        footer={(
          <FooterInner>
            <FeeLabelToggle
              txFeeInWei={txFeeInWei}
              gasToken={gasToken}
              isLoading={!topUpFee.isFetched && balance > 0}
              chain={CHAIN.ETHEREUM}
            />
            {!!value && !!parseFloat(value.amount) && !inputHasError &&
            <Button
              disabled={!session.isOnline || !topUpFee.isFetched}
              small
              block={false}
              flexRight
              title={t('button.next')}
              onPress={this.handleFormSubmit}
            />
            }
          </FooterInner>
        )}
        minAvoidHeight={200}
      >
        <Wrapper regularPadding>
          <FormWrapper>
            <Form
              ref={node => { this._form = node; }}
              type={formStructure}
              options={formFields}
              value={value}
              onChange={this.handleChange}
            />
          </FormWrapper>
          <ActionsWrapper>
            <SendTokenDetails>
              <Label small>{t('ppnContent.label.availableBalance')}</Label>
              <TextRow>
                <SendTokenDetailsValue>
                  {t('tokenValue', { value: formattedBalance, token })}
                </SendTokenDetailsValue>
                <HelperText>{formattedBalanceInFiat}</HelperText>
              </TextRow>
            </SendTokenDetails>
            {topUpFee.isFetched &&
            <TouchableOpacity onPress={this.useMaxValue}>
              <TextLink>{t('button.sendAll')}</TextLink>
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
  rates: { data: ratesPerChain },
  paymentNetwork: { topUpFee },
  appSettings: { data: { baseFiatCurrency } },
}: RootReducerState): $Shape<Props> => ({
  ratesPerChain,
  session,
  topUpFee,
  baseFiatCurrency,
});

const structuredSelector = createStructuredSelector({
  balances: accountEthereumWalletAssetsBalancesSelector,
  assets: accountEthereumAssetsSelector,
  useGasToken: useGasTokenSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  estimateTopUpVirtualAccount: () => dispatch(estimateTopUpVirtualAccountAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(FundTank);
