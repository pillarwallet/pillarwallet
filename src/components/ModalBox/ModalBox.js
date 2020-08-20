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
import { Platform, StyleSheet } from 'react-native';
import styled from 'styled-components/native';
import Modal from 'react-native-modal';

// utils
import { themedColors } from 'utils/themes';

// components
import Icon from 'components/Icon';


type Props = {
  isVisible: boolean,
  onModalHide: () => void,
  children: React.Node,
  modalStyle?: StyleSheet.Styles,
  showModalClose?: boolean,
  noBoxMinHeight?: boolean,
};

const Wrapper = styled.KeyboardAvoidingView`
  flex-direction: column;
  align-items: center;
  background-color: transparent;
`;

const Box = styled.View`
  flex-direction: column;
  ${({ noBoxMinHeight }) => !noBoxMinHeight && 'min-height: 320px;'}
  width: 100%;
  margin: auto 0;
  align-self: center;
  border-radius: 10px;
  background-color: ${themedColors.card};
`;

const ModalCloseButton = styled.TouchableOpacity`
  position: absolute;
  top: 0px;
  right: 0px;
  border-radius: 15px;
  height: 30px;
  width: 30px;
  justify-content: center;
  align-items: center;
  opacity: 0.5;
`;

const ModalBox = ({
  isVisible,
  onModalHide,
  modalStyle,
  children,
  showModalClose,
  noBoxMinHeight,
}: Props) => (
  <Modal
    isVisible={isVisible}
    hasBackdrop
    backdropOpacity={0.7}
    onModalHide={onModalHide}
    onBackdropPress={onModalHide}
    style={modalStyle}
  >
    {showModalClose && (
      <ModalCloseButton onPress={onModalHide}>
        <Icon name="rounded-close" style={{ color: '#fff', fontSize: 25 }} />
      </ModalCloseButton>
    )}
    <Wrapper
      enabled
      behavior={Platform.OS === 'ios' ? 'padding' : null}
    >
      <Box noBoxMinHeight={noBoxMinHeight}>
        {children}
      </Box>
    </Wrapper>
  </Modal>
);

export default ModalBox;
