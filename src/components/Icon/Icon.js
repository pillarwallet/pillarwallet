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
import { createIconSet } from 'react-native-vector-icons';
import { Platform } from 'react-native';

const glyphMap = {
  chat: '\uE801',
  back: '\uE819',
  close: '\uE802',
  help: '\uE874',
  'down-arrow': '\uE805',
  remove: '\uE806',
  mute: '\uE804',
  'up-arrow': '\uE808',
  search: '\uE851',
  settings: '\uE809',
  warning: '\uE80A',
  check: '\uE80B',
  qrcode: '\uE81C',
  send: '\uF1D9',
  all: '\uE80D',
  social: '\uE80E',
  pending: '\uE80F',
  more: '\uE810',
  received: '\uE811',
  sent: '\uE812',
  camera: '\uE813',
  'info-circle': '\uE815',
  'info-circle-inverse': '\uE82B',
  'tick-circle': '\uE816',
  'warning-circle': '\uE817',
  'chevron-right': '\uE818',
  'send-message': '\uE832',
  'send-asset': '\uE833',
  'send-attachment': '\uE834',
  'chat-filled': '\uE81B',
  ethereum: '\uE844',
  litecoin: '\uE844',
  pound: '\uE846',
  bitcoin: '\uE847',
  'turn-off': '\uE81D',
  'pending-circle': '\uE822',
  'connection-circle': '\uE823',
  flip: '\uE825',
  'flash-off': '\uE826',
  'flash-on': '\uE828',
  gallery: '\uE827',
  scan: '\uE87B',
  delete: '\uE82A',
};

type Props = {
  name: string,
  style?: Object,
}

const fontName = Platform.OS === 'ios' ? 'fontello' : 'PillarIcons';

const IconSet = createIconSet(glyphMap, fontName);

const Icon = (props: Props) => {
  const { name, style } = props;
  return <IconSet name={name} style={style} />;
};

export default Icon;
