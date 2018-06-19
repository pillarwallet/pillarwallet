// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { Keyboard } from 'react-native';
import { connect } from 'react-redux';
import { ASSET } from 'constants/navigationConstants';
import t from 'tcomb-form-native';
import { utils } from 'ethers';
import { fontWeights, fontSizes, baseColors, UIColors } from 'utils/variables';
import { Container, Wrapper } from 'components/Layout';
import { Paragraph } from 'components/Typography';
import Title from 'components/Title';
import Button from 'components/Button';
import TextInput from 'components/TextInput';
import SlideModal from 'components/Modals/SlideModal';
import type { NavigationScreenProp } from 'react-navigation';
import QRCodeScanner from 'components/QRCodeScanner';
import { isValidETHAddress } from 'utils/validators';
import type { TransactionPayload } from 'models/Transaction';
import { sendAssetAction } from 'actions/assetsActions';
import { pipe, decodeETHAddress } from 'utils/common';
import SendTokenContactsHeader from './SendTokenContactsHeader';

type Props = {
  navigation: NavigationScreenProp<*>,
  sendAsset: Function,
}

type State = {
  isScanning: boolean,
  transactionPayload: Object,
  assetData: Object,
  showConfirmModal: boolean,
  value: {
    address: string,
  },
  formStructure: t.struct,
}

// make Dynamic once more tokens supported
const ETHValidator = (address: string): Function => pipe(decodeETHAddress, isValidETHAddress)(address);
const { Form } = t.form;

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
});

const ConfirmationModal = styled(SlideModal)`
  align-items: flex-start;
`;

const ModalItemWrapper = styled.View`
  justify-content: flex-start;
  align-items: flex-start;
  flex: 1;
`;

const ModalItem = styled.View`
  height: ${props => props.large ? '60px' : '30px'};
  margin-bottom: 10px;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  border-bottom-width: ${props => props.noBorder ? '0' : '1px'};
  border-color: ${UIColors.defaultBorderColor};
`;

const ModalLabel = styled(Paragraph)`
  flex: 0 0 60px;
  font-weight: ${fontWeights.bold};
  color: ${baseColors.mediumGray};
`;

const ModalValue = styled(Paragraph)`
  flex: 1;
  text-align: right;
  flex-wrap: wrap;
  font-size: ${props => props.large ? fontSizes.large : fontSizes.medium};
  font-weight: ${props => props.large ? fontWeights.bold : fontWeights.book};
  color: ${props => props.large ? baseColors.black : baseColors.darkGray};
`;

const ModalAddressValue = styled(Paragraph)`
  flex: 1;
  text-align: left;
  flex-wrap: wrap;
  font-size: ${fontSizes.small};
  font-weight: ${fontWeights.book};
  color: ${baseColors.darkGray};
`;

const ModalValueSymbol = styled.Text`
  font-size: ${fontSizes.small};
  font-weight: ${fontWeights.bold};
`;

const ModalParagraph = styled(Paragraph)`
  margin-bottom: 20px;
`;

const ModalFooter = styled.View`
  flex: 2;
  margin-bottom: 40;
  justify-content: flex-end;
`;

class SendTokenContacts extends React.Component<Props, State> {
  _form: t.form;

  constructor(props) {
    super(props);
    const transactionPayload = this.props.navigation.getParam('transactionPayload', {});
    const assetData = this.props.navigation.getParam('assetData', {});
    this.state = {
      isScanning: false,
      value: { address: '' },
      showConfirmModal: false,
      formStructure: getFormStructure(),
      transactionPayload,
      assetData,
    };
  }

  handleChange = (value: Object) => {
    this.setState({ value });
  };

  openConfirmationModal = () => {
    const value = this._form.getValue();
    const { assetData } = this.state;
    const { transactionPayload } = this.state;

    if (!value) return;

    const transactionPayloadWithAddress: TransactionPayload = {
      to: value.address,
      amount: transactionPayload.amount,
      gasLimit: transactionPayload.gasLimit,
      gasPrice: transactionPayload.gasPrice,
      symbol: assetData.token,
      contractAddress: assetData.contractAddress,
      txFeeInWei: transactionPayload.txFeeInWei,
    };

    this.setState({
      showConfirmModal: true,
      transactionPayload: transactionPayloadWithAddress,
    });
  };

  handleFormSubmit = () => {
    this.props.sendAsset(this.state.transactionPayload);
    this.props.navigation.navigate(ASSET, { initialModalState: 'SEND_CONFIRMATION' });
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
      assetData,
      formStructure,
      showConfirmModal,
      value,
    } = this.state;
    const { txFeeInWei, amount } = transactionPayload;
    const formOptions = generateFormOptions(
      { onIconPress: this.handleToggleQRScanningState, currency: assetData.token },
    );

    const qrScannerComponent = (
      <QRCodeScanner
        validator={ETHValidator}
        dataFormatter={decodeETHAddress}
        isActive={isScanning}
        onDismiss={this.handleToggleQRScanningState}
        onRead={this.handleQRRead}
      />
    );

    const confirmationModal = (
      <ConfirmationModal
        isVisible={showConfirmModal}
        title="confirm"
      >
        <ModalItemWrapper>
          <ModalItem large>
            <ModalLabel>To</ModalLabel>
            <ModalAddressValue>{value.address}</ModalAddressValue>
          </ModalItem>
          <ModalItem>
            <ModalLabel>Amount</ModalLabel>
            <ModalValue>{amount} <ModalValueSymbol>{assetData.token}</ModalValueSymbol></ModalValue>
          </ModalItem>
          <ModalItem noBorder>
            <ModalLabel>Fee</ModalLabel>
            <ModalValue>
              {txFeeInWei && `${utils.formatEther(txFeeInWei.toString())}`} <ModalValueSymbol>ETH</ModalValueSymbol>
            </ModalValue>
          </ModalItem>
        </ModalItemWrapper>
        <ModalFooter>
          <ModalParagraph light>
          The process may take up to 10 minutes to complete. Please check your transaction history.
          </ModalParagraph>
          <Button title="Confirm Transaction" onPress={this.handleFormSubmit} />
        </ModalFooter>
      </ConfirmationModal>
    );

    return (
      <React.Fragment>
        <SendTokenContactsHeader
          onBack={this.props.navigation.goBack}
          onNext={this.openConfirmationModal}
          amount={amount}
          symbol={assetData.token}
        />
        <Container>
          <Wrapper regularPadding>
            <Title title="choose contact" />
            <Form
              ref={node => { this._form = node; }}
              type={formStructure}
              options={formOptions}
              onChange={this.handleChange}
              onBlur={this.handleChange}
              value={value}
            />
          </Wrapper>
        </Container>
        {qrScannerComponent}
        {confirmationModal}
      </React.Fragment>
    );
  }
}

const mapDispatchToProps = (dispatch) => ({
  sendAsset: (transaction: TransactionPayload) => dispatch(sendAssetAction(transaction)),
});

export default connect(null, mapDispatchToProps)(SendTokenContacts);
