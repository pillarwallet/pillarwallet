// @flow

import React from 'react';
import { Alert } from 'react-native';
import { Hobbes } from 'HobbesUI';

import { Container } from 'components/Layout';
import InputSwitch from './ListItemInputSwitch';

Hobbes.add({
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
          onChange: (newValue) => Alert.alert(`it will change to ${newValue}`),
        }}
        switchProps={{
          onPress: () => Alert.alert('set on foo'),
        }}
      />
    </Container>
  ),
});

Hobbes.add({
  parent: 'COMPONENT',
  group: 'ListItem',
  id: 'INPUT_SWITCH_LIST_ITEM_ERROR',
  title: 'Input Switch Error',
  component: (
    <Container>
      <InputSwitch
        key="foo"
        errorMessage="some error happened"
        inputProps={{
          label: 'username',
          value: 'foo',
          onChange: (newValue) => Alert.alert(`it will change to ${newValue}`),
        }}
        switchProps={{
          onPress: () => Alert.alert('set on foo'),
        }}
      />
    </Container>
  ),
});

Hobbes.add({
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
          onChange: (newValue) => Alert.alert(`it will change to ${newValue}`),
        }}
        switchProps={{
          switchStatus: true,
          onPress: () => Alert.alert('set on foo'),
        }}
      />
    </Container>
  ),
});

Hobbes.add({
  parent: 'COMPONENT',
  group: 'ListItem',
  id: 'INPUT_SWITCH_LIST_ITEM_SELECT',
  title: 'Input Switch with Select',
  component: (
    <Container>
      <InputSwitch
        key="foo"
        inputType="Select"
        inputProps={{
          label: 'username',
          value: 'foo',
          onSelect: () => Alert.alert('it should display modal to select an option'),
        }}
        switchProps={{
          switchStatus: true,
          onPress: () => Alert.alert('set on foo'),
        }}
      />
    </Container>
  ),
});
