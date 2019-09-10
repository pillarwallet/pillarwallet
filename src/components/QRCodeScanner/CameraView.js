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
import React, { PureComponent } from 'react';
import { Dimensions } from 'react-native';
import { RNCamera } from 'react-native-camera';
import Header from 'components/Header';
import styled from 'styled-components/native';

import type { Barcode } from 'react-native-camera';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

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

type Props = {
  onQRRead: (barcode: Barcode) => void,
  onCancel: () => void,
  rectangleColor: string,
  rectangleSize: number,
};

export class CameraView extends PureComponent<Props> {
  render() {
    const {
      onQRRead,
      onCancel,
      rectangleSize,
      rectangleColor,
    } = this.props;

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
      </RNCamera>
    );
  }
}
