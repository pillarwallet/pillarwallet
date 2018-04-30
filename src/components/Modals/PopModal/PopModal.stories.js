// @flow
import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { action } from '@storybook/addon-actions';
import PopModal from 'components/Modals/PopModal';

storiesOf('PopModal', module)
  .add('Default', () => (
    <PopModal
      title="Check it Out!"
      message="Look at this super awesome Custom Alert Modal."
      modalImage=""
      isVisible
      actionTitle="Radical!"
      onAccept={action('Accept Modal')}
      onDismiss={action('Dismiss Modal')}
    />
  ));
