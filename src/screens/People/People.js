// @flow
import * as React from 'react';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import debounce from 'lodash.debounce';
import { contactsSearchAction } from 'actions/contactsActions';
import { CONTACT } from 'constants/navigationConstants';
import { Container, Wrapper, ScrollWrapper } from 'components/Layout';
import Title from 'components/Title';
import ContactCard from 'components/ContactCard';
import SearchBar from 'components/SearchBar';

type Props = {
  navigation: NavigationScreenProp<*>,
  doSearch: (query: string) => Function,
  searchResults: [],
}

type State = {
  query: string,
}

class PeopleScreen extends React.Component<Props, State> {
  state = {
    query: '',
  };

  constructor(props: Props) {
    super(props);
    this.doSearch = debounce(this.doSearch, 500);
  }

  handleSearchChange = (query: any) => {
    console.log('query', query);
    // this.setState({ query });
    this.doSearch(query);
  };

  doSearch = (query: string) => {
    if (!query || query.trim() === '' || query.length < 2) {
      return;
    }

    this.props.doSearch(query);
  };

  handleContactCardPress = () => {
    this.props.navigation.navigate(CONTACT);
  };

  render() {
    const { query } = this.state;
    const { searchResults } = this.props;
    console.log('searchResults', searchResults);
    return (
      <Container>
        <Wrapper regularPadding>
          <Title title="people" />
          <SearchBar
            inputProps={{
              onChange: this.handleSearchChange,
              value: query,
              autoCapitalize: 'none',
            }}
          />
          <ScrollWrapper>
            <ContactCard onPress={this.handleContactCardPress} />
            <ContactCard onPress={this.handleContactCardPress} />
            <ContactCard onPress={this.handleContactCardPress} />
            <ContactCard onPress={this.handleContactCardPress} />
            <ContactCard onPress={this.handleContactCardPress} />
            <ContactCard onPress={this.handleContactCardPress} />
            <ContactCard onPress={this.handleContactCardPress} />
            <ContactCard onPress={this.handleContactCardPress} />
            <ContactCard onPress={this.handleContactCardPress} />
            <ContactCard onPress={this.handleContactCardPress} />
            <ContactCard onPress={this.handleContactCardPress} />
            <ContactCard onPress={this.handleContactCardPress} />
            <ContactCard onPress={this.handleContactCardPress} />
            <ContactCard onPress={this.handleContactCardPress} />
            <ContactCard onPress={this.handleContactCardPress} />
            <ContactCard onPress={this.handleContactCardPress} />
          </ScrollWrapper>
        </Wrapper>
      </Container>
    );
  }
}

const mapStateToProps = ({ contacts: { searchResults, data: localContacts } }) => ({
  searchResults,
  localContacts,
});

const mapDispatchToProps = (dispatch: Function) => ({
  doSearch: (query) => dispatch(contactsSearchAction(query)),
});

export default connect(mapStateToProps, mapDispatchToProps)(PeopleScreen);
