import React from 'react';
import { Alert, Text } from 'react-native';
import { Styleguide } from 'StyleguideSystem';

import { Container } from 'components/Layout';
import InputSwitch from './ListItemInputSwitch';

Styleguide.add({
  parent: 'COMPONENT',
  group: 'ListItem',
  id: 'INPUT_SWITCH_LIST_ITEM',
  title: 'Input Switch default',
  component: (
    <Container>
      <InputSwitch
        key="foo"
        inputProps={{
          label: 'username',
          value: 'foo',
          onChange: (newValue) => Alert.alert(`it will change to ${newValue}`)
        }}
        switchProps={{
          onPress: () => Alert.alert('set on foo')
        }}
      />
    </Container>
  ),
});

Styleguide.add({
  parent: 'COMPONENT',
  group: 'ListItem',
  id: 'INPUT_SWITCH_LIST_ITEM_ON',
  title: 'Input Switch ON',
  component: (
    <Container>
      <InputSwitch
        key="foo"
        inputProps={{
          label: 'username',
          value: 'foo',
          onChange: (newValue) => Alert.alert(`it will change to ${newValue}`)
        }}
        switchProps={{
          switchStatus: true,
          onPress: () => Alert.alert('set on foo')
        }}
      />
    </Container>
  ),
});
