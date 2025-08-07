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
import { render } from '@testing-library/react-native';

import Modal from 'components/Modal';

import QRCodeScanner from '../QRCodeScanner';
import WalletConnectCamera from '../WalletConnectCamera'; // mock this

jest.mock('components/Modal', () => {
  return jest.fn(({ children }) => <>{children}</>);
});

jest.mock('../WalletConnectCamera', () => {
  return jest.fn(() => null);
});

describe('QR code scanner', () => {
  it('should render WalletConnectCamera inside Modal', () => {
    render(<QRCodeScanner />);

    expect(Modal).toHaveBeenCalled();
    expect(WalletConnectCamera).toHaveBeenCalled();
  });
});
