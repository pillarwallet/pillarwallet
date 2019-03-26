import React from 'react';
import { Alert } from 'react-native';
import Styleguide from 'utils/StyleguideSystem/styleguide';

import Scene from './scene';

const Personas = [
  {
    key: 'MASTER_PERSONA',
    id: 'MASTER_PERSONA',
    alias: 'Master Persona',
    isActive: true,
    personaInfo: [
      { username: 'foo', isVisible: true },
      { name: 'Foo Bar', isVisible: true },
      { email: 'foo@bar.com', isVisible: true },
      { phone: '+59856575757', isVisible: true },
      { country: 'Uruguay', isVisible: true },
      { city: 'Montevideo', isVisible: true },
    ],
  },
  {
    key: 'SOCIAL_NETWORKS_PERSONA',
    id: 'SOCIAL_NETWORKS_PERSONA',
    alias: 'Social Networks  Persona',
    isActive: false,
    personaInfo: [
      { username: 'foo', isVisible: true },
      { name: 'Foo Bar', isVisible: true },
      { email: 'foo@bar.com', isVisible: false },
      { phone: '+59856575757', isVisible: false },
      { country: 'Uruguay', isVisible: false },
      { city: 'Montevideo', isVisible: false },
    ],
  },
  {
    key: 'SHOPPING_PERSONA',
    id: 'SHOPPING_PERSONA',
    alias: 'Shopping Persona',
    isActive: false,
    personaInfo: [
      { username: 'foo', isVisible: false },
      { name: 'Foo Bar', isVisible: true },
      { email: 'foo@bar.com', isVisible: true },
      { phone: '+59856575757', isVisible: true },
      { country: 'Uruguay', isVisible: true },
      { city: 'Montevideo', isVisible: true },
    ],
  },
];

Styleguide.add({
  parent: 'SCREEN',
  group: 'Personas',
  id: 'PERSONAS_DEFAULT',
  title: 'Default',
  component: (
    <Scene
      personas={Personas}
      onActivatePersona={(personaId) => Alert.alert(`switch persona to ${personaId}`)}
      onCreatePersona={() => Alert.alert('Create Persona')}
      onBack={() => Alert.alert('back to ME')}
    />
  ),
});
