// @flow
import React from 'react';
import { getStorybookUI, configure } from '@storybook/react-native';
import AsyncStorage from '@react-native-community/async-storage';
import { loadStories } from './storyLoader';
import './rn-addons';

configure(loadStories, module);

const StorybookUIRoot = () => {
  const StorybookComponent = getStorybookUI({
    asyncStorage: AsyncStorage,
  });
  return <StorybookComponent />;
};

export default StorybookUIRoot;
