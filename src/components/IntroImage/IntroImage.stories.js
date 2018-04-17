// @flow
import React from 'react';
import { storiesOf } from '@storybook/react-native';
import IntroImage from 'components/IntroImage';

const introImage = require('../../assets/images/logo_pillar_intro.png');


storiesOf('IntroImage', module)
  .add('Default', () => (
    <IntroImage source={introImage} />
  ));
