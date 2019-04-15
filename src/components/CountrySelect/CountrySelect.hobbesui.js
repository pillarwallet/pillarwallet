// @flow

import React from 'react';
import { Alert } from 'react-native';
import { Hobbes } from 'hobbesui';

import { Container } from 'components/Layout';
import SettingsListItem from 'components/ListItem/SettingsItem';
import CountrySelect from './CountrySelect';

Hobbes.add({
  parent: 'COMPONENT',
  group: 'CountrySelect',
  id: 'COUNTRY_SELECT_DEFAULT',
  title: 'default',
  component: (
    <Container>
      <CountrySelect
        renderItem={({ item: { name } }) => (
          <SettingsListItem
            key={name}
            label={name}
            onPress={() => Alert.alert(name)}
          />
        )}
      />
    </Container>
  ),
});
