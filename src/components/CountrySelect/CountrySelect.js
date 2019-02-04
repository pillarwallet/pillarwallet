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
import { baseColors, spacing } from 'utils/variables';
import countries from 'utils/countries.json';

const sortedCountries = countries.sort((a, b) => a.name.localeCompare(b.name));

const SearchBarWrapper = styled.View`
  padding: 0 ${spacing.rhythm}px;
`;

type Props = {
  renderItem: Object,
}

type State = {
  query: string,
  filteredCountries: ?Object[],
}

export default class CountrySelect extends React.Component<Props, State> {
  state = {
    query: '',
    filteredCountries: null,
  };

  handleCountrySearch = (query: string) => {
    if (!query || query.trim() === '' || query.length < 2) {
      this.setState({ filteredCountries: null, query });
      return;
    }
    const filteredCountries = sortedCountries
      .map(country => {
        const index = country.name.toUpperCase().indexOf(query.toUpperCase());
        return {
          index,
          country,
        };
      })
      .filter(({ index }) => index > -1)
      .sort((a, b) => a.index - b.index)
      .map(({ country }) => country);

    this.setState({ filteredCountries, query });
  };

  render() {
    const { renderItem } = this.props;
    const { query, filteredCountries } = this.state;

    return (
      <React.Fragment>
        <SearchBarWrapper>
          <SearchBar
            inputProps={{
              onChange: this.handleCountrySearch,
              value: query,
              autoCapitalize: 'none',
            }}
            placeholder="Search"
            backgroundColor={baseColors.white}
          />
        </SearchBarWrapper>
        <FlatList
          data={filteredCountries || sortedCountries}
          extraData={filteredCountries}
          renderItem={renderItem}
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
              <EmptyStateParagraph title="Nothing found" bodyText="Make sure you entered the country correctly" />
            </Wrapper>
          }
        />
      </React.Fragment>
    );
  }
}
