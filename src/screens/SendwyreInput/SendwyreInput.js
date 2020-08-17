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
import { createStructuredSelector } from 'reselect';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Button from 'components/Button';
import TextInput from 'components/TextInput';

// actions
import { loadSendwyreRatesAction, loadSendwyreCountrySupportAction } from 'actions/fiatToCryptoActions';
import { loadSupportedAssetsAction } from 'actions/assetsActions';

// constants
import { SENDWYRE_SUPPORT } from 'constants/fiatToCryptoConstants';

// utils
import { spacing } from 'utils/variables';
import { isValidNumber } from 'utils/common';

// selectors
import {
  currencyPairsSelector,
  sourceOptionsSelector,
  destOptionsSelector,
  defaultSourceSelector,
  defaultDestSelector,
} from 'selectors/fiatToCrypto';

// models, types
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Theme } from 'models/Theme';
import type { Option } from 'models/Selector';
import type { SendwyreTrxValues } from 'models/FiatToCryptoProviders';

type Props = {
  navigation: NavigationScreenProp<*>,
  loadAssets: () => void,
  currencyPairs: [string, string][],
  loadCurrencyPairs: () => void,
  sourceOptions: Option[],
  destOptions: Option[],
  defaultSource: null | Option,
  defaultDest: null | Option,
  countrySupport: $Values<typeof SENDWYRE_SUPPORT>,
  loadCountrySupport: () => void,
  theme: Theme,
};

type State = {
  sourceCurrency: null | Option,
  sourceAmount: string,
  destCurrency: null | Option,
  isHandlingSubmit: boolean,
};

const FormWrapper = styled.View`
  padding: ${spacing.large}px ${spacing.layoutSides}px;
`;

const ButtonWrapper = styled.View`
  margin-top: ${spacing.large}px;
  padding: ${spacing.layoutSides}px;
`;

class SendwyreInputScreen extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      sourceCurrency: props.defaultSource,
      sourceAmount: '',
      destCurrency: props.defaultDest,
      isHandlingSubmit: false,
    };
  }

  componentDidMount() {
    this.props.loadAssets();
    this.props.loadCurrencyPairs();
    this.props.loadCountrySupport();
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    this.tryFillDefaultCurrencies(prevState);
  }

  onSourceChange = (value: { selector: Option, input: string }) => {
    this.setState({
      sourceCurrency: value.selector,
      sourceAmount: value.input,
    });
  }

  onDestChange = (value: { selector: Option }) => {
    this.setState({ destCurrency: value.selector });
  }

  onSubmit = async () => {
    this.setState({ isHandlingSubmit: true });

    const onSubmitCallback: (values: SendwyreTrxValues) => void =
      this.props.navigation.getParam('onSubmit', () => {});

    const [sourceCurrency, destCurrency] = this.getCurrencyPair();

    if (sourceCurrency && destCurrency && this.validateForm()) {
      await onSubmitCallback({
        sourceCurrency,
        destCurrency,
        amount: this.state.sourceAmount,
      });
    }

    this.setState({ isHandlingSubmit: false });
  }

  tryFillDefaultCurrencies = (prevState: State) => {
    const { defaultSource, defaultDest } = this.props;
    if (prevState.sourceCurrency === null && defaultSource !== null) {
      this.setState({ sourceCurrency: defaultSource });
    }

    if (prevState.destCurrency === null && defaultDest !== null) {
      this.setState({ destCurrency: defaultDest });
    }
  }

  getCurrencyPair = (): [?string, ?string] => {
    const { sourceCurrency, destCurrency } = this.state;
    return [sourceCurrency?.symbol, destCurrency?.symbol];
  }

  isCurrencyPairSupported = ([sourceSymbol, destSymbol]: [?string, ?string]) => {
    const { currencyPairs } = this.props;
    return currencyPairs &&
      currencyPairs.some(([source, dest]) => source === sourceSymbol && dest === destSymbol);
  }

  validateForm() {
    const { sourceCurrency, sourceAmount, destCurrency } = this.state;
    return sourceCurrency !== null &&
      destCurrency !== null &&
      isValidNumber(sourceAmount) &&
      parseFloat(sourceAmount) > 0 &&
      this.isCurrencyPairSupported(this.getCurrencyPair());
  }

  getSelectorValues = () => {
    const { sourceCurrency, sourceAmount, destCurrency } = this.state;

    return {
      source: {
        selector: sourceCurrency ?? {},
        input: sourceAmount,
      },
      dest: {
        selector: destCurrency ?? {},
      },
    };
  }

  renderForm() {
    const { sourceOptions, destOptions } = this.props;
    const { source, dest } = this.getSelectorValues();

    return (
      <FormWrapper>
        <TextInput
          inputProps={{
            onChange: this.onSourceChange,
            selectorValue: source,
            label: 'Sell',
            maxLength: 42,
            placeholder: '0',
            keyboardType: 'numeric',
          }}
          numeric
          selectorOptions={{
            options: sourceOptions,
            fullWidth: false,
            selectorModalTitle: 'Sell',
          }}
        />

        <TextInput
          inputProps={{
            onChange: this.onDestChange,
            selectorValue: dest,
            label: 'Buy',
          }}
          selectorOptions={{
            options: destOptions,
            fullWidth: true,
            selectorModalTitle: 'Buy',
          }}
        />
      </FormWrapper>
    );
  }

  render() {
    const { isHandlingSubmit } = this.state;
    const { countrySupport } = this.props;


    const isLoading = countrySupport === SENDWYRE_SUPPORT.LOADING || isHandlingSubmit;
    const isButtonDisabled = !this.validateForm() || countrySupport !== SENDWYRE_SUPPORT.SUPPORTED;
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
          {this.renderForm()}
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

const structuredSelector = createStructuredSelector({
  currencyPairs: currencyPairsSelector,
  sourceOptions: sourceOptionsSelector,
  destOptions: destOptionsSelector,
  defaultSource: defaultSourceSelector,
  defaultDest: defaultDestSelector,
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
