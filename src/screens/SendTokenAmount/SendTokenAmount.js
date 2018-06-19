// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import { Text } from 'react-native';
import t from 'tcomb-form-native';
import { utils, providers } from 'ethers';
import { NETWORK_PROVIDER } from 'react-native-dotenv';
import { BigNumber } from 'bignumber.js';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { Container, Wrapper } from 'components/Layout';
import Title from 'components/Title';
import ButtonIcon from 'components/ButtonIcon';
import TextInput from 'components/TextInput';
import { SEND_TOKEN_CONTACTS } from 'constants/navigationConstants';
import { ETH } from 'constants/assetsConstants';
import type { TransactionPayload } from 'models/Transaction';
import type { Assets } from 'models/Asset';
import { parseNumber, formatMoney, formatAmount } from 'utils/common';
import { baseColors, fontSizes } from 'utils/variables';
import SendTokenAmountHeader from './SendTokenAmountHeader';

const provider = providers.getDefaultProvider(NETWORK_PROVIDER);

const { Form } = t.form;
const gasLimit = 21000;

const getFormStructure = (maxAmount: number, enoughForFee) => {
  const Amount = t.refinement(t.Number, (amount): boolean => {
    amount = parseNumber(amount.toString());
    return enoughForFee && amount > 0 && amount <= maxAmount;
  });

  Amount.getValidationErrorMessage = (amount): string => {
    if (amount >= maxAmount) {
      return 'Amount should not exceed the total balance.';
    } else if (!enoughForFee) {
      return 'Not enough eth to process the transaction fee';
    }
    return 'Amount should be specified.';
  };

  return t.struct({
    amount: Amount,
  });
};

function AmountInputTemplate(locals) {
  const { config: { currency, useMaxValue } } = locals;
  const errorMessage = locals.error;
  const inputProps = {
    autoFocus: true,
    onChange: locals.onChange,
    onBlur: locals.onBlur,
    placeholder: '0.00',
    value: locals.value,
    ellipsizeMode: 'middle',
    keyboardType: 'numeric',
    textAlign: 'right',
    style: {
      paddingRight: 40,
      fontSize: 36,
      fontWeight: '700',
      lineHeight: 0,
    },
  };

  return (
    <TextInput
      inputType="amount"
      postfix={currency}
      errorMessage={errorMessage}
      id="amount"
      label={locals.label}
      inputProps={inputProps}
      inlineLabel
      footerAddonText="Use Max"
      footerAddonAction={useMaxValue}
    />
  );
}

const generateFormOptions = (config: Object): Object => ({
  fields: {
    amount: { template: AmountInputTemplate, config },
  },
});

const ActionsWrapper = styled.View`
  display: flex;
  flex-direction: row;
  align-content: center;
`;

type Props = {
  token: string,
  address: string,
  totalBalance: number,
  contractAddress: string,
  navigation: NavigationScreenProp<*>,
  isVisible: boolean,
  formValues?: Object,
  assets: Object,
}

type State = {
  value: ?{
    amount: ?number
  },
  formStructure: t.struct,
  txFeeInWei: ?Object, // BigNumber
}

class SendTokenAmount extends React.Component<Props, State> {
  _form: t.form;
  assetData: Object;
  gasPrice: Object; // BigNumber
  gasPriceFetched: boolean = false;

  constructor(props: Props) {
    super(props);
    this.assetData = this.props.navigation.getParam('assetData', {});
    this.state = {
      value: null,
      formStructure: getFormStructure(this.assetData.balance, false),
      txFeeInWei: null,
    };
  }

  componentDidMount() {
    provider.getGasPrice()
      .then(gasPrice => {
        this.gasPriceFetched = true;
        this.gasPrice = gasPrice;
        const { token, balance } = this.assetData;
        const { assets } = this.props;
        const txFeeInWei = gasPrice.mul(gasLimit);
        const maxAmount = this.calculateMaxAmount(token, balance, txFeeInWei);
        const enoughForFee = this.checkIfEnoughForFee(assets, txFeeInWei);

        this.setState({
          txFeeInWei,
          formStructure: getFormStructure(maxAmount, enoughForFee),
        });
      })
      .catch(() => {});
  }

  handleChange = (value: Object) => {
    this.setState({ value });
  };

  handleFormSubmit = () => {
    const value = this._form.getValue();
    const { txFeeInWei } = this.state;
    const { navigation } = this.props;

    if (!value || !this.gasPriceFetched) return;

    const transactionPayload: TransactionPayload = {
      to: '',
      amount: parseNumber(value.amount),
      gasLimit,
      gasPrice: this.gasPrice.toNumber(),
      symbol: this.assetData.symbol,
      contractAddress: this.assetData.contractAddress,
    };
    navigation.navigate(SEND_TOKEN_CONTACTS, {
      assetData: this.assetData,
      transactionPayload,
      txFeeInEther: utils.formatEther(txFeeInWei.toString()),
    });
  };

  useMaxValue = () => {
    if (!this.gasPriceFetched) return;
    const { txFeeInWei } = this.state;
    const { token, balance } = this.assetData;
    const maxAmount = this.calculateMaxAmount(token, balance, txFeeInWei);

    this.setState({
      value: {
        amount: formatAmount(maxAmount),
      },
    });
  };

  calculateMaxAmount(token: string, balance: number, txFeeInWei: ?Object): number {
    if (token !== ETH) {
      return balance;
    }
    const maxAmount = utils.parseUnits(balance.toString(), 'ether').sub(txFeeInWei);
    if (maxAmount.lt(0)) return 0;
    return new BigNumber(utils.formatEther(maxAmount)).toNumber();
  }

  checkIfEnoughForFee(assets: Assets, txFeeInWei): boolean {
    if (!assets[ETH]) return false;
    const ethBalance = assets[ETH].balance;
    const balanceInWei = utils.parseUnits(ethBalance.toString(), 'ether');
    return balanceInWei.gte(txFeeInWei);
  }

  openFeeInfoModal = () => {
    // Add fee modal logic in here
  };

  render() {
    const {
      value,
      formStructure,
      txFeeInWei,
    } = this.state;
    const { token, balance } = this.assetData;
    const formOptions = generateFormOptions({ currency: token, useMaxValue: this.useMaxValue });
    return (
      <React.Fragment>
        <SendTokenAmountHeader
          onBack={this.props.navigation.goBack}
          nextOnPress={this.handleFormSubmit}
          balanceAmount={formatMoney(balance, 6)}
          symbol={token}
        />
        <Container>
          <Wrapper regularPadding>
            <Title title="send" />
            <Form
              ref={node => { this._form = node; }}
              type={formStructure}
              options={formOptions}
              value={value}
              onChange={this.handleChange}
            />
            <ActionsWrapper>
              <Text style={{ marginTop: 14 }}>
                Fee:
              </Text>
              <Text style={{ fontWeight: 'bold', color: '#000', marginTop: 14 }}>
                {txFeeInWei && ` ${utils.formatEther(txFeeInWei.toString())} ETH`}
              </Text>
              <ButtonIcon
                icon="alert"
                color={baseColors.clearBlue}
                fontSize={fontSizes.large}
                onPress={this.openFeeInfoModal}
              />
            </ActionsWrapper>
          </Wrapper>
        </Container>
      </React.Fragment>
    );
  }
}

const mapStateToProps = ({ assets: { data: assets } }) => ({
  assets,
});

export default connect(mapStateToProps)(SendTokenAmount);
