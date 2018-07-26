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
};

type Props = {
  name: string,
  style: Object,
}

const IconSet = createIconSet(glyphMap, 'pillar-icons');

export default class Icon extends React.Component<Props> {
  render() {
    const { name, style } = this.props;
    // The check below is a fix for an obscure issue with expo's Font component not being recognised by jest
    if (Font && Font.isLoaded('pillar-icons')) {
      return <IconSet name={name} style={style} />;
    }
    return null;
  }
}
