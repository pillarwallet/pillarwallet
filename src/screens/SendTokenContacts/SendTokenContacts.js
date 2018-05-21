// @flow
import * as React from 'react';
import { Keyboard } from 'react-native';
import { connect } from 'react-redux';
import t from 'tcomb-form-native';
import { Container, Wrapper } from 'components/Layout';
import type { NavigationScreenProp } from 'react-navigation';
import QRCodeScanner from 'components/QRCodeScanner';
import { isValidETHAddress } from 'utils/validators';
import type { TransactionPayload } from 'models/Transaction';
import { sendAssetAction } from 'actions/assetsActions';
import { pipe, decodeETHAddress } from 'utils/common';
import SendTokenContactsHeader from './SendTokenContactsHeader';


// make Dynamic once more tokens supported
const ETHValidator = (address: string): Function => pipe(decodeETHAddress, isValidETHAddress)(address);

type Props = {
  token: string,
  address: string,
  totalBalance: number,
  contractAddress: string,
  navigation: NavigationScreenProp<*>,
  isVisible: boolean,
  sendAsset: Function,
  formValues?: Object,
}

type State = {
  isScanning: boolean,
  transactionPayload: Object,
  asset: Object,
  value: ?{
    address: ?string,
    amount: ?number
  },
}


const getFormStructure = (totalBalance) => {
  const Amount = t.refinement(t.Number, (amount): boolean => {
    return amount > 0 && amount <= totalBalance;
  });

  Amount.getValidationErrorMessage = (amount): string => {
    if (amount > totalBalance) {
      return 'Amount should not exceed the total balance.';
    }
    return 'Amount should be specified.';
  };

  return t.struct({
    amount: Amount,
  });
};

class SendTokenAmount extends React.Component<Props, State> {
  _form: t.form;

  constructor(props) {
    super(props);
    const transactionPayload = this.props.navigation.getParam('transactionPayload', {});
    const asset = this.props.navigation.getParam('asset', {});
    this.state = {
      isScanning: false,
      value: null,
      transactionPayload,
      asset,
    };
  }

  static getDerivedStateFromProps(nextProps) {
    if (nextProps.totalBalance) {
      return {
        formStructure: getFormStructure(nextProps),
      };
    }
    return null;
  }

  handleChange = (value: Object) => {
    this.setState({ value });
  };

  handleFormSubmit = () => {
    const value = this._form.getValue();
    const {
      sendAsset,
      token,
      contractAddress,
    } = this.props;

    if (!value) return;

    const transactionPayload: TransactionPayload = {
      to: value.address,
      amount: value.amount,
      gasLimit: 1500000,
      gasPrice: 20000000000,
      symbol: token,
      contractAddress,
    };
    sendAsset(transactionPayload);
    this.setState({
      value: null,
    });
  };

  handleToggleQRScanningState = () => {
    this.setState({
      isScanning: !this.state.isScanning,
    }, () => {
      if (this.state.isScanning) {
        Keyboard.dismiss();
      }
    });
  };

  handleQRRead = (address: string) => {
    this.setState({ value: { ...this.state.value, address }, isScanning: false });
  };

  render() {
    const {
      isScanning,
      transactionPayload,
      asset,
    } = this.state;

    const qrScannnerComponent = (
      <QRCodeScanner
        validator={ETHValidator}
        dataFormatter={decodeETHAddress}
        isActive={isScanning}
        onDismiss={this.handleToggleQRScanningState}
        onRead={this.handleQRRead}
      />
    );
    return (
      <React.Fragment>
        <SendTokenContactsHeader
          onBack={this.props.navigation.goBack}
          nextOnPress={this.handleFormSubmit}
          amount={transactionPayload.amount}
          symbol={asset.symbol}
        />
        <Container>
          <Wrapper padding />
        </Container>
        {qrScannnerComponent}
      </React.Fragment>
    );
  }
}

const mapDispatchToProps = (dispatch) => ({
  sendAsset: (transaction: TransactionPayload) => dispatch(sendAssetAction(transaction)),
});

export default connect(null, mapDispatchToProps)(SendTokenAmount);
