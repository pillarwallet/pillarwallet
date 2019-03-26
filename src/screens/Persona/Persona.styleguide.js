import React from 'react';
import { Alert } from 'react-native';
import Styleguide from 'utils/StyleguideSystem/styleguide';

import Scene from './scene';

Styleguide.add({
  parent: 'SCREEN',
  group: 'Persona',
  id: 'PERSONA_DEFAULT',
  title: 'Default',
  component: (
    <Scene
      onBack={() => Alert.alert('back to Personas')}
      onSavePersona={() => Alert.alert('Save Persona')}
    />
  ),
});
