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
import styled from 'styled-components/native';

// components
import Icon from 'components/legacy/Icon';
import Modal from 'components/Modal';

// types
import type { ViewStyleProp } from 'utils/types/react-native';

type Props = {|
  children: ReactNode,
  modalStyle?: ViewStyleProp,
  showModalClose?: boolean,
  noBoxMinHeight?: boolean,
  onModalHide?: () => void,
  backdropDismissable?: boolean,
  isSwipeClose?: boolean,
|};

export type ModalBoxInstance = {
  close: () => void,
};

const ModalBox = React.forwardRef<Props, ModalBoxInstance>(({
  modalStyle,
  children,
  showModalClose,
  noBoxMinHeight,
  onModalHide,
  backdropDismissable,
  isSwipeClose,
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
      backdropDismissable={backdropDismissable}
      isSwipeClose={isSwipeClose}
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

const Box = styled.View`
  flex-direction: column;
  ${({ noBoxMinHeight }) => !noBoxMinHeight && 'min-height: 320px;'}
  width: 100%;
  margin: auto 0;
  align-self: center;
  border-radius: 10px;
  background-color: ${({ theme }) => theme.colors.basic050};
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
