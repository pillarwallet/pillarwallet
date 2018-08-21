// @flow
import * as React from 'react';
import { Clipboard, Dimensions } from 'react-native';
import QRCode from 'react-native-qrcode';
import { TextLink, BaseText } from 'components/Typography';
import { Footer } from 'components/Layout';
import { spacing, fontSizes } from 'utils/variables';
import styled from 'styled-components/native';
import SlideModal from 'components/Modals/SlideModal';
import Button from 'components/Button';
import WarningBanner from 'components/WarningBanner';
import { showToast } from 'utils/toast';

const { height } = Dimensions.get('window');

const ContentWrapper = styled.View`
  height: ${height / 2};
  justify-content: flex-start;
`;

type Props = {
  address: string,
  onModalHide: Function,
  handleOpenShareDialog: Function,
  token: string,
  tokenName: string,
  isVisible: boolean,
}

const CopyAddressLink = styled.TouchableOpacity`
  margin-top: ${spacing.rhythm}px;
  margin-bottom: ${spacing.rhythm}px;
  align-items: center;
`;

const QRCodeWrapper = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
`;

const WalletAddress = styled(BaseText)`
  font-size: ${fontSizes.medium};
`;

export default class ReceiveModal extends React.Component<Props, *> {
  handleAddressClipboardSet = () => {
    const {
      address,
    } = this.props;
    Clipboard.setString(address);
    showToast({ text: 'Address copied to clipboard', type: 'info', position: 'bottom' });
  };

  handleAddressShare = () => {
    const {
      handleOpenShareDialog,
      address,
    } = this.props;

    handleOpenShareDialog(address);
  };

  render() {
    const {
      isVisible,
      address,
      onModalHide,
    } = this.props;

    return (
      <SlideModal
        title="receive"
        isVisible={isVisible}
        onModalHide={onModalHide}
      >
        <WarningBanner rounded small />
        <ContentWrapper>
          <QRCodeWrapper>
            <QRCode value={address} size={160} />
            <CopyAddressLink onPress={this.handleAddressClipboardSet}>
              <TextLink>Copy wallet address to clipboard</TextLink>
            </CopyAddressLink>

            <WalletAddress>{address}</WalletAddress>
          </QRCodeWrapper>


        </ContentWrapper>
        <Footer>
          <Button
            title="Share Address"
            onPress={this.handleAddressShare}
            style={{
              marginBottom: 20,
            }}
          />
        </Footer>
      </SlideModal>
    );
  }
}
