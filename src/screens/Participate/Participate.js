// @flow
import * as React from 'react';
import { StyleSheet, Platform, Keyboard } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import t from 'tcomb-form-native';
import styled from 'styled-components/native';

// components
import { Switch } from 'native-base';
import Header from 'components/Header';
import Button from 'components/Button';
import { ICO_INSTRUCTIONS } from 'constants/navigationConstants';
import { Container, Wrapper, ScrollWrapper, Footer } from 'components/Layout';
import { BaseText } from 'components/Typography';
import SingleInput from 'components/TextInput/SingleInput';
import Icon from 'components/Icon';
import ListItemUnderlined from 'screens/Participate/ListItemUnderlined';

// utils
import { baseColors, fontSizes, spacing } from 'utils/variables';
import { parseNumber, formatAmount, formatMoney } from 'utils/common';

// actions
import { fetchICOFundingInstructionsAction } from 'actions/icosActions';

// constants
import { GBP, ETH } from 'constants/assetsConstants';

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
      optionsTitle={config.optionsTitle || ''}
      optionsSelector={config.optionsSelector}
      label={locals.label}
      onSelect={config.onSelect}
      selectedOption={config.selectedOption}
      errorMessage={errorMessage}
      inputProps={inputProps}
      inlineLabel
      fontSize={fontSizes.large}
    />
  );
}

const getCurrencyIcon = (currencyOpt: string) => {
  switch (currencyOpt) {
    case 'GBP': return 'pound';
    case 'ETH': return 'ethereum';
    case 'BTC': return 'bitcoin';
    case 'LTC': return 'litecoin';
    default: return currencyOpt;
  }
};

const amountOptionsSelector = (selectedOption) => {
  return (
    <React.Fragment>
      {!!selectedOption &&
      <Icon
        name={getCurrencyIcon(selectedOption)}
        style={{
          fontSize: fontSizes.extraLarge,
          color: baseColors.manatee,
          marginRight: 6,
        }}
      />}
      <BaseText>{selectedOption}</BaseText>
    </React.Fragment>
  );
};

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
          optionsTitle: 'Choose currency',
          optionsSelector: amountOptionsSelector,
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

const getFormStructure = (maxContribution, minContribution) => {
  const Fund = t.refinement(t.String, (amount): boolean => {
    return !!amount && amount <= maxContribution && amount >= minContribution;
  });

  Fund.getValidationErrorMessage = (amount): string => {
    if (amount > maxContribution) {
      return 'Amount should not exceed the maximum contribution.';
    }

    if (amount < minContribution) {
      return 'Amount should not be less than the minimum contribution.';
    }

    return 'Amount should be specified.';
  };

  return t.struct({
    [TO_FUND]: Fund,
    [TO_RECEIVE]: t.String,
  });
};

const FooterInner = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-end;
  width: 100%;
`;

const LegalText = styled(BaseText)`
  flex: 1;
  font-size: ${fontSizes.extraExtraSmall}px;
  padding-right: 28px;
`;

const SwitchWrapper = styled.View`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 20px ${spacing.rhythm}px;
  background-color: #ffffff;
  border-bottom-color: ${baseColors.lightGray};
  border-top-color: ${baseColors.lightGray};
  border-bottom-width: ${StyleSheet.hairlineWidth};
  border-top-width: ${StyleSheet.hairlineWidth};
  margin-top: 30px;
  flex: 1;
`;

const ItemLabelHolder = styled.View`
  display: flex;
  flex: 1;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-right: ${Platform.select({
    ios: '10px',
    android: '8px',
  })};
`;

const ItemLabel = styled(BaseText)`
  font-size: ${fontSizes.small};
  padding-right: 10px;
  flex: 1;
  color: ${baseColors.slateBlack};
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
  };

  handleToFundChange = (fieldValue: string) => {
    let { icoData: { unitPrice } } = this.state;
    const { selectedCurrency } = this.state;
    const { rates } = this.props;
    // TEMPORARY HERE
    if (selectedCurrency !== GBP) {
      unitPrice /= rates[selectedCurrency][GBP]; // GBP is base atm for all ICOs
    }
    const fundAmount = fieldValue || '0';
    const toReceiveValue = formatAmount(parseNumber(fundAmount) / unitPrice);
    const value = {
      [TO_FUND]: fieldValue,
      [TO_RECEIVE]: toReceiveValue,
    };
    this.setState({ value });
  };

  handleToReceiveChange = (fieldValue: string) => {
    let { icoData: { unitPrice } } = this.state;
    const { selectedCurrency } = this.state;
    const { rates } = this.props;
    if (selectedCurrency !== GBP) {
      unitPrice /= rates[selectedCurrency][GBP]; // GBP is base atm for all ICOs
    }
    const receiveAmount = fieldValue || '0';
    const toFundValue = formatAmount(parseNumber(receiveAmount) * unitPrice);
    const value = {
      [TO_FUND]: toFundValue,
      [TO_RECEIVE]: fieldValue,
    };
    this.setState({ value });
  };

  handleSubmit = () => {
    const formValues = this._form.getValue();
    if (!formValues) return;
    Keyboard.dismiss();
    this.props.navigation.navigate(ICO_INSTRUCTIONS, {
      ...formValues,
    });
  };

  // @TODO: add recalc on currency switch depending on the focused field
  handleCurrencySelect = (currency: string) => {
    const { fetchICOFundingInstructions } = this.props;
    this.setState({
      selectedCurrency: currency,
    }, () => {
      fetchICOFundingInstructions(currency);
    });
  };

  getAmountInGBP = () => {
    const { rates } = this.props;
    const { value, selectedCurrency } = this.state;
    if (!value) return 0;
    const val = rates[selectedCurrency][GBP] * parseNumber(value[TO_FUND]);
    return formatAmount(Math.round(val));
  };

  render() {
    const { value, selectedCurrency, icoData } = this.state;
    const formOptions = getFormOptions({
      onSelect: this.handleCurrencySelect,
      selectedOption: selectedCurrency,
      currencyOptions: this.currencyOptions,
      handleToReceiveChange: this.handleToReceiveChange,
      handleToFundChange: this.handleToFundChange,
    });
    const formStructure = getFormStructure(icoData.maximumContribution, icoData.minimumContribution);
    return (
      <Container>
        <Header
          onBack={this.handleBackNavigation}
          title="participate"
          onClose={this.handleDismiss}
        />
        <ScrollWrapper style={{ flex: 1 }}>
          <Wrapper flex={1} regularPadding>
            <Form
              ref={node => { this._form = node; }}
              type={formStructure}
              options={formOptions}
              value={value}
            />
            {selectedCurrency !== GBP && (
              <ListItemUnderlined
                label="AMOUNT IN GBP"
                value={`£${formatMoney(this.getAmountInGBP(), 0, 3, ',', '.', false)}`}
              />
            )}
          </Wrapper>
          {selectedCurrency === ETH &&
          <SwitchWrapper>
            <ItemLabelHolder>
              <ItemLabel>
                Fund ETH directly from Pillar Wallet
              </ItemLabel>
              <Switch
                onValueChange={() => {}}
                value
              />
            </ItemLabelHolder>
          </SwitchWrapper>
          }
        </ScrollWrapper>
        <Footer style={{ backgroundColor: baseColors.snowWhite }}>
          <FooterInner>
            <LegalText>
              Your investment is fully secure and compliant to regulators’ orders and UK laws
            </LegalText>
            <Button small title="Next" onPress={this.handleSubmit} />
          </FooterInner>
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
