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

import Toast, { ToastProvider } from '../Toast';

// Testing toast existence is achieved by looking for (hopefully unique)
// message text.

const hasText = (text: string) => (node) => node.children.some((child) => child === text);

const hasToast = (renderer: $FlowFixMe, message: string) => {
  return renderer.root.findAll(hasText(message)).length === 1;
};

describe('Toasts', () => {
  let rendererInstance: $FlowFixMe = null;

  beforeEach(() => {
    jest.useFakeTimers();

    act(() => {
      rendererInstance = create(
        <ThemeProvider theme={defaultTheme}>
          <ToastProvider />
        </ThemeProvider>,
      );
    });

    jest.runAllTimers();
  });

  afterEach(() => {
    act(() => rendererInstance.unmount());
    jest.useRealTimers();
  });

  it('renders a single toast', () => {
    let extraInstance: $FlowFixMe = null;
    act(() => {
      extraInstance = create(
        <ThemeProvider theme={defaultTheme}>
          <ToastProvider />
        </ThemeProvider>,
      );
    });
    const message = 'TOAST MESSAGE';
    Toast.show({ message, emoji: 'hash', autoClose: false });
    jest.runAllTimers();

    act(() => extraInstance.unmount());
    jest.runAllTimers();

    expect(hasToast(rendererInstance, message)).toEqual(true);
  });

  it('renders multiple toasts', () => {
    let extraInstance: $FlowFixMe = null;
    act(() => {
      extraInstance = create(
        <ThemeProvider theme={defaultTheme}>
          <ToastProvider />
        </ThemeProvider>,
      );
    });
    const messages = ['TOAST MESSAGE 1', 'TOAST MESSAGE 2', 'TOAST MESSAGE 3'];

    messages.forEach((message) => Toast.show({ message, emoji: 'hash', autoClose: false }));
    jest.runAllTimers();

    act(() => extraInstance.unmount());
    jest.runAllTimers();

    expect(messages.every((msg) => hasToast(rendererInstance, msg))).toEqual(true);
  });

  it('renders a toast in the last mounted instance', () => {
    let extraInstance: $FlowFixMe = null;
    act(() => {
      extraInstance = create(
        <ThemeProvider theme={defaultTheme}>
          <ToastProvider />
        </ThemeProvider>,
      );
    });

    const message = 'TOAST MESSAGE';
    Toast.show({ message, emoji: 'hash', autoClose: false });
    jest.runAllTimers();

    expect(hasToast(rendererInstance, message)).toEqual(false);

    act(() => extraInstance.unmount());
  });

  it('moves toasts to the next available instance on unmount', () => {
    let extraInstance: $FlowFixMe = null;
    act(() => {
      extraInstance = create(
        <ThemeProvider theme={defaultTheme}>
          <ToastProvider />
        </ThemeProvider>,
      );
    });

    const message = 'TOAST MESSAGE';
    Toast.show({ message, emoji: 'hash', autoClose: false });
    jest.runAllTimers();

    act(() => extraInstance.unmount());
    jest.runAllTimers();

    expect(hasToast(rendererInstance, message)).toEqual(true);
  });

  it('allows to dismiss all toasts', () => {
    const messages = ['TOAST MESSAGE 1', 'TOAST MESSAGE 2', 'TOAST MESSAGE 3'];

    messages.forEach((message) => Toast.show({ message, emoji: 'hash', autoClose: false }));
    jest.runAllTimers();

    Toast.closeAll();
    jest.runAllTimers();
    expect(messages.every((msg) => !hasToast(rendererInstance, msg))).toEqual(true);
  });

  it('allows to check toast visibility', () => {
    expect(Toast.isVisible()).toEqual(false);

    Toast.show({ message: 'TOAST MESSAGE', emoji: 'hash', autoClose: false });
    jest.runAllTimers();
    expect(Toast.isVisible()).toEqual(true);

    Toast.closeAll();
    jest.runAllTimers();
    expect(Toast.isVisible()).toEqual(false);
  });

  it('dismisses a toast with "autoClose" after a delay', () => {
    const message = 'TOAST MESSAGE';
    Toast.show({
      message,
      emoji: 'hash',
    });

    jest.runAllTimers();
    expect(hasToast(rendererInstance, message)).toEqual(false);
  });
});
