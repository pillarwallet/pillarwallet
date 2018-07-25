// @flow
import { createIconSet } from '@expo/vector-icons';

const glyphMap = {
  'chat': '\uE801',
  'back': '\uE800',
  'close': '\uE802',
  'help': '\uE803',
  'down-arrow': '\uE805',
  'remove': '\uE806',
  'mute': '\uE804',
  'up-arrow': '\uE808',
  'search': '\uE807',
  'settings': '\uE809',
  'warning': '\uE80A',
};

const Icon = createIconSet(glyphMap, 'pillar-icons');

export default Icon;
