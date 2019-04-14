import React from 'react';
import { Alert } from 'react-native';
import { navigate } from 'services/navigation';
import { Styleguide } from 'StyleguideSystem';

import Me from 'screens/Me/scene.js';
import Personas from 'screens/Personas/scene.js';
import Persona from 'screens/Persona/scene.js';

const meUser = {
  profileUri: 'someUrl',
  username: 'foobar',
  activePersona: 'Master',
};

Styleguide.add({
  parent: 'WORKFLOW',
  group: 'Personas',
  id: 'ME_WORKFLOW',
  title: 'Me Initial',
  component: (
    <Me
      profile={meUser}
      onNewSession={() => Alert.alert('new session')}
      onManageDetails={() => navigate('PERSONA_EDIT_WORKFLOW')}
      onSetupRecovery={() => Alert.alert('setup recovery')}
      onPermissions={() => Alert.alert('permissions')}
      onChangePersona={() => navigate('PERSONAS_WORKFLOW')}
    />
  ),
});

const PersonasDef = [
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
    key: 'FOO_PERSONA',
    id: 'FOO_PERSONA',
    alias: 'foo',
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
  parent: 'WORKFLOW',
  group: 'Personas',
  id: 'PERSONAS_WORKFLOW',
  title: 'Personas List',
  component: (
    <Personas
      personas={PersonasDef}
      onActivatePersona={(personaId) => Alert.alert(`switch persona to ${personaId}`)}
      onCreatePersona={() => navigate('PERSONA_CREATE_WORKFLOW')}
      onBack={() => navigate('ME_WORKFLOW')}
    />
  ),
});

Styleguide.add({
  parent: 'WORKFLOW',
  group: 'Personas',
  id: 'PERSONA_CREATE_WORKFLOW',
  title: 'Create Persona',
  component: (
    <Persona
      onBack={() => navigate('PERSONAS_WORKFLOW')}
      onSavePersona={() => navigate('PERSONAS_WORKFLOW')}
      onGetHelp={() => Alert.alert('get help')}
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
  parent: 'WORKFLOW',
  group: 'Personas',
  id: 'PERSONA_EDIT_WORKFLOW',
  title: 'Edit Persona',
  component: (
    <Persona
      onBack={() => navigate('ME_WORKFLOW')}
      onSavePersona={() => navigate('ME_WORKFLOW')}
      onGetHelp={() => Alert.alert('get help')}
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
