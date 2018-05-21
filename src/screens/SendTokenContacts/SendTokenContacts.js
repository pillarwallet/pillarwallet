// @flow
import * as React from 'react';
import { Keyboard } from 'react-native';
import { connect } from 'react-redux';
import t from 'tcomb-form-native';
import { Container, Wrapper } from 'components/Layout';
import TextInput from 'components/TextInput';
import SlideModal from 'components/Modals/SlideModal';
import type { NavigationScreenProp } from 'react-navigation';
import QRCodeScanner from 'components/QRCodeScanner';
import { isValidETHAddress } from 'utils/validators';
import type { TransactionPayload } from 'models/Transaction';
import { sendAssetAction } from 'actions/assetsActions';
import { pipe, decodeETHAddress } from 'utils/common';
import SendTokenContactsHeader from './SendTokenContactsHeader';


// make Dynamic once more tokens supported
const ETHValidator = (address: string): Function => pipe(decodeETHAddress, isValidETHAddress)(address);
const { Form } = t.form;

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
  showConfirmModal: boolean,
  value: ?{
    address: ?string,
    amount: ?number
  },
  formStructure: t.struct,
}

function AddressInputTemplate(locals) {
  const { config: { onIconPress } } = locals;
  const errorMessage = locals.error;
  const inputProps = {
    onChange: locals.onChange,
    onBlur: locals.onBlur,
    placeholder: 'Ethereum Address',
    value: locals.value,
    keyboardType: locals.keyboardType,
    textAlign: 'right',
    maxLength: 42,
    style: {
      paddingRight: 40,
      fontSize: 12,
    },
  };
  return (
    <TextInput
      errorMessage={errorMessage}
      id="address"
      label={locals.label}
      icon="ios-qr-scanner"
      onIconPress={onIconPress}
      inputProps={inputProps}
    />
  );
}

const getFormStructure = () => {
  const Address = t.refinement(t.String, (address): boolean => {
    return address.length && isValidETHAddress(address);
  });

  Address.getValidationErrorMessage = (address): string => {
    if (!isValidETHAddress(address)) {
      return 'Invalid Ethereum Address.';
    }
    return 'Address must be provided.';
  };

  return t.struct({
    address: Address,
  });
};

const generateFormOptions = (config: Object): Object => ({
  fields: {
    address: { template: AddressInputTemplate, config, label: 'To' },
  },
  order: ['address'],
});

class SendTokenAmount extends React.Component<Props, State> {
  _form: t.form;

  constructor(props) {
    super(props);
    const transactionPayload = this.props.navigation.getParam('transactionPayload', {});
    const asset = this.props.navigation.getParam('asset', {});
    this.state = {
      isScanning: false,
      value: null,
      showConfirmModal: false,
      formStructure: getFormStructure(),
      transactionPayload,
      asset,

    };
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
      navigation,
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
    navigation.popToTop();
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
      formStructure,
      showConfirmModal,
    } = this.state;

    const formOptions = generateFormOptions({ onIconPress: this.handleToggleQRScanningState, currency: asset.symbol });

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
          <Wrapper padding>
            <Form
              ref={node => { this._form = node; }}
              type={formStructure}
              options={formOptions}
              onChange={this.handleChange}
            />
          </Wrapper>
        </Container>
        {qrScannnerComponent}
        <SlideModal
          isVisible={showConfirmModal}
          title="confirm"
        />
      </React.Fragment>
    );
  }
}

const mapDispatchToProps = (dispatch) => ({
  sendAsset: (transaction: TransactionPayload) => dispatch(sendAssetAction(transaction)),
});

export default connect(null, mapDispatchToProps)(SendTokenAmount);
