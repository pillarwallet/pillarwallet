import React from 'react';
import { Alert, Text } from 'react-native';
import Styleguide from 'utils/StyleguideSystem/styleguide';

import { Container } from 'components/Layout';
import SettingsListItem from 'components/ListItem/SettingsItem';
import CountrySelect from './CountrySelect';

Styleguide.add({
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
