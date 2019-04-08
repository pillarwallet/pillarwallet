import React from 'react';
import { Alert } from 'react-native';
import { Styleguide } from 'StyleguideSystem';

import { baseColors } from 'utils/variables';
import Header from './Header';

Styleguide.add({
  parent: 'COMPONENT',
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
  parent: 'COMPONENT',
  group: 'Header',
  id: 'HEADER_WITH_SEPARATOR',
  title: 'With Separator',
  component: (
    <Header
      hasSeparator
      title="foo"
    />
  ),
});

Styleguide.add({
  parent: 'COMPONENT',
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
  parent: 'COMPONENT',
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
  parent: 'COMPONENT',
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
  parent: 'COMPONENT',
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
  parent: 'COMPONENT',
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
  parent: 'COMPONENT',
  group: 'Header',
  id: 'HEADER_NEXT',
  title: 'Next Button',
  component: (
    <Header
      centerTitle
      title="foo"
      nextText="next bar"
      onNextPress={() => Alert.alert('next bar')}
    />
  ),
});

Styleguide.add({
  parent: 'COMPONENT',
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
  parent: 'COMPONENT',
  group: 'Header',
  id: 'HEADER_NEXT_ICON_TEXT',
  title: 'Next Text Icon',
  component: (
    <Header
      title="foo"
      nextText="bar"
      nextIcon="flash-on"
      onNextPress={() => Alert.alert('next icon')}
    />
  ),
});

Styleguide.add({
  parent: 'COMPONENT',
  group: 'Header',
  id: 'HEADER_NEXT_ICON_COLOR_TEXT',
  title: 'Next Text Icon Color',
  component: (
    <Header
      title="foo"
      nextText="bar"
      nextIcon="flash-on"
      nextIconColor={baseColors.mediumLightGray}
      onNextPress={() => Alert.alert('next icon')}
    />
  ),
});

Styleguide.add({
  parent: 'COMPONENT',
  group: 'Header',
  id: 'HEADER_NEXT_TEXT_COLOR',
  title: 'Next Text Color',
  component: (
    <Header
      title="foo"
      nextText="bar"
      nextIcon="flash-on"
      nextTextColor={baseColors.burningFire}
      onNextPress={() => Alert.alert('next icon')}
    />
  ),
});

Styleguide.add({
  parent: 'COMPONENT',
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
  parent: 'COMPONENT',
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
  parent: 'COMPONENT',
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
