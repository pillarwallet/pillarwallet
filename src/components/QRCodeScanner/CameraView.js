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
import Header from 'components/Header';
import Toast from 'components/Toast';
import styled from 'styled-components/native';
import IconButton from 'components/IconButton';
import { fontSizes } from 'utils/variables';
import { getDeviceHeight, getDeviceWidth } from 'utils/common';
import { Container } from 'components/Layout';
import Loader from 'components/Loader';

import type { Barcode } from 'react-native-camera';

const screenWidth = getDeviceWidth();
const screenHeight = getDeviceHeight();

const SquareContainer = styled.View`
  position: absolute;
  justify-content: center;
  display: flex;
  height: ${props => props.size};
  width: ${props => props.size};
  border-width: 4px;
  border-color: ${props => props.color};
  background-color: transparent;
`;

const HeaderWrapper = styled.SafeAreaView`
  margin-bottom: auto;
  width: 100%;
`;

const ButtonWrapper = styled.View`
  width: 100%;
  position: absolute;
  bottom: 60px;
  justify-content: center;
  align-items: center;
`;

type Props = {
  onQRRead: (barcode: Barcode) => void,
  onCancel: () => void,
  rectangleColor: string,
  rectangleSize: number,
};

type State = {
  isLoading: boolean,
}

const ERROR_TIMEOUT = 10000;

export default class CameraView extends React.Component<Props, State> {
  state = {
    isLoading: false,
  }

  timeout: TimeoutID;

  componentWillUnmount() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  }

  handleError = (e?: string) => {
    if (e !== 'Error: User cancelled image selection') {
      Toast.show({
        message: 'Cannot scan QR code',
        type: 'warning',
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
    } catch (e) { this.handleError(e.toString()); }
    clearTimeout(this.timeout);
  };

  render() {
    const {
      onQRRead,
      onCancel,
      rectangleSize,
      rectangleColor,
    } = this.props;

    const { isLoading } = this.state;

    if (isLoading) {
      return (
        <Container center >
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
        <ButtonWrapper>
          <IconButton
            icon="gallery"
            onPress={this.handleGalleryPress}
            fontSize={fontSizes.giant}
            color={rectangleColor}
          />
        </ButtonWrapper>
      </RNCamera>
    );
  }
}
