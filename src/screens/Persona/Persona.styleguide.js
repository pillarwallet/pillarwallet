import React from 'react';
import { Alert } from 'react-native';
import { Styleguide } from 'StyleguideSystem';

import Scene from './scene';

Styleguide.add({
  parent: 'SCREEN',
  group: 'Persona',
  id: 'PERSONA_CREATE',
  title: 'Create Persona',
  component: (
    <Scene
      onBack={() => Alert.alert('back to Personas')}
      onSavePersona={(persona) => Alert.alert('Save Persona')}
      persona={{
        id: null,
        details: [
          { value: null, isVisible: false, key: 'username', isVerified: false },
          { value: null, isVisible: false, key: 'name', isVerified: false },
          { value: null, isVisible: false, key: 'email', isVerified: false },
          { value: null, isVisible: false, key: 'phone', isVerified: false },
          { value: null, isVisible: false, key: 'country', isVerified: false },
          { value: null, isVisible: false, key: 'city', isVerified: false },
        ]
      }}
    />
  ),
});

Styleguide.add({
  parent: 'SCREEN',
  group: 'Persona',
  id: 'PERSONA_EDIT',
  title: 'Edit Persona',
  component: (
    <Scene
      onBack={() => Alert.alert('back to Personas')}
      onSavePersona={(persona) => Alert.alert('Save Persona')}
      persona={{
        id: 1,
        details: [
          { value: 'foo', isVisible: true, key: 'username', isVerified: true },
          { value: 'foo bar', isVisible: false, key: 'name', isVerified: false },
          { value: 'foo@bar.com', isVisible: false, key: 'email', isVerified: false },
          { value: '+555888979', isVisible: true, key: 'phone', isVerified: true },
          { value: 'Uruguay', isVisible: false, key: 'country', isVerified: false },
          { value: 'Montevideo', isVisible: true, key: 'city', isVerified: false },
        ],
      }}
    />
  ),
});
