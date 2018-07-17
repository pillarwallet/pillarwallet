// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import { ActivityIndicator, View, FlatList, Keyboard } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import debounce from 'lodash.debounce';
import styled from 'styled-components/native';
import { Icon } from 'native-base';
import { searchContactsAction, resetSearchContactsStateAction } from 'actions/contactsActions';
import { fetchInviteNotificationsAction } from 'actions/invitationsActions';
import { CONTACT, CONNECTION_REQUESTS } from 'constants/navigationConstants';
import { TYPE_RECEIVED } from 'constants/invitationsConstants';
import { FETCHING, FETCHED } from 'constants/contactsConstants';
import { baseColors, UIColors, fontSizes } from 'utils/variables';
import { Container, Wrapper } from 'components/Layout';
import ContactCard from 'components/ContactCard';
import NotificationCircle from 'components/NotificationCircle';
import SearchBar from 'components/SearchBar';
import PeopleSearchResults from 'components/PeopleSearchResults';
import Title from 'components/Title';
import type { SearchResults } from 'models/Contacts';

const PeopleHeader = styled.View`
  flex-direction: row;
  height: 97px;
  background-color: ${baseColors.white};
  padding: 0 16px;
  align-items: center;
  justify-content: space-between;
`;

const ConnectionRequestBanner = styled.TouchableHighlight`
  height: 60px;
  padding-left: 30px;
  border-top-width: 1px;
  border-bottom-width: 1px;
  border-color: ${UIColors.defaultBorderColor};
  align-items: center;
  margin-bottom: 9px;
  flex-direction: row;
`;

const ConnectionRequestBannerText = styled.BaseText`
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

const ContactCardList = styled(FlatList)`
  padding: 16px;
`;

const EmptySectionTextWrapper = styled.View`
  width: 230px;
  margin-top: -200px;
  align-items: center;
  justify-content: center;
`;

const EmptySectionTitle = styled.BaseText`
  font-size: ${fontSizes.large};
  color: ${baseColors.slateBlack};
  margin-bottom: 6px;
`;

const EmptySectionText = styled.BaseText`
  font-size: ${fontSizes.small};
  color: ${baseColors.darkGray};
  text-align: center;
`;

const MIN_QUERY_LENGTH = 2;

type Props = {
  navigation: NavigationScreenProp<*>,
  searchContacts: (query: string) => Function,
  searchResults: SearchResults,
  contactState: ?string,
  user: Object,
  fetchInviteNotifications: Function,
  resetSearchContactsState: Function,
  invitations: Object[],
  localContacts: Object[],
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
    this.handleContactsSearch = debounce(this.handleContactsSearch, 500);
  }

  componentDidMount() {
    const { fetchInviteNotifications } = this.props;
    fetchInviteNotifications();
  }

  handleSearchChange = (query: any) => {
    this.setState({ query });
    this.handleContactsSearch(query);
  };

  handleContactsSearch = (query: string) => {
    if (!query || query.trim() === '' || query.length < MIN_QUERY_LENGTH) {
      this.props.resetSearchContactsState();
      return;
    }
    this.props.searchContacts(query);
  };

  handleContactCardPress = (contact: Object) => () => {
    this.props.navigation.navigate(CONTACT, { contact });
  };

  handleConnectionsRequestBannerPress = () => {
    this.props.navigation.navigate(CONNECTION_REQUESTS);
  };

  renderSeparator = () => {
    return (
      <View style={{ marginTop: -4, borderRadius: 4 }}>
        <View style={{ height: 1, width: '100%' }} />
      </View>
    );
  };

  keyExtractor = (item) => item.id;

  renderContact = ({ item }) => (
    <ContactCard
      onPress={this.handleContactCardPress(item)}
      name={item.firstName || item.username}
      key={item.id}
    />
  );

  render() {
    const { query } = this.state;
    const {
      searchResults,
      contactState,
      navigation,
      invitations,
      localContacts,
    } = this.props;
    const inSearchMode = (query.length >= MIN_QUERY_LENGTH && !!contactState);
    const usersFound = searchResults.apiUsers.length || searchResults.localContacts.length;
    const pendingConnectionRequests = invitations.filter(({ type }) => type === TYPE_RECEIVED).length;

    return (
      <Container>
        <PeopleHeader>
          <Title center noMargin title="people" />
        </PeopleHeader>
        <Wrapper regularPadding>
          <SearchBar
            inputProps={{
              onChange: this.handleSearchChange,
              value: query,
              autoCapitalize: 'none',
            }}
          />
        </Wrapper>

        {!inSearchMode && !!pendingConnectionRequests &&
          <ConnectionRequestBanner
            onPress={this.handleConnectionsRequestBannerPress}
            underlayColor={baseColors.lightGray}
          >
            <React.Fragment>
              <ConnectionRequestBannerText>
                Connection requests
              </ConnectionRequestBannerText>
              <ConnectionRequestNotificationCircle>
                {pendingConnectionRequests}
              </ConnectionRequestNotificationCircle>
              <ConnectionRequestBannerIcon type="Feather" name="chevron-right" />
            </React.Fragment>
          </ConnectionRequestBanner>
        }

        {!!query && contactState === FETCHING &&
          <ActivityIndicator
            animating
            color="#111"
            size="large"
          />
        }

        {inSearchMode && contactState === FETCHED && usersFound &&
          <PeopleSearchResults
            searchResults={searchResults}
            navigation={navigation}
            invitations={invitations}
            localContacts={localContacts}
          />
        }

        {inSearchMode && contactState === FETCHED && !usersFound &&
          <Wrapper center fullScreen>
            <EmptySectionTextWrapper>
              <EmptySectionTitle>Nobody found</EmptySectionTitle>
              <EmptySectionText>
                Make sure you entered the name correctly
              </EmptySectionText>
            </EmptySectionTextWrapper>
          </Wrapper>
        }

        {!inSearchMode && !!localContacts.length &&
          <ContactCardList
            data={localContacts}
            keyExtractor={this.keyExtractor}
            renderItem={this.renderContact}
            ItemSeparatorComponent={this.renderSeparator}
            onScroll={() => Keyboard.dismiss()}
          />
        }

        {!inSearchMode && !localContacts.length &&
          <Wrapper center fullScreen>
            <EmptySectionTextWrapper>
              <EmptySectionTitle>Nobody is here</EmptySectionTitle>
              <EmptySectionText>
                Start building your connection list by inviting friends or by searching for someone
              </EmptySectionText>
            </EmptySectionTextWrapper>
          </Wrapper>
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
  invitations: { data: invitations },
}) => ({
  searchResults,
  contactState,
  localContacts,
  invitations,
});

const mapDispatchToProps = (dispatch: Function) => ({
  searchContacts: (query) => dispatch(searchContactsAction(query)),
  resetSearchContactsState: () => dispatch(resetSearchContactsStateAction()),
  fetchInviteNotifications: () => dispatch(fetchInviteNotificationsAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(PeopleScreen);
