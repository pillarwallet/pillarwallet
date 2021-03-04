// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

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
import { fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from 'testUtils/render';
import FloatingButtons from '../FloatingButtons';
import type { Item } from '../FloatingButtons';


test('Works with single item', () => {
  const item1: Item = { title: 'Item 1', iconName: 'add-contact', onPress: jest.fn() };

  const screen = renderWithTheme(<FloatingButtons items={[item1]} />);
  expect(screen.getAllByTestId('FloatingButtonItem')).toHaveLength(1);

  fireEvent.press(screen.getByText('Item 1'));
  expect(item1.onPress).toHaveBeenCalledTimes(1);
});

test('Works with multiple items', () => {
  const item1: Item = { title: 'Item 1', iconName: 'add-contact', onPress: jest.fn() };
  const item2: Item = { title: 'Item 2', iconName: 'add-contact', onPress: jest.fn() };
  const item3: Item = { title: 'Item 3', iconName: 'add-contact', onPress: jest.fn() };

  const screen = renderWithTheme(<FloatingButtons items={[item1, item2, item3]} />);
  expect(screen.getAllByTestId('FloatingButtonItem')).toHaveLength(3);

  expect(item1.onPress).toHaveBeenCalledTimes(0);
  expect(item2.onPress).toHaveBeenCalledTimes(0);
  expect(item3.onPress).toHaveBeenCalledTimes(0);

  fireEvent.press(screen.getByText('Item 1'));
  expect(item1.onPress).toHaveBeenCalledTimes(1);
  expect(item2.onPress).toHaveBeenCalledTimes(0);
  expect(item3.onPress).toHaveBeenCalledTimes(0);

  fireEvent.press(screen.getByText('Item 2'));
  expect(item2.onPress).toHaveBeenCalledTimes(1);
  expect(item3.onPress).toHaveBeenCalledTimes(0);

  fireEvent.press(screen.getByText('Item 3'));
  expect(item3.onPress).toHaveBeenCalledTimes(1);
});

test('Filters out falsy items', () => {
  const item1: Item = { title: 'Item 1', iconName: 'add-contact', onPress: jest.fn() };
  const item3: Item = { title: 'Item 3', iconName: 'add-contact', onPress: jest.fn() };

  const screen = renderWithTheme(<FloatingButtons items={[item1, false, item3]} />);
  expect(screen.getAllByTestId('FloatingButtonItem')).toHaveLength(2);
  expect(screen.getByText('Item 1')).toBeTruthy();
  expect(screen.getByText('Item 3')).toBeTruthy();
});

test('Renders null for empty items', () => {
  const screen = renderWithTheme(<FloatingButtons items={[]} />);
  expect(screen.toJSON()).toEqual(null);
});

test('Renders null for all falsy items', () => {
  const screen = renderWithTheme(<FloatingButtons items={[false, null, undefined]} />);
  expect(screen.toJSON()).toEqual(null);
});

