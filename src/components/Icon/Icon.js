// @flow
import * as React from 'react';
import { createIconSet } from 'react-native-vector-icons';
import { Platform } from 'react-native';

const glyphMap = {
  chat: '\uE801',
  back: '\uE800',
  close: '\uE802',
  help: '\uE803',
  'down-arrow': '\uE805',
  remove: '\uE806',
  mute: '\uE804',
  'up-arrow': '\uE808',
  search: '\uE807',
  settings: '\uE809',
  warning: '\uE80A',
  check: '\uE80B',
  qrcode: '\uE80C',
  send: '\uF1D9',
  all: '\uE80D',
  social: '\uE80E',
  pending: '\uE80F',
  more: '\uE810',
  sent: '\uE811',
  received: '\uE812',
};

type Props = {
  name: string,
  style: Object,
}

const fontName = Platform.OS === 'ios' ? 'fontello' : 'PillarIcons';

const IconSet = createIconSet(glyphMap, fontName);

const Icon = (props: Props) => {
  const { name, style } = props;
  return <IconSet name={name} style={style} />;
};

export default Icon;
