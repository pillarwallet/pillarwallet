// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
import * as React from 'react';
import { Clipboard, View, Image } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { BaseText } from 'components/Typography';
import { spacing, fontStyles } from 'utils/variables';
import styled from 'styled-components/native';
import SlideModal from 'components/Modals/SlideModal';
import Button from 'components/Button';
import WarningBanner from 'components/WarningBanner';
import Toast from 'components/Toast';
import { themedColors } from 'utils/themes';

const BuyTokensWrapper = styled.View`
  background-color: ${themedColors.surface};
  width: 100%;
  padding: 20px;
  border-top-color: ${themedColors.tertiary};
  border-top-width: 1px;
  align-items: center;
`;

const ContentWrapper = styled.View`
  padding: 0 ${spacing.rhythm}px;
  align-items: center;
`;

type Props = {
  address: string,
  onModalHide: Function,
  handleOpenShareDialog: Function,
  token: string,
  tokenName: string,
  isVisible: boolean,
  handleBuyTokens?: Function,
  onModalHidden?: Function,
  showBuyTokensSection?: boolean,
}

const QRCodeWrapper = styled.View`
  align-items: center;
  justify-content: center;
`;

const WalletAddress = styled(BaseText)`
  ${fontStyles.regular};
  margin: ${spacing.mediumLarge}px 0;
`;

const IconsContainer = styled.View`
  flex-direction: row;
  margin: ${spacing.rhythm}px;
`;

const IconsSpacing = styled.View`
  width: ${spacing.small}px;
`;

const visaIcon = require('assets/icons/visa.png');
const mastercardIcon = require('assets/icons/mastercard.png');

export default class ReceiveModal extends React.Component<Props, *> {
  handleAddressClipboardSet = () => {
    const {
      address,
    } = this.props;
    Clipboard.setString(address);
    Toast.show({ message: 'Address copied to clipboard', type: 'success', title: 'Success' });
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
      handleBuyTokens,
      onModalHidden,
      showBuyTokensSection = false,
    } = this.props;
    return (
      <SlideModal
        title="Receive"
        isVisible={isVisible}
        onModalHide={onModalHide}
        onModalHidden={onModalHidden}
        noPadding
      >
        <ContentWrapper>
          <WarningBanner rounded small />
          <QRCodeWrapper>
            <WalletAddress>{address}</WalletAddress>
            <View
              style={{
                overflow: 'hidden',
              }}
            >
              <QRCode value={address} size={160} />
            </View>
          </QRCodeWrapper>
          <Button
            title="Share Address"
            onPress={this.handleAddressShare}
            style={{
              marginBottom: 20,
              marginTop: spacing.layoutSides,
            }}
          />
        </ContentWrapper>
        {showBuyTokensSection && (
          <BuyTokensWrapper>
            <Button
              title="Buy tokens"
              onPress={handleBuyTokens}
              positive
            />
            <IconsContainer>
              <Image source={visaIcon} />
              <IconsSpacing />
              <Image source={mastercardIcon} />
            </IconsContainer>
          </BuyTokensWrapper>
        )}
      </SlideModal>
    );
  }
}
