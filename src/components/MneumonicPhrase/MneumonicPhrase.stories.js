// @flow
import React from 'react';
import { storiesOf } from '@storybook/react-native';
import MneumonicPhrase from 'components/MneumonicPhrase';
import MneumonicPhraseItem from 'components/MneumonicPhraseItem';


storiesOf('MneumonicPhrase', module)
  .add('Default', () => (
    <MneumonicPhrase>
      <MneumonicPhraseItem>fox</MneumonicPhraseItem>
      <MneumonicPhraseItem>the</MneumonicPhraseItem>
      <MneumonicPhraseItem>ipsum</MneumonicPhraseItem>
      <MneumonicPhraseItem>brown</MneumonicPhraseItem>
      <MneumonicPhraseItem>green</MneumonicPhraseItem>
      <MneumonicPhraseItem>dog</MneumonicPhraseItem>
      <MneumonicPhraseItem>jumps</MneumonicPhraseItem>
      <MneumonicPhraseItem>the</MneumonicPhraseItem>
      <MneumonicPhraseItem>red</MneumonicPhraseItem>
      <MneumonicPhraseItem>quick</MneumonicPhraseItem>
      <MneumonicPhraseItem>over</MneumonicPhraseItem>
      <MneumonicPhraseItem>lorem</MneumonicPhraseItem>
      <MneumonicPhraseItem>lazy</MneumonicPhraseItem>
    </MneumonicPhrase>
  ));
