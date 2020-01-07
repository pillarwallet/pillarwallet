// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
import * as React from 'react';
import { FlatList } from 'react-native';
import styled from 'styled-components/native';
import SearchBar from 'components/SearchBar';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import { Wrapper } from 'components/Layout';
import { spacing } from 'utils/variables';
import ProfileSettingsItem from 'components/ListItem/SettingsItem';

const SearchBarWrapper = styled.View`
  padding: 0 ${spacing.rhythm}px;
`;

type Props = {
  onSelect: Function,
  options: Object[]
}

type State = {
  query: string,
}

const MIN_QUERY_LENGTH = 2;

export default class SelectList extends React.Component<Props, State> {
  state = {
    query: '',
  };

  handleSearch = (query: string) => {
    const formattedQuery = !query ? '' : query.trim();

    this.setState({
      query: formattedQuery,
    });
  };

  renderListItem = ({ item: { name } }: Object) => {
    const { onSelect } = this.props;
    return (
      <ProfileSettingsItem
        key={name}
        label={name}
        onPress={() => onSelect(name)}
      />
    );
  };

  render() {
    const { options } = this.props;
    const { query } = this.state;
    const filteredOptions = (query && query.length >= MIN_QUERY_LENGTH && options.length)
      ? options.filter(({ name }) => name.toUpperCase().includes(query.toUpperCase()))
      : options;

    return (
      <React.Fragment>
        <SearchBarWrapper>
          <SearchBar
            inputProps={{
              onChange: this.handleSearch,
              value: query,
              autoCapitalize: 'none',
            }}
            placeholder="Search"
          />
        </SearchBarWrapper>
        <FlatList
          data={filteredOptions}
          extraData={filteredOptions}
          renderItem={this.renderListItem}
          keyExtractor={({ name }) => name}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Wrapper
              fullScreen
              style={{
                paddingTop: 90,
                paddingBottom: 90,
                alignItems: 'center',
              }}
            >
              <EmptyStateParagraph title="Nothing found" />
            </Wrapper>
          }
        />
      </React.Fragment>
    );
  }
}
