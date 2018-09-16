// @flow

import * as React from 'react';
import type { NavigationScreenProp } from 'react-navigation';
import t from 'tcomb-form-native';
import styled from 'styled-components/native';

// components
import Header from 'components/Header';
import Button from 'components/Button';
import { ICO_INSTRUCTIONS } from 'constants/navigationConstants';
import { Container, Wrapper, Footer } from 'components/Layout';
import { BaseText, BoldText, Label } from 'components/Typography';
import SingleInput from 'components/TextInput/SingleInput';

// utils
import { baseColors, fontSizes, spacing } from 'utils/variables';

// constants
import { GBP } from 'constants/assetsConstants';

type Props = {
  navigation: NavigationScreenProp<*>,
}

type State = {
  value: ?{
    amountToFund: ?string,
    tokensToReceive: ?string,
  },
  selectedCurrency: string,
};

const { Form } = t.form;

function InputTemplate(locals) {
  const errorMessage = locals.error;
  const { config = {} } = locals;
  const inputProps = {
    autoFocus: true,
    onChange: locals.onChange,
    onBlur: locals.onBlur,
    placeholder: '0',
    value: locals.value,
    ellipsizeMode: 'middle',
    keyboardType: 'decimal-pad',
    textAlign: 'right',
    autoCapitalize: 'words',
  };
  return (
    <SingleInput
      options={config.options}
      label={locals.label}
      onSelect={config.onSelect}
      selectedOption={config.selectedOption}
      errorMessage={errorMessage}
      inputProps={inputProps}
      inlineLabel
    />
  );
}

const currencyOptions = [{
  label: 'BTC',
  value: 'BTC',
}, {
  label: 'ETH',
  value: 'ETH',
}, {
  label: 'GBP',
  value: 'GBP',
}, {
  label: 'EUR',
  value: 'EUR',
}];

const getFormOptions = (options) => {
  const { onSelect, selectedOption } = options;
  return {
    fields: {
      amountToFund: {
        template: InputTemplate,
        label: 'Amount to fund',
        config: {
          options: currencyOptions,
          onSelect,
          selectedOption,
        },
      },
      tokensToReceive: {
        template: InputTemplate,
        label: 'Tokens to receive',
      },
    },
  };
};

const formStructure = t.struct({
  amountToFund: t.String,
  tokensToReceive: t.String,
});

const SummaryRow = styled.View`
  margin: ${spacing.rhythm / 2}px 0;
  flexDirection: row;
  alignItems: flex-start;
  justifyContent: space-between;
`;

const SummaryLabel = styled(Label)`
  text-align:center;
  font-size: ${fontSizes.extraSmall};
`;

const SummaryValue = styled(BoldText)`
  font-size: ${fontSizes.medium};
  padding-right: 2px;
`;

class ParticipateScreen extends React.Component<Props, State> {
  _form: t.form;

  state = {
    value: null,
    selectedCurrency: GBP,
  }

  handleBackNavigation = () => {
    this.props.navigation.goBack(null);
  };

  handleDismiss = () => {
    this.props.navigation.dismiss();
  }

  handleChange = (value: Object) => {
    this.setState({ value });
  };

  handleSubmit = () => {
    this.props.navigation.navigate(ICO_INSTRUCTIONS);
  };

  handleCurrencySelect = (currency: string) => {
    this.setState({
      selectedCurrency: currency,
    });
  }

  render() {
    const { value, selectedCurrency } = this.state;
    const formOptions = getFormOptions({
      onSelect: this.handleCurrencySelect,
      selectedOption: selectedCurrency,
    });
    return (
      <Container color={baseColors.snowWhite}>
        <Header
          onBack={this.handleBackNavigation}
          title="participate"
          onClose={this.handleDismiss}
        />
        <Wrapper flex={1} regularPadding>
          <Form
            ref={node => { this._form = node; }}
            type={formStructure}
            options={formOptions}
            value={value}
            onChange={this.handleChange}

          />
          <SummaryRow>
            <SummaryLabel>AMOUNT IN GBP</SummaryLabel>
            <SummaryValue>0</SummaryValue>
          </SummaryRow>
        </Wrapper>
        <Footer style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
          <BaseText style={{ flex: 2, paddingRight: 20, fontSize: fontSizes.extraExtraSmall }}>
            Your investment is fully secure and compliant to regulators’ orders and UK laws
          </BaseText>
          <Button small title="Next" onPress={this.handleSubmit} />
        </Footer>
      </Container>
    );
  }
}

export default ParticipateScreen;
