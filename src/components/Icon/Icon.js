// @flow
import * as React from 'react';
import { Font } from 'expo';
import { createIconSet } from '@expo/vector-icons';

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
};

type Props = {
  name: string,
  style: Object,
}

const IconSet = createIconSet(glyphMap, 'pillar-icons');

const Icon = (props: Props) => {
  const { name, style } = props;
  if (Font && Font.isLoaded('pillar-icons')) {
    return <IconSet name={name} style={style} />;
  }
  return null;
};

export default Icon;
