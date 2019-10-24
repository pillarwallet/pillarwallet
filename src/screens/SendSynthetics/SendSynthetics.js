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
import { connect } from 'react-redux';
import styled from 'styled-components/native';
import t from 'tcomb-form-native';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import SelectorInput from 'components/SelectorInput';

// utils
import {
  spacing,
  UIColors,
} from 'utils/variables';
import { isValidNumber } from 'utils/common';

import type { Asset } from 'models/Asset';

type Props = {
  supportedAssets: Asset[],
};

type State = {
  formOptions: Object,
  value: Object,
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

const generateFormStructure = () => {
  let amount;

  const FromOption = t.refinement(t.Object, ({ selector, input }) => {
    if (!selector
      || !Object.keys(selector).length
      || !input
      || !isValidNumber(input)) return false;

    const { decimals } = selector;

    amount = parseFloat(input);

    return !(decimals === 0 && amount.toString().indexOf('.') > -1);
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
    } else if (decimals === 0 && amount.toString().indexOf('.') > -1) {
      return 'Amount should not contain decimal places';
    }
    return true;
  };

  return t.struct({
    fromInput: FromOption,
  });
};

const BackgroundWrapper = styled.View`
  background-color: ${UIColors.defaultBackgroundColor};
  flex: 1;
`;

const FormWrapper = styled.View`
  padding: 0 ${spacing.large}px;
  margin-top: ${spacing.large}px;
`;

class SendSynthetics extends React.Component<Props, State> {
  exchangeForm: t.form;
  fromInputRef: TextInput;

  constructor(props: Props) {
    super(props);
    this.state = {
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
  }

  componentDidMount() {
    this.generateSupportedAssetsOptions();
  }

  generateSupportedAssetsOptions = () => {
    const { supportedAssets } = this.props;
    const assets = [...supportedAssets] // prevent mutation of param
      .sort((a, b) => a.symbol.localeCompare(b.symbol))
      .map(({ symbol, iconUrl, ...rest }) => {
        return {
          key: symbol,
          value: symbol,
          icon: iconUrl,
          iconUrl,
          symbol,
          ...rest,
        };
      });
    const thisStateFormOptionsCopy = { ...this.state.formOptions };
    thisStateFormOptionsCopy.fields.fromInput.config.options = assets;
    this.setState({
      formOptions: thisStateFormOptionsCopy,
    });
  };

  handleFormChange = (value: Object) => {
    this.setState({ value });
    this.exchangeForm.getValue();
  };

  render() {
    const {
      value,
      formOptions,
    } = this.state;
    return (
      <ContainerWithHeader
        headerProps={{ centerItems: [{ title: 'Send synthetics (dev)' }] }}
      >
        <BackgroundWrapper>
          <FormWrapper>
            <Form
              ref={node => { this.exchangeForm = node; }}
              type={generateFormStructure()}
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

export default connect(mapStateToProps)(SendSynthetics);
