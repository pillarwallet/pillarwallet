// @flow
import React from 'react';
import { storiesOf } from '@storybook/react-native';
import PopModal from 'components/Modals/PopModal';

storiesOf('PopModal', module)
  .add('Default', () => (
    <PopModal
      isVisible
      title="Your transaction has been sent"
    >
      Lorem ipsum dolor sit amet, consectetur adipisicing elit.
    </PopModal>
  ));
