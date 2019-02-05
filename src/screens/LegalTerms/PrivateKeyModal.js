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
import { Paragraph } from 'components/Typography';

const PrivateKeyModal = () => (
  <React.Fragment>
    <Paragraph small>
      When you create an account with Pillar, you are generating a cryptographic set of numbers: your private
      key and your public key (address).
    </Paragraph>
    <Paragraph small>
      Your public address can/should be shared and is how you transact with other individuals on the blockchain.
    </Paragraph>
    <Paragraph small>
      Your private key should remain private and secure as it provides complete control over your wallet and all
      the funds stored within.
    </Paragraph>
    <Paragraph small>
      The handling of your private key(s) happens entirely on your device and is stored locally.
      Pillar does not have access to it. We never transmit, receive or store your private key or pin code.
    </Paragraph>
    <Paragraph small>
      In the Pillar wallet, your private key is represented by your backup phrase.
      If you lose your backup phrase, it is gone forever.
    </Paragraph>
    <Paragraph small>
      Do not lose it or share it with anyone.
    </Paragraph>
  </React.Fragment>
);

export default PrivateKeyModal;
