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
import Modal from 'react-native-modal';
import styled from 'styled-components/native';
import LinearGradient from 'react-native-linear-gradient';
import IconButton from 'components/IconButton';
import { baseColors, fontSizes } from 'utils/variables';

type Props = {
  bgColor: string,
  bgColor2?: string,
  children?: React.Node,
  fullScreenComponent?: ?React.Node,
  onModalHide: Function,
  onModalHidden?: Function,
  isVisible: boolean,
};

const ModalWrapper = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  background-color: rgba(32, 55, 86, 0.8);
  padding: 20px;
`;

const StyledLinearGradient = styled(LinearGradient)`
  padding: 16px 20px;
  border-radius: 30px;
  width: 100%;
  overflow: hidden;
`;

const StyledWrapper = styled.View`
  background-color: ${props => props.color};
  padding: 16px 20px;
  border-radius: 30px;
  width: 100%;
  overflow: hidden;
`;

const CloseButton = styled(IconButton)`
  height: 44px;
  width: 44px;
  padding-right: 10px;
  margin-right: -10px;
  align-items: flex-end;
  align-self: flex-end;
  margin-bottom: 8px;
`;

export default class PopModal extends React.Component<Props, *> {
  static defaultProps = {
    fullScreenComponent: null,
  };

  hideModal = () => {
    if (this.props.onModalHide) {
      this.props.onModalHide();
    }
  };

  render() {
    const {
      children,
      fullScreenComponent,
      onModalHidden,
      isVisible,
      bgColor = baseColors.white,
      bgColor2,
    } = this.props;

    return (
      <Modal
        isVisible={isVisible}
        onModalHide={onModalHidden}
        onBackdropPress={this.hideModal}
        animationInTiming={400}
        animationOutTiming={400}
        backdropTransitionInTiming={400}
        backdropTransitionOutTiming={400}
        animationIn="fadeIn"
        animationOut="fadeOut"
        style={{
          margin: 0,
        }}
        hasBackdrop={false}
        useNativeDriver={false}
      >
        <ModalWrapper>
          <CloseButton
            icon="close"
            color={baseColors.white}
            onPress={this.hideModal}
            fontSize={fontSizes.medium}
            horizontalAlign="flex-end"
          />
          {bgColor2 &&
          <StyledLinearGradient
            colors={[bgColor, bgColor2]}
          >
            {children}
          </StyledLinearGradient>
          }
          {!bgColor2 &&
          <StyledWrapper color={bgColor}>
            {children}
          </StyledWrapper>
          }
        </ModalWrapper>
        {fullScreenComponent}
      </Modal>
    );
  }
}
