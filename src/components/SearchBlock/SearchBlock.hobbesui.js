import React from 'react';
import { Alert } from 'react-native';
import { Hobbes } from 'HobbesUI';

import { baseColors } from 'utils/variables';
import SearchBlock from './SearchBlock';

Hobbes.add({
  parent: 'COMPONENT',
  group: 'SearchBlock',
  id: 'SEARCH_BLOCK_DEFAULT',
  title: 'Default',
  component: (
    <SearchBlock
      itemSearchState
      headerProps={{ title: 'foo' }}
      searchInputPlaceholder="search foo"
      onSearchChange={(q) => console.log(q)}
    />
  ),
});

Hobbes.add({
  parent: 'COMPONENT',
  group: 'SearchBlock',
  id: 'SEARCH_BLOCK_SWITCH_PERSONA',
  title: 'Switch Persona',
  component: (
    <SearchBlock
      itemSearchState
      headerProps={{
        title: 'foo',
        nextText: 'Switch persona',
        nextIcon: 'down-arrow',
        nextIconColor: baseColors.mediumGray,
        nextIconSize: 12,
        onNextPress: () => Alert.alert('Switch Persona'),
      }}
      searchInputPlaceholder="search foo"
      onSearchChange={(q) => console.log(q)}
    />
  ),
});

