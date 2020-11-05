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
import { storiesOf } from '@storybook/react-native';
import styled from 'styled-components/native';
import ActionModal from './ActionModal';

const items = [
  {
    label: 'First item',
    chevron: true,
    key: 'first',
  },
  {
    label: 'Second item',
    money: '123$',
    key: 'second',
  },
];


const Wrapper = styled.View`
  flex: 1;
  background-color: #000000;
  justify-content: flex-end;
  padding: 0 16px;
`;

const ModalWrapper = styled.View`
  width: 100%;
  background-color: #FFFFFF;
  border-top-left-radius: 30px;
  border-top-right-radius: 30px;
`;

storiesOf('ActionModal', module).add('default', () => (
  <Wrapper>
    <ModalWrapper>
      <ActionModal items={items} storybook />
    </ModalWrapper>
  </Wrapper>
));
