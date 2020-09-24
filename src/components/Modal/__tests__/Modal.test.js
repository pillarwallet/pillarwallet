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
import { act, create } from 'react-test-renderer';
import { ThemeProvider } from 'styled-components/native';

import { defaultTheme } from 'utils/themes';

import Modal, { ModalProvider } from '../Modal';

describe('Modal', () => {
  let rendererInstance: $FlowFixMe = null;

  beforeEach(() => {
    jest.useFakeTimers();

    act(() => {
      rendererInstance = create(
        <ThemeProvider theme={defaultTheme}>
          <ModalProvider />
        </ThemeProvider>,
      );
    });

    jest.runAllTimers();
  });

  afterEach(() => {
    act(() => rendererInstance.unmount());
    jest.useRealTimers();
  });

  it('opens a modal', () => {
    Modal.open(() => <Modal />);
    jest.runAllTimers();
    expect(rendererInstance.toJSON()).toMatchSnapshot();
  });

  it('opens multiple modals', () => {
    Modal.open(() => <Modal />);
    Modal.open(() => <Modal />);
    jest.runAllTimers();
    expect(rendererInstance.toJSON()).toMatchSnapshot();
  });
});
