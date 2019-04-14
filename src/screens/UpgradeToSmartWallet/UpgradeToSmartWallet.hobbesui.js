import React from 'react';
import { Alert } from 'react-native';
import { Styleguide } from 'StyleguideSystem';

import Scene from './scene';

Styleguide.add({
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
