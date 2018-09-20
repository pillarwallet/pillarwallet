// @flow

import * as React from 'react';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
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
import { parseNumber, formatAmount } from 'utils/common';

// actions
import { fetchICOFundingInstructionsAction } from 'actions/icosActions';

// constants
import { GBP } from 'constants/assetsConstants';

const { Form } = t.form;
const TO_FUND = 'amountToFund';
const TO_RECEIVE = 'tokensToReceive';

type Props = {
  navigation: NavigationScreenProp<*>,
  fetchICOFundingInstructions: Function,
  rates: Object,
}

type State = {
  value: ?{
    amountToFund: string,
    tokensToReceive: string,
  },
  selectedCurrency: string,
  icoData: Object,
};


function InputTemplate(locals) {
  const errorMessage = locals.error;
  const { config = {} } = locals;
  const inputProps = {
    autoFocus: true,
    onChange: config.onChange,
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

const getFormOptions = (options) => {
  const {
    onSelect,
    selectedOption,
    currencyOptions,
    handleToReceiveChange,
    handleToFundChange,
  } = options;
  return {
    fields: {
      [TO_FUND]: {
        template: InputTemplate,
        label: 'Amount to fund',
        config: {
          options: currencyOptions,
          onSelect,
          selectedOption,
          onChange: handleToFundChange,
        },
      },
      [TO_RECEIVE]: {
        template: InputTemplate,
        label: 'Tokens to receive',
        config: {
          onChange: handleToReceiveChange,
        },
      },
    },
  };
};

const formStructure = t.struct({
  [TO_FUND]: t.String,
  [TO_RECEIVE]: t.String,
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
  currencyOptions: Object[];

  _form: t.form;

  constructor(props: Props) {
    super(props);
    const { icoData } = props.navigation.state.params;
    this.state = {
      value: null,
      selectedCurrency: GBP,
      icoData,
    };
    this.currencyOptions = icoData.supportedCurrencies
      .split(',')
      .map((currency) => ({ label: currency, value: currency }));
  }

  componentDidMount() {
    const { fetchICOFundingInstructions } = this.props;
    const { selectedCurrency } = this.state;
    fetchICOFundingInstructions(selectedCurrency);
  }

  handleBackNavigation = () => {
    this.props.navigation.goBack(null);
  };

  handleDismiss = () => {
    this.props.navigation.dismiss();
  }

  handleToFundChange = (fieldValue: string) => {
    fieldValue = fieldValue || '0';
    let { icoData: { unitPrice } } = this.state;
    const { selectedCurrency } = this.state;
    const { rates } = this.props;
    // TEMPORARY HERE
    if (selectedCurrency !== GBP) {
      unitPrice /= rates[selectedCurrency][GBP]; // GBP is base atm for all ICOs
    }
    const toReceiveValue = formatAmount(parseNumber(fieldValue) / unitPrice);
    const value = {
      [TO_FUND]: fieldValue,
      [TO_RECEIVE]: toReceiveValue,
    };
    this.setState({ value });
  }

  handleToReceiveChange = (fieldValue: string) => {
    fieldValue = fieldValue || '0';
    let { icoData: { unitPrice } } = this.state;
    const { selectedCurrency } = this.state;
    const { rates } = this.props;
    if (selectedCurrency !== GBP) {
      unitPrice /= rates[selectedCurrency][GBP]; // GBP is base atm for all ICOs
    }
    const toFundValue = formatAmount(parseNumber(fieldValue) * unitPrice);
    const value = {
      [TO_FUND]: toFundValue,
      [TO_RECEIVE]: fieldValue,
    };
    this.setState({ value });
  }

  handleSubmit = () => {
    this.props.navigation.navigate(ICO_INSTRUCTIONS);
  };


  // @TODO: add recalc on currency switch depending on the focused field
  handleCurrencySelect = (currency: string) => {
    const { fetchICOFundingInstructions } = this.props;
    this.setState({
      selectedCurrency: currency,
    }, () => {
      fetchICOFundingInstructions(currency);
    });
  }

  getAmountInGBP = () => {
    const { rates } = this.props;
    const { value, selectedCurrency } = this.state;
    if (!value) return 0;
    const val = rates[selectedCurrency][GBP] * parseNumber(value[TO_FUND]);
    return formatAmount(Math.round(val));
  };

  render() {
    const { value, selectedCurrency } = this.state;
    const formOptions = getFormOptions({
      onSelect: this.handleCurrencySelect,
      selectedOption: selectedCurrency,
      currencyOptions: this.currencyOptions,
      handleToReceiveChange: this.handleToReceiveChange,
      handleToFundChange: this.handleToFundChange,
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
          />
          {selectedCurrency !== GBP && (
            <SummaryRow>
              <SummaryLabel>AMOUNT IN GBP</SummaryLabel>
              <SummaryValue>{this.getAmountInGBP()}</SummaryValue>
            </SummaryRow>
          )}
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

const mapDispatchToProps = (dispatch) => ({
  fetchICOFundingInstructions: (currency: string) =>
    dispatch(fetchICOFundingInstructionsAction(currency)),
});

const mapStateToProps = ({ rates: { data: rates } }) => ({
  rates,
});

export default connect(mapStateToProps, mapDispatchToProps)(ParticipateScreen);
