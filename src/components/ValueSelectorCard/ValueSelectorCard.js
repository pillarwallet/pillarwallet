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
import tForm from 'tcomb-form-native';
import isEmpty from 'lodash.isempty';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import get from 'lodash.get';
import { getEnv } from 'configs/envConfig';
import t from 'translations/translate';

import ShadowedCard from 'components/ShadowedCard';
import { BaseText } from 'components/Typography';
import Spinner from 'components/Spinner';
import PercentsInputAccessoryHolder, {
  INPUT_ACCESSORY_NATIVE_ID,
} from 'components/PercentsInputAccessory/PercentsInputAccessoryHolder';

import type { Balances, Rates } from 'models/Asset';
import type { RootReducerState } from 'reducers/rootReducer';
import type { TransactionFeeInfo } from 'models/Transaction';
import type { FormSelector } from 'models/TextInput';
import type { Option } from 'models/Selector';

import { formatAmount, formatFiat } from 'utils/common';
import { spacing } from 'utils/variables';
import { getBalance, getRate, calculateMaxAmount, getFormattedBalanceInFiat } from 'utils/assets';
import { themedColors } from 'utils/themes';
import {
  SelectorInputTemplate,
  selectorStructure,
  inputFormatter,
  inputParser,
  ItemSelectorTemplate,
} from 'utils/formHelpers';

import { accountBalancesSelector } from 'selectors/balances';
import { visibleActiveAccountAssetsWithBalanceSelector } from 'selectors/assets';
import { activeSyntheticAssetsSelector } from 'selectors/synthetics';
import { activeAccountMappedCollectiblesSelector } from 'selectors/collectibles';

import { COLLECTIBLES, TOKENS, defaultFiatCurrency } from 'constants/assetsConstants';


export type ExternalProps = {
  maxLabel?: string,
  preselectedAsset?: string,
  preselectedCollectible?: string,
  preselectedValue?: number,
  getFormValue: (?FormSelector) => void,
  txFeeInfo?: ?TransactionFeeInfo,
  selectorModalTitle?: string,
  getError?: (errorMessage: ?string) => void,
  wrapperStyle?: Object,
  renderOption?: () => void,
  isLoading?: boolean,
  customOptions?: Object[],
  customBalances?: Balances,
  activeTokenType?: string,
  showAllAssetTypes?: boolean,
  calculateBalancePercentTxFee?: (symbol: string, percentageModifier: number) => Promise<void>,
};

type Props = ExternalProps & {
  assets?: Option[],
  collectibles?: Option[],
  balances: Balances,
  baseFiatCurrency: ?string,
  rates: Rates,
  showSyntheticOptions?: boolean,
  customError?: string,
  syntheticAssets?: Option[],
  gettingFee?: boolean,
  hideMaxSend?: boolean,
};

type FormValue = {
  formSelector: FormSelector,
};

type State = {
  formOptions: Object,
  value: FormValue,
  errorMessage: string,
  tokenType: string,
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

const { Form } = tForm.form;

const getFormStructure = (balances: Balances, txFeeInfo: ?TransactionFeeInfo) => {
  return tForm.struct({
    formSelector: selectorStructure(balances, false, txFeeInfo),
  });
};

const formatOptions = (options: Object[], balances: Balances, rates: Rates, baseFiatCurrency: ?string) => {
  if (!options) return [];
  return options.map((option) => {
    const { iconUrl, symbol, address } = option;
    const assetBalance = getBalance(balances, symbol);
    const formattedBalanceInFiat = getFormattedBalanceInFiat(baseFiatCurrency, assetBalance, rates, symbol);
    const imageUrl = iconUrl ? `${getEnv().SDK_PROVIDER}/${iconUrl}?size=3` : '';
    return {
      imageUrl,
      formattedBalanceInFiat,
      balance: !!formattedBalanceInFiat && {
        balance: assetBalance,
        value: formattedBalanceInFiat,
        token: symbol,
      },
      token: symbol,
      value: symbol,
      contractAddress: address,
      ...option,
    };
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
          dontCheckBalance: false,
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
              selectorModalTitle: t('title.select'),
              inputHeaderStyle: { marginBottom: 16, alignItems: 'center' },
              onPressRightLabel: () => this.handleUsePercent(100),
              activeTabOnItemClick: COLLECTIBLES,
              activeTabOnOptionOpenClick: TOKENS,
            },
            transformer: {
              parse: inputParser,
              format: inputFormatter,
            },
            onFocus: this.showPercentAccessory,
            onBlur: this.hidePercentAccessory,
          },
        },
      },
      errorMessage: '',
      tokenType: TOKENS,
    };
  }

  componentDidMount() {
    this.handleCustomInfo(true);
  }

  componentDidUpdate(prevProps: Props) {
    const {
      preselectedAsset,
      preselectedCollectible,
      isLoading,
      gettingFee,
      hideMaxSend,
    } = this.props;
    const { value } = this.state;
    const selectedAsset = get(value, 'formSelector.selector.symbol');
    const preselectedAssetChanged = !selectedAsset && ((!prevProps.preselectedAsset && preselectedAsset)
      || (!prevProps.preselectedCollectible && preselectedCollectible));
    const finishedLoading = prevProps.isLoading && !isLoading;
    if (preselectedAssetChanged
      || finishedLoading
      || prevProps.gettingFee !== gettingFee
      || prevProps.hideMaxSend !== hideMaxSend) {
      this.handleCustomInfo();
    }
  }

  handleCustomInfo = (isInitial?: boolean) => {
    const { value } = this.state;
    const { activeTokenType, preselectedCollectible } = this.props;
    const selectedTokenType = preselectedCollectible || activeTokenType === COLLECTIBLES
      ? COLLECTIBLES
      : TOKENS;
    this.manageFormType(selectedTokenType, value, () => this.addCustomFormInfo(isInitial));
  };

  addCustomFormInfo = (isInitial?: boolean) => {
    const {
      assets,
      syntheticAssets,
      maxLabel,
      selectorModalTitle,
      renderOption,
      showSyntheticOptions,
      customOptions,
      balances,
      rates,
      baseFiatCurrency,
      showAllAssetTypes,
      collectibles = [],
      preselectedAsset,
      preselectedCollectible,
      preselectedValue,
      hideMaxSend,
      gettingFee,
      getFormValue,
    } = this.props;
    const { formOptions, value } = this.state;

    const customOptionsFormatted = customOptions && formatOptions(customOptions, balances, rates, baseFiatCurrency);
    const assetsAsOptions = showSyntheticOptions ? syntheticAssets : assets;

    const basicOptions: Option[] = customOptionsFormatted || assetsAsOptions || [];

    let options = [];
    let optionTabs;
    if (showAllAssetTypes) {
      optionTabs = [
        { name: t('label.tokens'), options: basicOptions, id: TOKENS },
        { name: t('label.collectibles'), options: collectibles, id: COLLECTIBLES },
      ];
    } else {
      options = basicOptions;
    }

    const newValue = { ...value };

    const allOptions = optionTabs
      ? optionTabs.reduce((combinedOptions, tab) => {
        const tabOptions = tab.options || [];
        return [...combinedOptions, ...tabOptions];
      }, [])
      : options;

    let preselectedOption;
    if (preselectedAsset) {
      preselectedOption = allOptions.find(({ symbol }) => symbol === preselectedAsset);
    } else if (preselectedCollectible) {
      preselectedOption = allOptions.find(({ tokenId }) => tokenId === preselectedCollectible);
    }

    const singleOption = allOptions.length === 1 && allOptions[0];
    const pickedAsset = preselectedOption || singleOption || {};

    newValue.formSelector.selector = pickedAsset;
    if (preselectedValue) {
      newValue.formSelector.input = preselectedValue.toString();
    }

    const { symbol } = pickedAsset;
    const label = maxLabel || t('button.max');

    const newOptions = tForm.update(formOptions, {
      fields: {
        formSelector: {
          config: {
            options: { $set: options },
            optionTabs: { $set: optionTabs },
            rightLabel: { $set: !isEmpty(pickedAsset) && !hideMaxSend ? label : '' },
            customLabel: { $set: this.renderCustomLabel(symbol) },
            optionsOpenText: { $set: t('button.sendTokenInstead') },
            selectorModalTitle: { $set: selectorModalTitle || t('title.select') },
            renderOption: { $set: renderOption },
            customRightLabel: { $set: gettingFee ? <Spinner width={20} height={20} /> : null },
            inputAccessoryViewID: { $set: !isEmpty(pickedAsset) && !hideMaxSend ? INPUT_ACCESSORY_NATIVE_ID : null },
          },
        },
      },
    });

    this.setState({ formOptions: newOptions, value: newValue });
    if (!isEmpty(pickedAsset)) {
      this.showPercentAccessory();
    }

    /**
     * initially if there's no asset data from navigation we add option manually in code above,
     * that's why we want it to trigger the getFormValue prop as well
     */
    if (getFormValue && isInitial) {
      getFormValue(newValue.formSelector);
    }
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

  onFromChange = (value: FormValue) => {
    const { formSelector } = value;
    const { selector } = formSelector;
    const selectedTokenType = selector.tokenType || TOKENS;

    this.manageFormType(selectedTokenType, value, this.handleFormChange);
  };

  manageFormType = (newTokenType: string, value: FormValue, callback: (value: FormValue) => void) => {
    const { tokenType, formOptions } = this.state;

    if (newTokenType !== tokenType) {
      const updatedValue = { ...value };
      let newOptions = tForm.update(formOptions, {
        fields: {
          formSelector: {
            template: { $set: SelectorInputTemplate },
            config: {
              label: { $set: '' },
            },
          },
        },
      });

      if (newTokenType === COLLECTIBLES) {
        updatedValue.formSelector.input = '1';
        updatedValue.formSelector.dontCheckBalance = true;
        newOptions = tForm.update(formOptions, {
          fields: {
            formSelector: {
              template: { $set: ItemSelectorTemplate },
              config: {
                label: { $set: t('label.collectible') },
              },
            },
          },
        });
      } else {
        updatedValue.formSelector.input = '0';
        updatedValue.formSelector.dontCheckBalance = false;
      }
      this.setState({
        formOptions: newOptions,
        tokenType: newTokenType,
        value: updatedValue,
      }, () => callback(updatedValue));
    } else {
      callback(value);
    }
  };

  handleFormChange = (value: FormValue) => {
    const {
      getFormValue,
      baseFiatCurrency,
      rates,
      maxLabel,
      getError,
      hideMaxSend,
      gettingFee,
    } = this.props;

    const { formSelector } = value;
    const { selector, input: amount } = formSelector;

    const { errorMessage, formOptions } = this.state;

    const validation = this.form.validate();
    const currentErrorMessage = get(validation, 'errors[0].message', '');
    if (getError) getError(currentErrorMessage);

    const stateUpdates = {};
    stateUpdates.value = value;
    if (errorMessage !== currentErrorMessage) {
      stateUpdates.errorMessage = currentErrorMessage;
    }

    let valueInFiat;

    if (amount && parseFloat(amount) > 0 && !isEmpty(selector)) {
      const { symbol } = selector;
      const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
      const totalInFiat = parseFloat(amount) * getRate(rates, symbol, fiatCurrency);
      valueInFiat = symbol ? formatFiat(totalInFiat, baseFiatCurrency) : null;
    }
    const label = maxLabel || t('button.max');

    const newOptions = tForm.update(formOptions, {
      fields: {
        formSelector: {
          config: {
            inputAddonText: { $set: valueInFiat },
            customLabel: { $set: this.renderCustomLabel(formSelector?.selector?.symbol) },
            inputAccessoryViewID: { $set: formSelector && !hideMaxSend ? INPUT_ACCESSORY_NATIVE_ID : null },
            rightLabel: { $set: formSelector && !hideMaxSend ? label : '' },
            customRightLabel: { $set: gettingFee ? <Spinner width={20} height={20} /> : null },
          },
        },
      },
    });

    stateUpdates.formOptions = newOptions;
    this.setState({ ...stateUpdates });
    if (isEmpty(currentErrorMessage)) {
      getFormValue(value?.formSelector);
    }
    if (formSelector) {
      this.showPercentAccessory();
    }
  };

  getMaxBalanceOfSelectedAsset = (forSending: boolean, symbol?: string) => {
    const {
      balances,
      baseFiatCurrency,
      rates,
      txFeeInfo,
      showSyntheticOptions,
      syntheticAssets = [],
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
    } else {
      rawSelectedAssetBalance = getBalance(balances, selectedAssetSymbol);
      if (forSending) {
        selectedAssetBalance = formatAmount(calculateMaxAmount(
          selectedAssetSymbol,
          rawSelectedAssetBalance,
          txFeeInfo?.fee,
          txFeeInfo?.gasToken,
        ));
      }
    }
    if (!selectedAssetBalance) selectedAssetBalance = formatAmount(rawSelectedAssetBalance);
    const totalInFiat = parseFloat(rawSelectedAssetBalance) * getRate(rates, selectedAssetSymbol, fiatCurrency);
    const amountValueInFiat = formatFiat(totalInFiat, baseFiatCurrency);

    return { selectedAssetBalance, amountValueInFiat, selectedAssetSymbol };
  };

  handleUsePercent = async (percent: number) => {
    const { value, formOptions } = this.state;
    const { getFormValue, calculateBalancePercentTxFee } = this.props;
    const selectedAssetSymbol = get(value, 'formSelector.selector.symbol');
    const balancePercentageModifier = (percent / 100);

    // calculate fee for max balance so it can be applied to calculation below
    if (calculateBalancePercentTxFee) {
      await calculateBalancePercentTxFee(selectedAssetSymbol, balancePercentageModifier);
    }

    const { selectedAssetBalance, amountValueInFiat } = this.getMaxBalanceOfSelectedAsset(true);
    if (!selectedAssetBalance) return;

    const newValue = { ...value };
    newValue.formSelector.input = formatAmount(parseFloat(selectedAssetBalance) * balancePercentageModifier);

    const newOptions = tForm.update(formOptions, {
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
  }

  showPercentAccessory = () => {
    const { hideMaxSend } = this.props;
    if (!hideMaxSend) {
      PercentsInputAccessoryHolder.addAccessory(this.handleUsePercent);
    }
  }

  hidePercentAccessory = () => {
    PercentsInputAccessoryHolder.removeAccessory();
  }

  render() {
    const { value, formOptions, errorMessage } = this.state;
    const {
      balances,
      txFeeInfo,
      wrapperStyle,
      showSyntheticOptions,
      syntheticAssets = [],
      customError,
      isLoading,
      customBalances,
    } = this.props;

    const syntheticBalances = !showSyntheticOptions || !syntheticAssets.length
      ? {}
      : syntheticAssets.reduce((synthBalances, asset) => {
        const symbol = get(asset, 'symbol', 0);
        const balance = get(asset, 'availableBalance', 0);
        if (!symbol) return synthBalances;
        synthBalances[symbol] = { symbol, balance };
        return synthBalances;
      }, {});
    const assetBalances = showSyntheticOptions ? syntheticBalances : balances;
    const balancesForValidation = customBalances || assetBalances;
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
                  onChange={this.onFromChange}
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
  collectibles: activeAccountMappedCollectiblesSelector,
  syntheticAssets: activeSyntheticAssetsSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default connect(combinedMapStateToProps)(ValueSelectorCard);
