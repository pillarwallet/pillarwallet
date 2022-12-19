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
import React from 'react';
import { RNCamera } from 'react-native-camera';
import { Buffer } from 'buffer';
import ImagePicker from 'react-native-image-crop-picker';
import jsQR from 'jsqr';
import Jimp from 'jimp/es';
import t from 'translations/translate';
import styled from 'styled-components/native';

// Components
import Header from 'components/Header';
import Toast from 'components/Toast';
import IconButton from 'components/IconButton';
import { Container } from 'components/legacy/Layout';
import Loader from 'components/Loader';
import Icon from 'components/core/Icon';

// Utils
import { fontSizes } from 'utils/variables';
import { getDeviceHeight, getDeviceWidth } from 'utils/common';

// Type
import type { Barcode } from 'react-native-camera';

// Local
import ConnectedAppsFloatingButton from '../../screens/WalletConnect/Home/components/ConnectedAppsFloatingButton';

const screenWidth = getDeviceWidth();
const screenHeight = getDeviceHeight();

const SquareContainer = styled.View`
  position: absolute;
  justify-content: center;
  display: flex;
  height: ${(props) => props.size}px;
  width: ${(props) => props.size}px;
  border-width: 4px;
  border-color: ${(props) => props.color};
  background-color: transparent;
`;

const HeaderWrapper = styled.SafeAreaView`
  margin-bottom: auto;
  width: 100%;
`;

const ButtonWrapper = styled.View`
  width: 33%;
  position: absolute;
  bottom: 60px;
  justify-content: center;
  align-items: center;
`;

const WalletButton = styled.TouchableOpacity`
  padding: 12px;
  border-radius: 50px;
  background-color: ${({ theme }) => theme.colors.basic050};
`;

type Props = {
  onQRRead: (barcode: Barcode) => void,
  onCancel: () => void,
  rectangleColor: string,
  rectangleSize: number,
  onNavigateWallet?: () => void,
};

type State = {
  isLoading: boolean,
};

const ERROR_TIMEOUT = 10000;

export default class CameraView extends React.Component<Props, State> {
  state = {
    isLoading: false,
  };

  timeout: TimeoutID;

  componentWillUnmount() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  }

  handleError = (e?: string) => {
    if (e !== 'Error: User cancelled image selection') {
      Toast.show({
        message: t('toast.cantReadQRCode'),
        emoji: 'woman-shrugging',
        supportLink: true,
        autoClose: true,
      });
    }
    this.props.onCancel();
  };

  handleGalleryPress = async () => {
    this.setState({ isLoading: true });
    try {
      const image = await ImagePicker.openPicker({
        includeBase64: true,
        compressImageMaxWidth: 300,
        compressImageMaxHeight: 300,
      });
      this.timeout = setTimeout(() => {
        this.handleError();
      }, ERROR_TIMEOUT);
      const buffer = Buffer.from(image.data, 'base64');
      const parsedImg = await Jimp.read(buffer);
      const { data, height, width } = parsedImg.bitmap;
      const code = jsQR(data, width, height);
      if (code) {
        this.props.onQRRead(code);
      } else {
        throw new Error();
      }
    } catch (e) {
      this.handleError(e.toString());
    }
    clearTimeout(this.timeout);
  };

  onPressWallet = () => {
    const { onNavigateWallet } = this.props;
    onNavigateWallet && onNavigateWallet();
  };

  render() {
    const { onQRRead, onCancel, rectangleSize, rectangleColor, onNavigateWallet } = this.props;

    const { isLoading } = this.state;

    if (isLoading) {
      return (
        <Container center>
          <Loader noMessages />
        </Container>
      );
    }

    return (
      <RNCamera
        captureAudio={false}
        style={{
          width: screenWidth,
          height: screenHeight,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        type={RNCamera.Constants.Type.back}
        onBarCodeRead={onQRRead}
      >
        <HeaderWrapper>
          <Header light flexStart onClose={onCancel} />
        </HeaderWrapper>
        <SquareContainer color={rectangleColor} size={rectangleSize} />

        {!!onNavigateWallet && (
          <ButtonWrapper style={{ alignSelf: 'flex-start' }}>
            <WalletButton onPress={this.onPressWallet}>
              <Icon name="wallet-connect" size={fontSizes.giant} />
            </WalletButton>
          </ButtonWrapper>
        )}

        <ButtonWrapper>
          <IconButton
            icon="gallery"
            onPress={this.handleGalleryPress}
            fontSize={fontSizes.giant}
            color={rectangleColor}
          />
        </ButtonWrapper>

        {!!onNavigateWallet && (
          <ButtonWrapper style={{ alignSelf: 'flex-end', bottom: 30 }}>
            <ConnectedAppsFloatingButton />
          </ButtonWrapper>
        )}
      </RNCamera>
    );
  }
}
