import React from 'react';
import { Alert } from 'react-native';
import Styleguide from 'utils/StyleguideSystem/styleguide';

import { baseColors } from 'utils/variables';
import Header from './Header.js';

Styleguide.add({
  group: 'Header',
  id: 'HEADER_DEFAULT',
  title: 'Default',
  component: (
    <Header
      title="foo"
    />
  ),
});

Styleguide.add({
  group: 'Header',
  id: 'HEADER_TITLE_PRESS',
  title: 'Press Title',
  component: (
    <Header
      title="press"
      onTitlePress={() => Alert.alert('title pressed')}
    />
  ),
});

Styleguide.add({
  group: 'Header',
  id: 'HEADER_CENTER_TITLE',
  title: 'Center Title',
  component: (
    <Header
      centerTitle
      title="center"
    />
  ),
});

Styleguide.add({
  group: 'Header',
  id: 'HEADER_WRAP',
  title: 'Wrap Title',
  component: (
    <Header
      title="Wrap Title for some other text"
      nextText="next bar"
      onNextPress={() => Alert.alert('next bar')}
    />
  ),
});

Styleguide.add({
  group: 'Header',
  id: 'HEADER_DOT_COLOR',
  title: 'Dot Color',
  component: (
    <Header
      title="dot color"
      dotColor={baseColors.burningFire}
    />
  ),
});

Styleguide.add({
  group: 'Header',
  id: 'HEADER_NO_DOT',
  title: 'No Dot',
  component: (
    <Header
      title="no dot"
      noBlueDotOnTitle
      dotColor={baseColors.burningFire}
    />
  ),
});

Styleguide.add({
  group: 'Header',
  id: 'HEADER_NEXT',
  title: 'Next Button',
  component: (
    <Header
      title="foo"
      nextText="next bar"
      onNextPress={() => Alert.alert('next bar')}
    />
  ),
});

Styleguide.add({
  group: 'Header',
  id: 'HEADER_NEXT_ICON',
  title: 'Next Icon',
  component: (
    <Header
      title="foo"
      nextIcon="flash-on"
      onNextPress={() => Alert.alert('next icon')}
    />
  ),
});

Styleguide.add({
  group: 'Header',
  id: 'HEADER_DEFAULT_BACK_ICON',
  title: 'Back Icon',
  component: (
    <Header
      title="foo"
      onBack={() => Alert.alert('back')}
    />
  ),
});

Styleguide.add({
  group: 'Header',
  id: 'HEADER_CUSTOM_BACK_ICON',
  title: 'Custom Back Icon',
  component: (
    <Header
      title="foo"
      backIcon="flash-on"
      onBack={() => Alert.alert('back')}
    />
  ),
});

Styleguide.add({
  group: 'Header',
  id: 'HEADER_ON_CLOSE',
  title: 'On Close',
  component: (
    <Header
      title="foo"
      onClose={() => Alert.alert('close')}
    />
  ),
});
