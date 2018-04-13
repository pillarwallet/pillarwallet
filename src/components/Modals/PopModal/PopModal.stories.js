// @flow
import React from 'react';
import { storiesOf } from '@storybook/react-native';
import PopModal from 'components/Modals/PopModal';

storiesOf('PopModal', module)
  .add('Default', () => (
    <PopModal
      title="Continue"
      message="Lorem ipsum dolor sit amet, consectetur adipisicing elit,
      sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
      actionPrimary="Close Modal"
    />
  ));
