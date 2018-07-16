// @flow
import * as React from 'react';
import { ActivityIndicator } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import debounce from 'lodash.debounce';
import styled from 'styled-components/native';
import { Icon } from 'native-base';
import { searchContactsAction } from 'actions/contactsActions';
import { fetchInviteNotificationsAction } from 'actions/invitationsActions';
import { CONTACT, CONNECTION_REQUESTS } from 'constants/navigationConstants';
import { FETCHING, FETCHED } from 'constants/contactsConstants';
import { baseColors, UIColors, fontSizes } from 'utils/variables';
import { Container, Wrapper, ScrollWrapper } from 'components/Layout';
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
elevation: 1;
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

const EmptySectionTextWrapper = styled.View`
  width: 230px;
  margin-top: -200px;
  align-items: center;
  justify-content: center;
`;

const EmptySectionTitle = styled.Text`
  font-size: ${fontSizes.large};
  color: ${baseColors.slateBlack};
  margin-bottom: 6px;
`;

const EmptySectionText = styled.Text`
  font-size: ${fontSizes.small};
  color: ${baseColors.darkGray};
  text-align: center;
`;

type Props = {
  navigation: NavigationScreenProp<*>,
  searchContacts: (query: string) => Function,
  searchResults: SearchResults,
  contactState: ?string,
  user: Object,
  fetchInviteNotifications: Function,
  invitations: Object[],
  localContacts: Object[],
}

type State = {
  query: string,
  emptyList: boolean,
}

class PeopleScreen extends React.Component<Props, State> {
  state = {
    query: '',
    emptyList: false,
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
    if (!query || query.trim() === '' || query.length < 2) {
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

  renderLocalContacts = () => {
    const { localContacts } = this.props;
    return localContacts.map(contact => (
      <ContactCard
        onPress={this.handleContactCardPress(contact)}
        name={contact.firstName || contact.username}
        key={contact.username}
      />
    ));
  };

  render() {
    const { query, emptyList } = this.state;
    const {
      searchResults,
      contactState,
      navigation,
      invitations,
      localContacts,
    } = this.props;
    const inSearchMode = (query !== '' && !!contactState);

    return (
      <Container>
        <PeopleHeader>
          <Title noMargin title="people" />
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

        {!inSearchMode && !!invitations.length &&
          <ConnectionRequestBanner
            onPress={this.handleConnectionsRequestBannerPress}
            underlayColor={baseColors.lightGray}
          >
            <React.Fragment>
              <ConnectionRequestBannerText>
                Connection requests
              </ConnectionRequestBannerText>
              <ConnectionRequestNotificationCircle>
                {invitations.length}
              </ConnectionRequestNotificationCircle>
              <ConnectionRequestBannerIcon name="arrow-forward" />
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

        {query.length >= 2 && contactState === FETCHED &&
          <PeopleSearchResults
            searchResults={searchResults}
            navigation={navigation}
            invitations={invitations}
            localContacts={localContacts}
          />
        }

        {!inSearchMode && !emptyList &&
          <ContactCardList contentInset={{ bottom: 40 }}>
            {this.renderLocalContacts()}
          </ContactCardList>
        }

        {!!emptyList && !inSearchMode &&
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
  fetchInviteNotifications: () => dispatch(fetchInviteNotificationsAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(PeopleScreen);
