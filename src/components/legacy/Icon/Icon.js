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
/* eslint-disable i18next/no-literal-string */

import * as React from 'react';
import { Platform } from 'react-native';
import { createIconSet } from 'react-native-vector-icons';


const glyphMap = {
  chat: '\uE801',
  back: '\uE819',
  close: '\uE802',
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
  'sound-off': '\uE82C',
  plus: '\uE82D',
  'add-contact': '\uE82E',
  cube: '\uE831',
  paperPlane: '\uE803',
  cup: '\uE807',
  qrDetailed: '\uE81A',
  selector: '\uE85A',
  options: '\uE82F',
  lightning: '\uE830',
  present: '\uE838',
  dictionary: '\uE835',
  help: '\uE836',
  like: '\uE837',
  signout: '\uE839',
  hamburger: '\uE875',
  exchange: '\uE86F',
  'rounded-close': '\uE879',
  'connect-active': '\uE87A',
  hidden: '\uE83E',
  failed: '\uE880',
  'count-plus': '\uE83F',
  'count-minus': '\uE840',
  wallet: '\uE842',
  direct: '\uE8C4',
  minus: '\uE81E',
  question: '\uE845',
  equal: '\uE88C',
};

export type IconName = $Keys<typeof glyphMap>;

export type IconProps = {
  name: IconName,
  style?: Object,
};

const fontName = Platform.OS === 'ios' ? 'fontello' : 'PillarIcons';

const IconSet = createIconSet(glyphMap, fontName);

/**
 * @Deprecated This components is considered legacy, and should be no longer used for new code.
 * Please use components/core/Icon which uses SVG icons instead.
 */
const Icon = ({ name, style }: IconProps) => {
  return <IconSet name={name} style={style} />;
};

export default Icon;
