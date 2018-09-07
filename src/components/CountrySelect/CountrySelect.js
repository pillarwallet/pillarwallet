// @flow
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
      .filter(country => country.name.toUpperCase().includes(query.toUpperCase()));
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
