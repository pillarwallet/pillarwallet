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
import { Keyboard, TouchableOpacity } from 'react-native';
import { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { SDK_PROVIDER } from 'react-native-dotenv';
import styled from 'styled-components/native';
import t from 'tcomb-form-native';
import get from 'lodash.get';
import isEmpty from 'lodash.isempty';
import debounce from 'lodash.debounce';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Button from 'components/Button';
import Spinner from 'components/Spinner';
import { BaseText, Label, TextLink } from 'components/Typography';
import { Wrapper } from 'components/Layout';

// actions
import { initSyntheticsServiceAction } from 'actions/syntheticsActions';

// utils, services
import { fontStyles, spacing } from 'utils/variables';
import { formatAmount, formatFiat, isValidNumber, isValidNumberDecimals, parseNumber } from 'utils/common';
import { getAssetData, getAssetsAsList, getRate } from 'utils/assets';
import syntheticsService from 'services/synthetics';
import { getAmountFormFields } from 'utils/formHelpers';
import { themedColors } from 'utils/themes';

// constants
import { defaultFiatCurrency, PLR } from 'constants/assetsConstants';
import { SEND_SYNTHETIC_CONFIRM, SEND_TOKEN_CONFIRM } from 'constants/navigationConstants';

// selectors
import { accountAssetsSelector } from 'selectors/assets';

// models, types
import type { Asset, Assets, Rates } from 'models/Asset';
import type { SyntheticTransaction, TokenTransactionPayload } from 'models/Transaction';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import { fetchSingleAssetRatesAction } from 'actions/ratesActions';

type Props = {
  accountAssets: Assets,
  supportedAssets: Asset[],
  initSyntheticsService: () => void,
  navigation: NavigationScreenProp<*>,
  rates: Rates,
  baseFiatCurrency: ?string,
  isOnline: boolean,
  fetchSingleAssetRates: (assetCode: string) => void,
};

type State = {
  value: ?{ amount: ?string },
  submitPressed: boolean,
  intentError: ?string,
  inputHasError: boolean,
};

const { Form } = t.form;

const generateFormStructure = (intentError: ?string, maxAmount: number, decimals: number) => {
  const Amount = t.refinement(t.String, (amount): boolean => {
    amount = amount.toString();

    return isValidNumber(amount)
      && isValidNumberDecimals(amount, decimals)
      && !intentError
      && parseFloat(amount) <= maxAmount;
  });

  Amount.getValidationErrorMessage = (amount) => {
    amount = amount.toString();

    if (!isValidNumber(amount)) {
      return 'Incorrect number entered.';
    } else if (parseNumber(amount) > maxAmount) {
      return 'Amount should not exceed the max available';
    } else if (!isValidNumberDecimals(amount, decimals)) {
      return 'Amount should not contain decimal places';
    }

    return intentError;
  };

  return t.struct({
    amount: Amount,
  });
};

const parseNumericAmount = value => parseNumber(get(value, 'amount', 0));

const BackgroundWrapper = styled.View`
  flex: 1;
`;

const FooterInner = styled.View`
  flex-direction: row;
  align-items: flex-end;
  justify-content: flex-end;
  width: 100%;
  padding: ${spacing.large}px;
  background-color: ${themedColors.surface};
`;

const SendTokenDetails = styled.View``;

const SendTokenDetailsValue = styled(BaseText)`
  ${fontStyles.medium};
`;

const ActionsWrapper = styled.View`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

const HelperText = styled(BaseText)`
  ${fontStyles.medium};
  color: ${themedColors.secondaryText};
  margin-left: 4px;
`;

const TextRow = styled.View`
  flex-direction: row;
`;

class SendSyntheticAmount extends React.Component<Props, State> {
  syntheticsForm: t.form;
  receiver: string;
  source: string;
  assetData: Asset;
  assetBalance: number;

  constructor(props: Props) {
    super(props);
    const { navigation: { getParam: getNavigationParam } } = props;
    this.source = getNavigationParam('source', '');
    this.receiver = getNavigationParam('receiver', '');
    this.assetData = getNavigationParam('assetData', {});
    this.assetBalance = get(this.assetData, 'amount', 0);
    const intentError = !this.assetBalance
      ? 'Asset has no available liquidity'
      : null;
    this.state = {
      intentError,
      submitPressed: false,
      value: null,
      inputHasError: false,
    };
    this.handleFormChange = debounce(this.handleFormChange, 500);
  }

  componentDidMount() {
    this.props.initSyntheticsService();
    this.props.fetchSingleAssetRates(this.assetData.symbol);
  }


  checkFormInputErrors = () => {
    if (!this.syntheticsForm) return;
    const { inputHasError } = this.state;
    if (!isEmpty(get(this.syntheticsForm.validate(), 'errors'))) {
      this.setState({ inputHasError: true });
    } else if (inputHasError) {
      this.setState({ inputHasError: false });
    }
  };

  handleFormChange = (value: Object) => {
    const { intentError } = this.state;
    let updatedState = { value };

    // reset intent error on value change
    if (intentError) updatedState = { ...updatedState, intentError: null };
    this.setState(updatedState);

    this.checkFormInputErrors(); // validates form
  };

  formSubmitComplete = (callback?: Function = () => {}) => {
    this.setState({ submitPressed: false }, callback);
  };

  handleFormSubmit = () => {
    const { submitPressed, value } = this.state;
    if (submitPressed) return;
    this.setState({ submitPressed: true, intentError: null }, () => {
      const { navigation } = this.props;
      const amount = parseNumericAmount(value);
      Keyboard.dismiss();
      const { symbol: assetCode, address: contractAddress, decimals } = this.assetData;
      if (assetCode === PLR) {
        // go through regular confirm as PLR is staked by the user already so he owns it
        const transactionPayload: TokenTransactionPayload = {
          to: this.receiver,
          amount,
          gasLimit: 0,
          gasPrice: 0,
          txFeeInWei: 0,
          usePPN: true,
          symbol: assetCode,
          contractAddress,
          decimals,
        };
        this.formSubmitComplete(() => {
          navigation.navigate(SEND_TOKEN_CONFIRM, {
            transactionPayload,
            source: this.source,
          });
        });
        return;
      }
      const { accountAssets, supportedAssets } = this.props;
      const assetsData = getAssetsAsList(accountAssets);
      const assetData = getAssetData(assetsData, supportedAssets, PLR);
      syntheticsService
        .createExchangeIntent(this.receiver, amount, assetCode)
        .then((result) => {
          const { output: { transactionId, exchangeAmount } } = result;
          this.formSubmitComplete(() => {
            const syntheticTransaction: SyntheticTransaction = {
              transactionId,
              fromAmount: exchangeAmount,
              toAmount: amount,
              toAssetCode: assetCode,
              toAddress: this.receiver,
            };
            Keyboard.dismiss();
            navigation.navigate(SEND_SYNTHETIC_CONFIRM, {
              syntheticTransaction,
              assetData,
              source: this.source,
            });
          });
        })
        .catch(() => {
          this.setState({
            submitPressed: false,
            intentError: 'Failed to calculate synthetics exchange',
          });
          this.syntheticsForm.getValue(); // validates form
        });
    });
  };

  useMaxValue = () => {
    const amount = formatAmount(this.assetBalance);
    this.setState({ value: { amount } });
  };

  render() {
    const { rates, baseFiatCurrency, isOnline } = this.props;
    const {
      value,
      submitPressed,
      intentError,
      inputHasError,
    } = this.state;

    // asset data
    const { symbol, decimals, iconUrl } = this.assetData;

    // balance
    const balanceFormatted = formatAmount(this.assetBalance);
    const balanceTitle = `Available ${symbol === PLR ? 'balance' : 'liquidity'}`;

    // value
    const currentAmount = parseNumericAmount(value);
    const showNextButton = !submitPressed && !isEmpty(value);

    // value in fiat
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const valueInFiat = currentAmount * getRate(rates, symbol, fiatCurrency);
    const valueInFiatFormatted = formatFiat(valueInFiat, baseFiatCurrency);
    const totalInFiat = this.assetBalance * getRate(rates, symbol, fiatCurrency);
    const totalInFiatFormatted = formatFiat(totalInFiat, baseFiatCurrency);

    // form
    const icon = `${SDK_PROVIDER}/${iconUrl}?size=3`;
    const formStructure = generateFormStructure(intentError, this.assetBalance, decimals);
    const formFields = getAmountFormFields({
      icon,
      currency: symbol,
      valueInFiatOutput: valueInFiatFormatted,
      customProps: { inputWrapperStyle: { marginTop: spacing.large } },
    });

    // submit button
    const isNextButtonDisabled = inputHasError
      || parseNumericAmount(value) <= 0
      || !isOnline
      || !!intentError;
    const nextButtonTitle = 'Next';

    return (
      <ContainerWithHeader
        headerProps={{ centerItems: [{ title: `Send synthetic ${symbol}` }] }}
        keyboardAvoidFooter={(
          <FooterInner>
            {showNextButton &&
            <Button
              disabled={isNextButtonDisabled}
              small
              flexRight
              title={nextButtonTitle}
              onPress={this.handleFormSubmit}
            />
            }
            {submitPressed && <Spinner width={20} height={20} />}
          </FooterInner>
        )}
        minAvoidHeight={200}
      >
        <BackgroundWrapper>
          <Wrapper regularPadding>
            <Form
              ref={node => { this.syntheticsForm = node; }}
              type={formStructure}
              options={formFields}
              value={value}
              onChange={this.handleFormChange}
            />
            <ActionsWrapper>
              <SendTokenDetails>
                <Label small>{balanceTitle}</Label>
                <TextRow>
                  <SendTokenDetailsValue>
                    {balanceFormatted} {symbol}
                  </SendTokenDetailsValue>
                  <HelperText>{totalInFiatFormatted}</HelperText>
                </TextRow>
              </SendTokenDetails>
              <TouchableOpacity onPress={this.useMaxValue}>
                <TextLink>Send All</TextLink>
              </TouchableOpacity>
            </ActionsWrapper>
          </Wrapper>
        </BackgroundWrapper>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  assets: { supportedAssets },
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency } },
  session: { data: { isOnline } },
}: RootReducerState): $Shape<Props> => ({
  supportedAssets,
  rates,
  baseFiatCurrency,
  isOnline,
});

const structuredSelector = createStructuredSelector({
  accountAssets: accountAssetsSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  initSyntheticsService: () => dispatch(initSyntheticsServiceAction()),
  fetchSingleAssetRates: (assetCode: string) => dispatch(fetchSingleAssetRatesAction(assetCode)),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(SendSyntheticAmount);
