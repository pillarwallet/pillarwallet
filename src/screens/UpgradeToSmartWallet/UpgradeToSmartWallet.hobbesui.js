import React from 'react';
import { Alert } from 'react-native';
import { Hobbes } from 'HobbesUI';

import Scene from './scene';

Hobbes.add({
  parent: 'SCREEN',
  group: 'SmartContract',
  id: 'UPGRADE_SMART_CONTRACT',
  title: 'Upgrade to SmartContract',
  component: (
    <Scene
      onBack={() => Alert.alert('back to assets')}
      onUpgrade={() => Alert.alert('upgrade user to SmartWallet')}
    />
  ),
});
