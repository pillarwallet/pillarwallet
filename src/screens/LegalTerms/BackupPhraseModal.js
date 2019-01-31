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

const BackupPhraseModal = () => (
  <React.Fragment>
    <Paragraph small>
      Your wallet private key is represented and secured by a 12 word backup phrase.
    </Paragraph>
    <Paragraph small>
      It is stored locally on your device. Pillar does not have access to it.
    </Paragraph>
    <Paragraph small>
      Keep your backup phrase safe. If you lose it, Pillar will not be able to recover it for you.
    </Paragraph>
    <Paragraph small>
      Do NOT just store it on your computer. Print it out on a piece of paper or save it to a USB drive.
      Consider the risk of flood or fire. Multiple secure copies are recommended.
    </Paragraph>
    <Paragraph small>
      Do not store your backup phrase in Dropbox, Google Drive, or other cloud storage.
      If that account is compromised, your funds can be stolen.
    </Paragraph>
  </React.Fragment>
);

export default BackupPhraseModal;
