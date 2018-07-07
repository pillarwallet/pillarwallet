// @flow
import * as React from 'react';
import { ActivityIndicator } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import debounce from 'lodash.debounce';
import styled from 'styled-components/native';
import { Icon } from 'native-base';
import { contactsSearchAction } from 'actions/contactsActions';
import { CONTACT, CONNECTION_REQUESTS } from 'constants/navigationConstants';
import { FETCHING, FETCHED } from 'constants/contactsConstants';
import { baseColors, UIColors, fontSizes } from 'utils/variables';
import { Container, Wrapper, ScrollWrapper } from 'components/Layout';
import Title from 'components/Title';
import ContactCard from 'components/ContactCard';
import NotificationCircle from 'components/NotificationCircle';
import SearchBar from 'components/SearchBar';
import PeopleSearchResults from 'components/PeopleSearchResults';


const ConnectionRequestBanner = styled.TouchableHighlight`
  height: 60px;
  padding-left: 30px;
  border-top-width: 1px;
  border-bottom-width: 1px;
  border-color: ${UIColors.defaultBorderColor};
  align-items: center;
  flex-direction: row;
`;

const ConnectionRequestBannerText = styled.Text`
  font-size: ${fontSizes.medium};
`;

const ConnectionRequestBannerIcon = styled(Icon)`
  font-size: ${fontSizes.medium};
  color: ${baseColors.darkGray};
  margin-left: auto;
  margin-right: 16px;
`;

const ConnectionRequestNotificationCircle = styled(NotificationCircle)`
  margin-left: 10px;
`;

const ContactCardList = styled(ScrollWrapper)`
  padding: 16px;
`;

type Props = {
  navigation: NavigationScreenProp<*>,
  doSearch: (query: string) => Function,
  searchResults: {
    apiUsers: Object[],
    localContacts: Object[],
  },
  contactState: ?string,
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
    this.setState({ query });
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

  handleConnectionsRequestBannerPress = () => {
    this.props.navigation.navigate(CONNECTION_REQUESTS);
  };

  render() {
    const { query } = this.state;
    const { searchResults, contactState, navigation } = this.props;
    const inSearchMode = (query !== '' && !!contactState);

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
        </Wrapper>

        {!inSearchMode &&
        <ConnectionRequestBanner
          onPress={this.handleConnectionsRequestBannerPress}
          underlayColor={baseColors.lightGray}
        >
          <React.Fragment>
            <ConnectionRequestBannerText>
              Connection requests
            </ConnectionRequestBannerText>
            <ConnectionRequestNotificationCircle>
              5
            </ConnectionRequestNotificationCircle>
            <ConnectionRequestBannerIcon name="arrow-forward"/>
          </React.Fragment>
        </ConnectionRequestBanner>
        }

        {query !== '' && contactState === FETCHING &&
        <ActivityIndicator
          animating
          color="#111"
          size="large"
        />
        }

        {query !== '' && contactState === FETCHED &&
        <PeopleSearchResults searchResults={searchResults} navigation={navigation} />
        }

        {!inSearchMode &&
        <ContactCardList contentInset={{ bottom: 40 }}>
          <ContactCard
            onPress={this.handleContactCardPress}
            name="John Doe"
          />
          <ContactCard
            onPress={this.handleContactCardPress}
            name="David Bowie"
            notificationCount={4}
          />
          <ContactCard
            onPress={this.handleContactCardPress}
            name="Vitalik Satoshi"
          />
          <ContactCard
            onPress={this.handleContactCardPress}
            name="Beta Alpha"
          />
        </ContactCardList>
        }
      </Container>
    );
  }
}

const mapStateToProps = ({
  contacts: {
    searchResults,
    contactState,
    data: localContacts,
  },
}) => ({
  searchResults,
  contactState,
  localContacts,
});

const mapDispatchToProps = (dispatch: Function) => ({
  doSearch: (query) => dispatch(contactsSearchAction(query)),
});

export default connect(mapStateToProps, mapDispatchToProps)(PeopleScreen);
