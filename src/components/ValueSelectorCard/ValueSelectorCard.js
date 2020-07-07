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

import Spinner from 'components/Spinner';

import type { Balances, Rates } from 'models/Asset';
import type { RootReducerState } from 'reducers/rootReducer';
import type { TransactionFeeInfo } from 'models/Transaction';
import type { FormSelector } from 'models/TextInput';
import type { Option } from 'models/Selector';

import { formatAmount, formatFiat } from 'utils/common';
import { spacing } from 'utils/variables';
import { getBalance, getRate, calculateMaxAmount } from 'utils/assets';
import { themedColors } from 'utils/themes';
import { SelectorInputTemplate, selectorStructure, inputFormatter, inputParser } from 'utils/formHelpers';

import { accountBalancesSelector } from 'selectors/balances';
import { visibleActiveAccountAssetsWithBalanceSelector } from 'selectors/assets';
import { activeSyntheticAssetsSelector } from 'selectors/synthetics';

import { defaultFiatCurrency } from 'constants/assetsConstants';


export type ExternalProps = {
  maxLabel?: string,
  preselectedAsset?: string,
  getFormValue: (?FormSelector) => void,
  txFeeInfo?: ?TransactionFeeInfo,
  selectorModalTitle?: string,
  getError?: (errorMessage: ?string) => void,
  wrapperStyle?: Object,
  renderOption?: () => void,
  isLoading?: boolean,
  hideZeroBalanceAssets?: boolean,
};

type Props = ExternalProps & {
  assets: Option[],
  balances: Balances,
  baseFiatCurrency: ?string,
  rates: Rates,
  showSyntheticOptions?: boolean,
  customError?: string,
  syntheticAssets: Option[],
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
              inputWrapperStyle: { width: '100%', paddingTop: 4, paddingBottom: 0 },
              rightLabel: '',
              customInputHeight: 56,
              selectorModalTitle: 'Select',
              inputHeaderStyle: { marginBottom: 16, alignItems: 'center' },
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

  componentDidUpdate(prevProps: Props) {
    const { preselectedAsset, isLoading } = this.props;
    const { value } = this.state;
    const selectedAsset = get(value, 'formSelector.selector.symbol');
    const preselectedAssetChanged = !prevProps.preselectedAsset && preselectedAsset && !selectedAsset;
    const finishedLoading = prevProps.isLoading && !isLoading;
    if (preselectedAssetChanged || finishedLoading) {
      this.addCustomFormInfo();
    }
  }

  addCustomFormInfo = () => {
    const {
      assets,
      syntheticAssets,
      maxLabel,
      preselectedAsset,
      selectorModalTitle,
      renderOption,
      showSyntheticOptions,
    } = this.props;
    const { formOptions, value } = this.state;

    const assetsOptions: Option[] = showSyntheticOptions ? syntheticAssets : assets;

    const thisStateFormOptionsCopy = { ...formOptions };
    thisStateFormOptionsCopy.fields.formSelector.config.options = assetsOptions || [];
    const newValue = { ...value };

    const preselectedOption = preselectedAsset &&
      assetsOptions.find(({ symbol }) => symbol === preselectedAsset);

    const singleOption = assetsOptions?.length === 1 && assetsOptions[0];

    const pickedAsset = preselectedOption || singleOption || {};
    newValue.formSelector.selector = pickedAsset;
    const { symbol } = pickedAsset;
    const label = maxLabel || 'Max';

    const newOptions = t.update(formOptions, {
      fields: {
        formSelector: {
          config: {
            options: { $set: assetsOptions },
            rightLabel: { $set: !isEmpty(pickedAsset) ? label : '' },
            customLabel: { $set: this.renderCustomLabel(symbol) },
            selectorModalTitle: { $set: selectorModalTitle || 'Select' },
            renderOption: { $set: renderOption },
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
    const {
      getFormValue,
      baseFiatCurrency,
      rates,
      maxLabel,
      getError,
    } = this.props;

    const { errorMessage, formOptions } = this.state;
    const formValue = this.form.getValue();
    const validation = this.form.validate();
    const currentErrorMessage = get(validation, 'errors[0].message', '');
    if (getError) getError(currentErrorMessage);

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
    const label = maxLabel || 'Max';

    const newOptions = t.update(formOptions, {
      fields: {
        formSelector: {
          config: {
            inputAddonText: { $set: valueInFiat },
            customLabel: { $set: this.renderCustomLabel(formSelector?.selector?.symbol) },
            rightLabel: { $set: formSelector ? label : '' },
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
      showSyntheticOptions,
      syntheticAssets,

    } = this.props;
    const { value } = this.state;
    const selectedAssetSymbol = symbol || get(value, 'formSelector.selector.symbol');
    if (!selectedAssetSymbol) return {};

    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;

    let selectedAssetBalance;
    let rawSelectedAssetBalance;
    if (showSyntheticOptions) {
      const syntheticAsset = syntheticAssets.find(({ symbol: _symbol }) => _symbol === selectedAssetSymbol);
      rawSelectedAssetBalance = get(syntheticAsset, 'availableBalance', 0);
      selectedAssetBalance = formatAmount(rawSelectedAssetBalance);
    } else {
      rawSelectedAssetBalance = getBalance(balances, selectedAssetSymbol);
      selectedAssetBalance = forSending
        ? calculateMaxAmount(selectedAssetSymbol, rawSelectedAssetBalance, txFeeInfo?.fee, txFeeInfo?.gasToken)
        : formatAmount(rawSelectedAssetBalance);
    }
    const totalInFiat = parseFloat(rawSelectedAssetBalance) * getRate(rates, selectedAssetSymbol, fiatCurrency);
    const amountValueInFiat = formatFiat(totalInFiat, baseFiatCurrency);

    return { selectedAssetBalance, amountValueInFiat, selectedAssetSymbol };
  };

  handleUseMax = () => {
    const { value, formOptions } = this.state;
    const { getFormValue } = this.props;

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
    getFormValue(newValue?.formSelector);
  };

  render() {
    const { value, formOptions, errorMessage } = this.state;
    const {
      balances,
      txFeeInfo,
      wrapperStyle,
      showSyntheticOptions,
      syntheticAssets,
      customError,
      isLoading,
    } = this.props;

    const syntheticBalances = !showSyntheticOptions || !syntheticAssets.length
      ? {}
      : syntheticAssets.reduce((_balances, asset) => {
        const symbol = get(asset, 'symbol', 0);
        const balance = get(asset, 'availableBalance', 0);
        if (!symbol) return _balances;
        _balances[symbol] = { symbol, balance };
        return _balances;
      }, {});
    const balancesForValidation = showSyntheticOptions ? syntheticBalances : balances;
    const formStructure = getFormStructure(balancesForValidation, txFeeInfo);
    const errorToShow = customError || errorMessage;

    return (
      <Wrapper style={wrapperStyle}>
        <ShadowedCard
          wrapperStyle={{ marginBottom: 10, width: '100%' }}
          contentWrapperStyle={{ padding: 20, paddingTop: 16 }}
          borderRadius={10}
        >
          <FormWrapper>
            {isLoading
              ? <Spinner style={{ alignSelf: 'center' }} />
              : (
                <Form
                  ref={node => { this.form = node; }}
                  type={formStructure}
                  options={formOptions}
                  value={value}
                  onChange={this.handleFromChange}
                />
              )
            }
          </FormWrapper>
        </ShadowedCard>
        {!!errorToShow && <ErrorMessage>{errorToShow}</ErrorMessage>}
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
  assets: visibleActiveAccountAssetsWithBalanceSelector,
  syntheticAssets: activeSyntheticAssetsSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default connect(combinedMapStateToProps)(ValueSelectorCard);
