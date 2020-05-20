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
import { Platform } from 'react-native';
import styled from 'styled-components/native';
import Modal from 'react-native-modal';

import { themedColors } from 'utils/themes';

type Props = {
  isVisible: boolean,
  onModalHide: () => void,
  children: React.Node,
};

const Wrapper = styled.KeyboardAvoidingView`
  flex-direction: column;
  align-items: center;
  background-color: transparent;
`;

const Box = styled.View`
  flex-direction: column;
  min-height: 320px;
  width: 100%;
  margin: auto 0;
  align-self: center;
  border-radius: 10px;
  background-color: ${themedColors.card};
`;

const ModalBox = (props: Props) => (
  <Modal
    isVisible={props.isVisible}
    hasBackdrop
    backdropOpacity={0.7}
    onModalHide={props.onModalHide}
    onBackdropPress={props.onModalHide}
  >
    <Wrapper
      enabled
      behavior={Platform.OS === 'ios' ? 'padding' : null}
    >
      <Box>
        {props.children}
      </Box>
    </Wrapper>
  </Modal>
);

export default ModalBox;
