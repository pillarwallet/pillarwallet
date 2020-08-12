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
import { ScrollView, Keyboard } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import styled, { withTheme } from 'styled-components/native';
import { connect } from 'react-redux';
import { SDK_PROVIDER } from 'react-native-dotenv';
import t from 'tcomb-form-native';
import { createSelector, createStructuredSelector } from 'reselect';
import get from 'lodash.get';
import uniq from 'lodash.uniq';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Button from 'components/Button';

// actions
import { loadSendwyreRatesAction, loadSendwyreCountrySupportAction } from 'actions/fiatToCryptoActions';
import { loadSupportedAssetsAction } from 'actions/assetsActions';

// constants
import { ETH, USD } from 'constants/assetsConstants';
import { SENDWYRE_SUPPORT } from 'constants/fiatToCryptoConstants';

// utils, services
import { spacing } from 'utils/variables';
import { SelectorInputTemplate, inputFormatter, inputParser } from 'utils/formHelpers';
import { getSendwyreCurrencyPairs, wyreInputFormStructure } from 'utils/fiatToCrypto';

// selectors
import { supportedAssetsSelector } from 'selectors/selectors';

// models, types
import type { Assets, Asset } from 'models/Asset';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Theme } from 'models/Theme';
import type { FormSelector } from 'models/TextInput';
import type { Option } from 'models/Selector';
import type { SendwyreTrxValues } from 'models/FiatToCryptoProviders';

type Props = {
  navigation: NavigationScreenProp<*>,
  assets: Assets,
  loadAssets: () => void,
  currencyPairs: [string, string][],
  loadCurrencyPairs: () => void,
  countrySupport: $Values<typeof SENDWYRE_SUPPORT>,
  loadCountrySupport: () => void,
  theme: Theme,
};

export type FormValue = {
  source: FormSelector,
  dest: FormSelector,
};

type State = {
  value: FormValue,
  formOptions: Object,
  isHandlingSubmit: boolean,
};

type Ref<T> = {
  current: null | T,
};

const FormWrapper = styled.View`
  padding: ${spacing.large}px ${spacing.layoutSides}px;
`;

const ButtonWrapper = styled.View`
  margin-top: ${spacing.large}px;
  padding: ${spacing.layoutSides}px;
`;

const { Form } = t.form;

class SendwyreInputScreen extends React.Component<Props, State> {
  formRef: Ref<t.form>;

  constructor(props: Props) {
    super(props);

    this.formRef = React.createRef();

    const defaultSource = USD;
    const defaultDest = ETH;

    this.state = {
      value: this.constructFormValue(defaultSource, defaultDest),
      formOptions: {
        fields: {
          source: {
            keyboardType: 'decimal-pad',
            template: SelectorInputTemplate,
            config: {
              label: 'Sell',
              options: [],
              hasInput: true,
              placeholderSelector: 'select',
              placeholderInput: '0',
            },
            transformer: { parse: inputParser, format: inputFormatter },
          },

          dest: {
            template: SelectorInputTemplate,
            config: {
              label: 'Buy',
              options: [],
              placeholderSelector: 'Select asset',
            },
          },
        },
      },
      isHandlingSubmit: false,
    };
  }

  componentDidMount() {
    this.props.loadAssets();
    this.props.loadCurrencyPairs();
    this.props.loadCountrySupport();
    this.provideOptions();
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    const { assets, currencyPairs } = this.props;

    const [prevSourceAssetSymbol, prevDestAssetSymbol] = this.getCurrencyPair(prevState);
    const [sourceAssetSymbol, destAssetSymbol] = this.getCurrencyPair(this.state);

    if (
      assets !== prevProps.assets ||
      currencyPairs !== prevProps.currencyPairs ||
      sourceAssetSymbol !== prevSourceAssetSymbol ||
      destAssetSymbol !== prevDestAssetSymbol
    ) {
      this.provideOptions();
    }
  }

  provideOptions = () => {
    const { currencyPairs } = this.props;

    const sourceSymbols = uniq(currencyPairs.map(([source]) => source));
    const destSymbols = uniq(currencyPairs.map(([, dest]) => dest));

    const assetsOptionsSource = this.generateAssetsOptions(sourceSymbols);
    const assetsOptionsDest = this.generateAssetsOptions(destSymbols);

    this.setState({
      formOptions: t.update(this.state.formOptions, {
        fields: {
          source: { config: { options: { $set: assetsOptionsSource } } },
          dest: { config: { options: { $set: assetsOptionsDest } } },
        },
      }),
    });
  };

  constructFormValue = (source: string, dest: string, sourceAmount?: number): FormValue => ({
    source: {
      selector: this.generateAssetOption(source),
      input: (sourceAmount ?? '').toString(),
    },
    dest: {
      selector: this.generateAssetOption(dest),
      input: '',
    },
  });

  generateAssetsOptions = (symbols: string[]): Option[] => symbols.map(this.generateAssetOption);

  generateAssetOption = (symbol: string): Option => {
    const { assets } = this.props;
    const { name = symbol, iconUrl } = assets[symbol] ?? {
      iconUrl: `asset/images/fiat/ic_52_${symbol}.png`,
    };

    const iconPrefix = iconUrl ? `${SDK_PROVIDER}/${iconUrl}` : null;

    return {
      symbol,
      value: symbol,
      name,
      imageUrl: iconPrefix ? `${iconPrefix}?size=3` : undefined,
      iconUrl,
    };
  }

  onFormChange = (value: FormValue) => {
    this.setState({ value });
  }

  onSubmit = async () => {
    this.setState({ isHandlingSubmit: true });

    const onSubmitCallback: (values: SendwyreTrxValues) => void =
      this.props.navigation.getParam('onSubmit', () => {});

    const [sourceCurrency, destCurrency] = this.getCurrencyPair(this.state);

    await onSubmitCallback({
      sourceCurrency,
      destCurrency,
      amount: get(this.state, 'value.source.input'),
    });

    this.setState({ isHandlingSubmit: false });
  }

  getCurrencyPair = (state: State): [string, string] => {
    return [
      get(state, 'value.source.selector.symbol'),
      get(state, 'value.dest.selector.symbol'),
    ];
  }

  isCurrencyPairSupported = ([sourceSymbol, destSymbol]: [string, string]) => {
    const { currencyPairs } = this.props;
    return currencyPairs &&
      currencyPairs.some(([source, dest]) => source === sourceSymbol && dest === destSymbol);
  }

  render() {
    const { value, formOptions, isHandlingSubmit } = this.state;
    const { countrySupport } = this.props;

    const isValid = this.formRef.current &&
      this.formRef.current.validate().isValid() &&
      this.isCurrencyPairSupported(this.getCurrencyPair(this.state));

    const isLoading = countrySupport === SENDWYRE_SUPPORT.LOADING || isHandlingSubmit;
    const isButtonDisabled = !isValid || countrySupport !== SENDWYRE_SUPPORT.SUPPORTED;
    const buttonTitle = countrySupport === SENDWYRE_SUPPORT.UNSUPPORTED
      ? 'Not available in Your country'
      : 'Next';

    return (
      <ContainerWithHeader
        headerProps={{ centerItems: [{ title: 'Buy with Wyre' }] }}
        inset={{ bottom: 'never' }}
      >
        <ScrollView
          onScroll={() => Keyboard.dismiss()}
          keyboardShouldPersistTaps="handled"
          disableOnAndroid
        >
          <FormWrapper>
            <Form
              ref={this.formRef}
              type={wyreInputFormStructure}
              options={formOptions}
              value={value}
              onChange={this.onFormChange}
            />
          </FormWrapper>
          <ButtonWrapper>
            <Button
              regularText
              block
              isLoading={isLoading}
              disabled={isButtonDisabled}
              title={buttonTitle}
              onPress={this.onSubmit}
            />
          </ButtonWrapper>
        </ScrollView>
      </ContainerWithHeader>
    );
  }
}

const directMapStateToProps = ({
  fiatToCrypto: { sendwyreCountrySupport },
}: RootReducerState) => ({
  countrySupport: sendwyreCountrySupport,
});

const assetMapSelector = createSelector(
  supportedAssetsSelector,
  (supportedAssets: Asset[]) =>
    Object.fromEntries(supportedAssets.map(asset => [asset.symbol, asset])),
);

const sendwyreExchangeRatesSelector =
  ({ fiatToCrypto: { sendwyreExchangeRates } }: RootReducerState) => sendwyreExchangeRates;

const currencyPairsSelector = createSelector(
  sendwyreExchangeRatesSelector,
  exchangeRates => getSendwyreCurrencyPairs(exchangeRates ?? {}),
);

const structuredSelector = createStructuredSelector({
  assets: assetMapSelector,
  currencyPairs: currencyPairsSelector,
});

const mapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...directMapStateToProps(state),
  ...structuredSelector(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  loadAssets: () => dispatch(loadSupportedAssetsAction()),
  loadCurrencyPairs: () => dispatch(loadSendwyreRatesAction()),
  loadCountrySupport: () => dispatch(loadSendwyreCountrySupportAction()),
});

export default withTheme(connect(mapStateToProps, mapDispatchToProps)(SendwyreInputScreen));
