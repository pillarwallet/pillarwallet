// @flow
import React from 'react';
import { Alert, View } from 'react-native';
import { Hobbes } from 'HobbesUI';

import SingleInput from './SingleInput';
import TextInput from './TextInput';

Hobbes.add({
  parent: 'COMPONENT',
  group: 'Text Input',
  id: 'SINGLE_INPUT_DEFAULT',
  title: 'Single Input Default',
  component: (
    <View
      style={{
        marginTop: 60,
        marginLeft: 60,
        marginRight: 60,
      }}
    >
      <SingleInput
        inputProps={{
          value: 'foo',
          onChange: (newValue) => Alert.alert(`it will change to ${newValue}`),
        }}
      />
    </View>
  ),
});

Hobbes.add({
  parent: 'COMPONENT',
  group: 'Text Input',
  id: 'SINGLE_INPUT_TO_LEFT',
  title: 'Single Input align left',
  component: (
    <View
      style={{
        marginTop: 60,
        marginLeft: 60,
        marginRight: 60,
      }}
    >
      <SingleInput
        textAlign="left"
        inputProps={{
          value: 'foo',
          onChange: (newValue) => Alert.alert(`it will change to ${newValue}`),
        }}
      />
    </View>
  ),
});

Hobbes.add({
  parent: 'COMPONENT',
  group: 'Text Input',
  id: 'TEXT_INPUT_DEFAULT',
  title: 'Text Input default',
  component: (
    <View
      style={{
        marginTop: 60,
        marginLeft: 60,
        marginRight: 60,
      }}
    >
      <TextInput
        inputProps={{
          value: 'foo',
          onChange: (newValue) => Alert.alert(`it will change to ${newValue}`),
        }}
      />
    </View>
  ),
});
