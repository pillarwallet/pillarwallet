// @flow
import * as React from 'react';
import { Share, Clipboard } from 'react-native';
import { Paragraph } from 'components/Typography';
import { Center, Footer } from 'components/Layout';
import styled from 'styled-components/native';
import SlideModal from 'components/Modals/SlideModal';
import Button from 'components/Button';
import QRCode from 'components/QRCode';

type Props = {
  address: string,
  onModalHide: Function,
  token: string,
  tokenName: string,
  isVisible: boolean,
}

type State = {
  isVisible: boolean,
  address: string,
  onModalHide: Function,
  token: string,
  tokenName: string,
}

const Address = styled.Text`
  font-size: 11px;
`;

export default class ReceiveModal extends React.Component<Props, State> {
  state = {
    isVisible: false,
    address: '',
    onModalHide: () => {},
    token: '',
    tokenName: '',
  }

  static getDerivedStateFromProps(props: Props) {
    return {
      isVisible: props.isVisible,
      address: props.address,
      onModalHide: props.onModalHide,
      token: props.token,
      tokenName: props.tokenName,
    };
  }

  handleAddressClipboardSet = () => {
    const {
      address,
    } = this.state;
    Clipboard.setString(address);
  };

  handleAddressShare = () => {
    const {
      address,
      token,
      tokenName,
      onModalHide,
    } = this.state;

    this.setState({
      isVisible: false,
    },
    () => Share.share({ title: 'Public address', message: address })
      .then(({ action }) => {
        if (action !== Share.dismissedAction) return;
        this.setState({
          isVisible: true,
          address,
          token,
          tokenName,
          onModalHide,
        });
      }),
    );
  };

  render() {
    const {
      isVisible,
      address,
      token,
      tokenName,
      onModalHide,
    } = this.state;

    return (
      <SlideModal title="receive" isVisible={isVisible} onModalHide={onModalHide}>
        <Center>
          <QRCode value={address} blockHeight={5} />
          <Paragraph center>
            This is your ROPSTEN {tokenName} address, use for transfering ROPSTEN {token} only!
          </Paragraph>
          <Address>{address}</Address>
          <Button secondary marginBottom="20px" title="Copy Address" onPress={this.handleAddressClipboardSet} />
        </Center>
        <Footer>
          <Button block title="Share Address" onPress={this.handleAddressShare} />
        </Footer>
      </SlideModal>
    );
  }
}
