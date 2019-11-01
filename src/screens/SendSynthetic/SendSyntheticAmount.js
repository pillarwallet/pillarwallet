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
import { TextInput } from 'react-native';
import { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import styled from 'styled-components/native';
import t from 'tcomb-form-native';
import get from 'lodash.get';
import isEmpty from 'lodash.isempty';
import debounce from 'lodash.debounce';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import SelectorInput from 'components/SelectorInput';
import Button from 'components/Button';
import Spinner from 'components/Spinner';

// actions
import { initSyntheticsServiceAction } from 'actions/syntheticsActions';

// utils, services
import { spacing, UIColors } from 'utils/variables';
import { isValidNumber } from 'utils/common';
import { getAssetData, getAssetsAsList } from 'utils/assets';
import syntheticsService from 'services/synthetics';

// constants
import { ETH, PLR } from 'constants/assetsConstants';
import { SEND_SYNTHETIC_CONFIRM } from 'constants/navigationConstants';

// selectors
import { accountAssetsSelector } from 'selectors/assets';

// models
import type { Asset, Assets } from 'models/Asset';
import type { SyntheticTransaction } from 'models/Transaction';

type Props = {
  accountAssets: Assets,
  supportedAssets: Asset[],
  initSyntheticsService: Function,
  navigation: NavigationScreenProp<*>,
};

type State = {
  formOptions: Object,
  value: Object,
  submitPressed: boolean,
  intentError: ?string,
};

const { Form } = t.form;

function SelectorInputTemplate(locals) {
  const {
    config: {
      label,
      hasInput,
      wrapperStyle,
      placeholderSelector,
      placeholderInput,
      options,
      inputAddonText,
      inputRef,
      onSelectorOpen,
    },
  } = locals;
  const errorMessage = locals.error;
  const inputProps = {
    onChange: locals.onChange,
    onBlur: locals.onBlur,
    keyboardType: locals.keyboardType,
    autoCapitalize: locals.autoCapitalize,
    maxLength: 42,
    label,
    placeholderSelector,
    placeholder: placeholderInput,
    onSelectorOpen,
  };

  return (
    <SelectorInput
      inputProps={inputProps}
      options={options}
      optionsTitle="Assets"
      errorMessage={errorMessage}
      hasInput={hasInput}
      wrapperStyle={wrapperStyle}
      value={locals.value}
      inputAddonText={inputAddonText}
      inputRef={inputRef}
    />
  );
}

const generateFormStructure = (intentError: ?string) => {
  let amount;

  const FromOption = t.refinement(t.Object, ({ selector, input }) => {
    if (!selector
      || !Object.keys(selector).length
      || !input
      || !isValidNumber(input)
      || !!intentError) return false;

    const { decimals } = selector;
    amount = parseFloat(input);

    return decimals !== 0 || !amount.toString().includes('.');
  });

  FromOption.getValidationErrorMessage = ({ selector, input }) => {
    const { decimals } = selector;

    if (!isValidNumber(input.toString())) {
      return 'Incorrect number entered.';
    }

    if (!Object.keys(selector).length) {
      return 'Asset should be selected.';
    } else if (!input) {
      return false; // should still validate (to not trigger search if empty), yet error should not be visible to user
    } else if (parseFloat(input) < 0) {
      return 'Amount should be bigger than 0.';
    } else if (decimals === 0 && amount.toString().includes('.')) {
      return 'Amount should not contain decimal places';
    }
    return intentError || true;
  };

  return t.struct({
    fromInput: FromOption,
  });
};

const parseNumericAmount = value => Number(get(value, 'fromInput.input', 0));

const BackgroundWrapper = styled.View`
  background-color: ${UIColors.defaultBackgroundColor};
  flex: 1;
`;

const FormWrapper = styled.View`
  padding: 0 ${spacing.large}px;
  margin-top: ${spacing.large}px;
`;

const FooterInner = styled.View`
  flex-direction: row;
  align-items: flex-end;
  justify-content: flex-end;
  width: 100%;
  padding: ${spacing.large}px;
  background-color: ${UIColors.defaultBackgroundColor};
`;

class SendSyntheticAsset extends React.Component<Props, State> {
  syntheticsForm: t.form;
  fromInputRef: TextInput;
  receiver: string;

  constructor(props: Props) {
    super(props);
    this.receiver = props.navigation.getParam('receiver', '');
    this.state = {
      intentError: null,
      submitPressed: false,
      value: {
        fromInput: {
          selector: {},
          input: '',
        },
      },
      formOptions: {
        fields: {
          fromInput: {
            keyboardType: 'decimal-pad',
            autoCapitalize: 'words',
            template: SelectorInputTemplate,
            config: {
              label: 'Synthetic asset to send',
              hasInput: true,
              options: [],
              horizontalOptions: [],
              placeholderSelector: 'select',
              placeholderInput: '0',
              inputRef: (ref) => { this.fromInputRef = ref; },
            },
            transformer: {
              parse: (value) => {
                let formattedAmount = value.input;
                if (value.input) formattedAmount = value.input.toString().replace(/,/g, '.');
                return { ...value, input: formattedAmount };
              },
              format: (value) => {
                let formattedAmount = value.input;
                if (value.input) formattedAmount = value.input.toString().replace(/,/g, '.');
                return { ...value, input: formattedAmount };
              },
            },
          },
        },
      },
    };
    this.handleFormChange = debounce(this.handleFormChange, 500);
  }

  componentDidMount() {
    this.generateSupportedAssetsOptions();
    this.props.initSyntheticsService();
  }

  generateSupportedAssetsOptions = () => {
    const { supportedAssets } = this.props;
    const assets = [...supportedAssets] // prevent mutation of param
      .sort((a, b) => a.symbol.localeCompare(b.symbol))
      .map(({ symbol, iconUrl, ...rest }) => ({
        key: symbol,
        value: symbol,
        icon: iconUrl,
        iconUrl,
        symbol,
        ...rest,
      }));
    const initialFormState = {
      ...this.state.value,
      fromInput: {
        selector: assets.find(({ symbol }) => symbol === ETH) || {},
        input: '',
      },
    };
    const thisStateFormOptionsCopy = { ...this.state.formOptions };
    thisStateFormOptionsCopy.fields.fromInput.config.options = assets;
    this.setState({ formOptions: thisStateFormOptionsCopy, value: initialFormState });
  };

  handleFormChange = (value: Object) => {
    const { intentError } = this.state;
    let updatedState = { value };
    if (intentError) updatedState = { ...updatedState, intentError: null };
    this.setState(updatedState);
    if (this.syntheticsForm) this.syntheticsForm.getValue(); // validates form
  };

  handleFormSubmit = () => {
    const { submitPressed, value } = this.state;
    if (submitPressed) return;
    this.setState({ submitPressed: true, intentError: null }, () => {
      const validation = this.syntheticsForm.validate();
      const { errors = [] } = validation;
      const assetCode = get(value, 'fromInput.selector.symbol');
      if (errors.length || !assetCode) {
        this.setState({ submitPressed: false });
        return;
      }
      const amount = parseNumericAmount(value);
      const { navigation, accountAssets, supportedAssets } = this.props;
      const assetsData = getAssetsAsList(accountAssets);
      const assetData = getAssetData(assetsData, supportedAssets, PLR);
      syntheticsService
        .createExchangeIntent(this.receiver, amount, assetCode)
        .then((result) => {
          const { output: { transactionId, exchangeAmount } } = result;
          this.setState({ submitPressed: false }, () => {
            const syntheticTransaction: SyntheticTransaction = {
              transactionId,
              fromAmount: exchangeAmount,
              toAmount: amount,
              toAssetCode: assetCode,
              toAddress: this.receiver,
            };
            navigation.navigate(SEND_SYNTHETIC_CONFIRM, {
              syntheticTransaction,
              assetData,
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

  render() {
    const {
      value,
      formOptions,
      submitPressed,
      intentError,
    } = this.state;
    const inputValue = get(value, 'fromInput.input');
    const showNextButton = !submitPressed && !isEmpty(inputValue);
    const isNextButtonDisabled = parseNumericAmount(value) <= 0;
    const nextButtonTitle = 'Next';
    return (
      <ContainerWithHeader
        headerProps={{ centerItems: [{ title: 'Send synthetic asset' }] }}
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
          <FormWrapper>
            <Form
              ref={node => { this.syntheticsForm = node; }}
              type={generateFormStructure(intentError)}
              options={formOptions}
              value={value}
              onChange={this.handleFormChange}
            />
          </FormWrapper>
        </BackgroundWrapper>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  assets: { supportedAssets },
}) => ({
  supportedAssets,
});

const structuredSelector = createStructuredSelector({
  accountAssets: accountAssetsSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Function) => ({
  initSyntheticsService: () => dispatch(initSyntheticsServiceAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(SendSyntheticAsset);
