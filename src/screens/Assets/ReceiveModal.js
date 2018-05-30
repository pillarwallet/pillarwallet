// @flow
import * as React from 'react';
import { Share, Clipboard } from 'react-native';
import { Paragraph } from 'components/Typography';
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

const Container = styled.View`
  flex: ${props => props.flex};
  justify-content: center;
  flex-direction: column;
  align-items: center;
`;

const Address = styled.Text`
  font-size: 11px;
`;

export default class ReceiveModal extends React.Component<Props> {
  handleAddressClipboardSet = () => {
    const { address } = this.props;
    Clipboard.setString(address);
  };

  handleAddressShare = () => {
    const { address } = this.props;
    Share.share({ title: 'Public address', message: address });
  };

  render() {
    const {
      address,
      isVisible,
      token,
      tokenName,
      onModalHide,
    } = this.props;

    return (
      <SlideModal title="receive" isVisible={isVisible} onModalHide={onModalHide}>
        <Container flex={4}>
          <QRCode value={address} blockHeight={5} />
          <Paragraph center>
            This is your ROPSTEN {tokenName} address, use for transfering ROPSTEN {token} only!
          </Paragraph>
        </Container>
        <Container flex={3}>
          <Address>{address}</Address>
          <Button secondary marginBottom="20px" title="Copy Address" onPress={this.handleAddressClipboardSet} />
          <Button title="Share Address" onPress={this.handleAddressShare} />
        </Container>
      </SlideModal>
    );
  }
}
