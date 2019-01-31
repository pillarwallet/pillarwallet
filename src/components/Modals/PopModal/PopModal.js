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
import { Dimensions } from 'react-native';
import Modal from 'react-native-modal';
import styled from 'styled-components/native';
import Title from 'components/Title';
import Button from 'components/Button';

type Props = {
  title?: string,
  headerImage?: string,
  children?: React.Node,
  fullScreenComponent?: ?React.Node,
  onModalHide?: Function,
  onModalHidden?: Function,
  isVisible: boolean,
  animationOutTiming: number,
  animationInTiming: number,
  backdropTransitionInTiming: number,
  backdropTransitionOutTiming: number,
};

const window = Dimensions.get('window');

const ModalWrapper = styled.View`
  position: absolute;
  width: 100%;
  align-items: center;
  justify-content: center;
`;

const ModalHeaderImage = styled.Image`
  width: 300;
  height: 150;
`;

const ModalBackground = styled.View`
  background-color: white;
  padding: 20px;
  border-radius: 20;
  box-shadow: 10px 5px 5px rgba(0,0,0,.5);
  width: ${window.width - 40};
  overflow: hidden;
`;

const ModalContent = styled.View`
  flex: 1;
  align-items: center;
  justify-content: space-around;
`;


export default class PopModal extends React.Component<Props, *> {
  static defaultProps = {
    fullScreenComponent: null,
    animationInTiming: 300,
    animationOutTiming: 400,
    backdropTransitionInTiming: 300,
    backdropTransitionOutTiming: 300,
  };

  hideModal = () => {
    if (this.props.onModalHide) {
      this.props.onModalHide();
    }
  }

  render() {
    const {
      children,
      title,
      fullScreenComponent,
      onModalHidden,
      headerImage,
      animationInTiming,
      animationOutTiming,
      backdropTransitionInTiming,
      backdropTransitionOutTiming,
      isVisible,
    } = this.props;
    return (
      <Modal
        isVisible={isVisible}
        onSwipe={this.hideModal}
        onModalHide={onModalHidden}
        onBackdropPress={this.hideModal}
        animationInTiming={animationInTiming}
        animationOutTiming={animationOutTiming}
        backdropTransitionInTiming={backdropTransitionInTiming}
        backdropTransitionOutTiming={backdropTransitionOutTiming}
        animationIn="zoomIn"
        animationOut="zoomOut"
        swipeDirection="down"
        style={{
          margin: 0,
        }}
      >
        <ModalWrapper>
          <ModalBackground>
            <ModalContent>
              {!!headerImage && <ModalHeaderImage source={headerImage} />}
              {!!title && <Title title={title} />}
              {isVisible && children}
              <Button block title="Dismiss" onPress={this.hideModal} />
            </ModalContent>
          </ModalBackground>
        </ModalWrapper>
        {fullScreenComponent}
      </Modal>
    );
  }
}
