import React from 'react';
import { Alert, Text } from 'react-native';
import { Styleguide } from 'StyleguideSystem';

import { Container } from 'components/Layout';
import SettingsListItem from './SettingsItem';

Styleguide.add({
  parent: 'COMPONENT',
  group: 'ListItem',
  id: 'SETTINGS_LIST_ITEM',
  title: 'default',
  component: (
    <Container>
      <SettingsListItem
        key="foo"
        label="foo bar"
        onPress={() => Alert.alert('foo bar')}
      />
    </Container>
  ),
});

Styleguide.add({
  parent: 'COMPONENT',
  group: 'ListItem',
  id: 'SETTINGS_LIST_ITEM_WITH_NOTIFICATIONS',
  title: 'With Notification',
  component: (
    <Container>
      <SettingsListItem
        key="foo"
        label="foo bar"
        notificationsCount={3}
        onPress={() => Alert.alert('foo bar')}
      />
    </Container>
  ),
});

Styleguide.add({
  parent: 'COMPONENT',
  group: 'ListItem',
  id: 'SETTINGS_LIST_ITEM_WITH_WARNING_NOTIFICATIONS',
  title: 'Warning Notification',
  component: (
    <Container>
      <SettingsListItem
        warningNotification
        key="foo"
        label="foo bar"
        onPress={() => Alert.alert('foo bar')}
      />
    </Container>
  ),
});

Styleguide.add({
  parent: 'COMPONENT',
  group: 'ListItem',
  id: 'SETTINGS_LIST_ITEM_WITH_LOCK',
  title: 'Locked Item',
  component: (
    <Container>
      <SettingsListItem
        isLocked
        key="foo"
        label="foo bar"
        onPress={() => Alert.alert('foo bar')}
      />
    </Container>
  ),
});

Styleguide.add({
  parent: 'COMPONENT',
  group: 'ListItem',
  id: 'SETTINGS_LIST_ITEM_WITH_SWITCH',
  title: 'Switch Item',
  component: (
    <Container>
      <SettingsListItem
        toggle
        key="foo"
        label="foo bar"
        onPress={() => Alert.alert('foo bar')}
      />
    </Container>
  ),
});
