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
import React, { useRef, useCallback, useImperativeHandle } from 'react';
import type { Node as ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import styled from 'styled-components/native';

// utils
import { themedColors } from 'utils/themes';

// components
import Icon from 'components/Icon';
import Modal from 'components/Modal';

type Props = {|
  children: ReactNode,
  modalStyle?: StyleSheet.Styles,
  showModalClose?: boolean,
  noBoxMinHeight?: boolean,
  onModalHide?: () => void,
|};

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
  top: 15px;
  right: -15px;
  border-radius: 15px;
  height: 60px;
  width: 60px;
  padding: 15px;
  justify-content: center;
  align-items: center;
  opacity: 0.5;
`;

export type ModalBoxInstance = {
  close: () => void,
};

const ModalBox = React.forwardRef<Props, ModalBoxInstance>(({
  modalStyle,
  children,
  showModalClose,
  noBoxMinHeight,
  onModalHide,
}: Props, ref) => {
  const modalRef = useRef();

  const close = useCallback(() => {
    if (modalRef.current) modalRef.current.close();
  }, []);

  useImperativeHandle(ref, () => ({ close }), [close]);

  return (
    <Modal
      ref={modalRef}
      onModalHide={onModalHide}
      style={[{ justifyContent: 'center' }, modalStyle]}
    >
      {showModalClose && (
        <ModalCloseButton onPress={close}>
          <Icon name="rounded-close" style={{ color: '#fff', fontSize: 25 }} />
        </ModalCloseButton>
      )}
      <Box noBoxMinHeight={noBoxMinHeight}>
        {children}
      </Box>
    </Modal>
  );
});

export default ModalBox;
