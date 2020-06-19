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
import t from 'tcomb-form-native';
import isEmpty from 'lodash.isempty';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import get from 'lodash.get';

import ShadowedCard from 'components/ShadowedCard';
import { BaseText } from 'components/Typography';

import type { Assets, Balances, Rates } from 'models/Asset';
import type { RootReducerState } from 'reducers/rootReducer';
import type { TransactionFeeInfo } from 'models/Transaction';
import type { FormSelector } from 'models/TextInput';

import { formatAmount, formatFiat } from 'utils/common';
import { spacing } from 'utils/variables';
import { getBalance, getRate, sortAssets, calculateMaxAmount } from 'utils/assets';
import { themedColors } from 'utils/themes';
import { SelectorInputTemplate, selectorStructure, inputFormatter, inputParser } from 'utils/formHelpers';
import { getFormattedBalanceInFiat } from 'screens/Exchange/utils';

import { accountBalancesSelector } from 'selectors/balances';
import { accountAssetsSelector } from 'selectors/assets';
import { defaultFiatCurrency } from 'constants/assetsConstants';


type Props = {
  assets: Assets,
  balances: Balances,
  baseFiatCurrency: ?string,
  maxLabel?: string,
  preselectedAsset?: string,
  rates: Rates,
  getFormValue: (?FormSelector) => void,
  txFeeInfo?: ?TransactionFeeInfo,
};

type FormValue = {
  formSelector: FormSelector,
};

type State = {
  formOptions: Object,
  value: FormValue,
  errorMessage: string,
};

const Wrapper = styled.View`
  width: 100%;
  padding: ${spacing.layoutSides}px;
`;

const FormWrapper = styled.View`
  width: 100%;
`;

const ErrorMessage = styled(BaseText)`
  margin: ${spacing.medium}px 0;
  color: ${themedColors.negative};
  text-align: center;
`;

const { Form } = t.form;

const getFormStructure = (balances: Balances, txFeeInfo: ?TransactionFeeInfo) => {
  return t.struct({
    formSelector: selectorStructure(balances, false, txFeeInfo),
  });
};

export class ValueSelectorCard extends React.Component<Props, State> {
  form: Form;

  constructor(props: Props) {
    super(props);
    this.state = {
      value: {
        formSelector: {
          selector: {},
          input: '',
        },
      },
      formOptions: {
        fields: {
          formSelector: {
            keyboardType: 'decimal-pad',
            template: SelectorInputTemplate,
            config: {
              hasInput: true,
              noErrorText: true,
              options: [],
              placeholderSelector: 'select',
              placeholderInput: '0',
              inputWrapperStyle: { width: '100%' },
              rightLabel: '',
              customInputHeight: 56,
              selectorModalTitle: 'Select',
              inputHeaderStyle: { marginBottom: 16, alignItems: 'center', minHeight: 22 },
              onPressRightLabel: this.handleUseMax,
            },
            transformer: {
              parse: inputParser,
              format: inputFormatter,
            },
          },
        },
      },
      errorMessage: '',
    };
  }

  componentDidMount() {
    this.addCustomFormInfo();
  }

  addCustomFormInfo = () => {
    const {
      assets,
      balances,
      baseFiatCurrency,
      rates,
      maxLabel,
      preselectedAsset,
    } = this.props;
    const { formOptions, value } = this.state;

    const assetsOptions = sortAssets(assets).reduce((options, asset) => {
      const { symbol, iconUrl } = asset;
      const rawBalance = getBalance(balances, symbol);
      const assetBalance = formatAmount(rawBalance);
      if (rawBalance <= 0) return options;
      const formattedBalanceInFiat = getFormattedBalanceInFiat(baseFiatCurrency, assetBalance, rates, symbol);
      const option = {
        key: symbol,
        value: symbol,
        icon: iconUrl,
        ...asset,
        assetBalance,
        formattedBalanceInFiat,
      };
      return [...options, option];
    }, []);

    const thisStateFormOptionsCopy = { ...formOptions };
    thisStateFormOptionsCopy.fields.formSelector.config.options = assetsOptions;

    const newValue = { ...value };

    const preselectedOption = preselectedAsset &&
      assetsOptions.find(({ symbol }) => symbol === preselectedAsset);

    const singleOption = assetsOptions.length === 1 && assetsOptions[0];

    const pickedAsset = preselectedOption || singleOption || {};
    newValue.formSelector.selector = pickedAsset;
    const { symbol } = pickedAsset;

    const newOptions = t.update(formOptions, {
      fields: {
        formSelector: {
          config: {
            options: { $set: assetsOptions },
            rightLabel: { $set: maxLabel || 'Max' },
            customLabel: { $set: this.renderCustomLabel(symbol) },
          },
        },
      },
    });

    this.setState({ formOptions: newOptions, value: newValue });
  };

  renderCustomLabel = (symbol?: string) => {
    const {
      selectedAssetBalance,
      amountValueInFiat,
      selectedAssetSymbol,
    } = this.getMaxBalanceOfSelectedAsset(false, symbol);
    if (!selectedAssetBalance || !symbol) return null;

    return (
      <BaseText regular secondary>{selectedAssetBalance} {selectedAssetSymbol} ({amountValueInFiat})</BaseText>
    );
  };

  handleFromChange = (value: FormValue) => {
    const { getFormValue, baseFiatCurrency, rates } = this.props;
    const { errorMessage, formOptions } = this.state;
    const formValue = this.form.getValue();
    const validation = this.form.validate();
    const currentErrorMessage = get(validation, 'errors[0].message', '');

    const stateUpdates = {};
    stateUpdates.value = value;
    if (errorMessage !== currentErrorMessage) {
      stateUpdates.errorMessage = currentErrorMessage;
    }

    const { formSelector } = value;
    const { selector, input: amount } = formSelector;
    let valueInFiat;

    if (amount && parseFloat(amount) > 0 && !isEmpty(selector)) {
      const { symbol } = selector;
      const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
      const totalInFiat = parseFloat(amount) * getRate(rates, symbol, fiatCurrency);
      valueInFiat = symbol ? formatFiat(totalInFiat, baseFiatCurrency) : null;
    }

    const newOptions = t.update(formOptions, {
      fields: {
        formSelector: {
          config: {
            inputAddonText: { $set: valueInFiat },
            customLabel: { $set: this.renderCustomLabel(formSelector?.selector?.symbol) },
          },
        },
      },
    });

    stateUpdates.formOptions = newOptions;

    this.setState({ ...stateUpdates });
    getFormValue(formValue?.formSelector);
  };

  getMaxBalanceOfSelectedAsset = (forSending: boolean, symbol?: string) => {
    const {
      balances,
      baseFiatCurrency,
      rates,
      txFeeInfo,
    } = this.props;
    const { value } = this.state;
    const selectedAssetSymbol = symbol || get(value, 'formSelector.selector.symbol');
    if (!selectedAssetSymbol) return {};

    const rawSelectedAssetBalance = getBalance(balances, selectedAssetSymbol);
    const selectedAssetBalance = forSending
      ? calculateMaxAmount(selectedAssetSymbol, rawSelectedAssetBalance, txFeeInfo?.fee, txFeeInfo?.gasToken)
      : formatAmount(rawSelectedAssetBalance);
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;

    const totalInFiat = parseFloat(rawSelectedAssetBalance) * getRate(rates, selectedAssetSymbol, fiatCurrency);
    const amountValueInFiat = formatFiat(totalInFiat, baseFiatCurrency);

    return { selectedAssetBalance, amountValueInFiat, selectedAssetSymbol };
  };


  handleUseMax = () => {
    const { value, formOptions } = this.state;
    const { selectedAssetBalance, amountValueInFiat } = this.getMaxBalanceOfSelectedAsset(true);
    if (!selectedAssetBalance) return;
    const newValue = { ...value };
    newValue.formSelector.input = selectedAssetBalance.toString();

    const newOptions = t.update(formOptions, {
      fields: {
        formSelector: {
          config: {
            inputAddonText: { $set: amountValueInFiat },
          },
        },
      },
    });

    this.setState({ value: newValue, formOptions: newOptions });
  };

  render() {
    const { value, formOptions, errorMessage } = this.state;
    const { balances, txFeeInfo } = this.props;
    const formStructure = getFormStructure(balances, txFeeInfo);

    return (
      <Wrapper>
        <ShadowedCard
          wrapperStyle={{ marginBottom: 10, width: '100%' }}
          contentWrapperStyle={{ padding: 20, paddingTop: 16 }}
        >
          <FormWrapper>
            <Form
              ref={node => { this.form = node; }}
              type={formStructure}
              options={formOptions}
              value={value}
              onChange={this.handleFromChange}
            />
          </FormWrapper>
        </ShadowedCard>
        {!!errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
      </Wrapper>
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

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
  assets: accountAssetsSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default connect(combinedMapStateToProps)(ValueSelectorCard);
