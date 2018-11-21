// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import {
  Alert,
  ListView,
  Animated,
  Keyboard,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { List } from 'native-base';
import type { NavigationEventSubscription, NavigationScreenProp } from 'react-navigation';
import debounce from 'lodash.debounce';
import orderBy from 'lodash.orderby';
import isEqual from 'lodash.isequal';
import { searchContactsAction, resetSearchContactsStateAction } from 'actions/contactsActions';
import { fetchInviteNotificationsAction } from 'actions/invitationsActions';
import { CONTACT, CONNECTION_REQUESTS } from 'constants/navigationConstants';
import { TYPE_RECEIVED } from 'constants/invitationsConstants';
import { FETCHING, FETCHED } from 'constants/contactsConstants';
import { baseColors } from 'utils/variables';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import { Container, Wrapper } from 'components/Layout';
import Header from 'components/Header';
import Separator from 'components/Separator';
import Spinner from 'components/Spinner';
import SearchBar from 'components/SearchBar';
import Button from 'components/Button/Button';
import PeopleSearchResults from 'components/PeopleSearchResults';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import type { SearchResults } from 'models/Contacts';

import * as styled from './styles';

const MIN_QUERY_LENGTH = 2;

const esBackground = require('assets/images/esLeftLong.png');

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
  searchIsFocused: boolean,
  fullScreenOverlayOpacity: Animated.Value,
}

class PeopleScreen extends React.Component<Props, State> {
  _willBlur: NavigationEventSubscription;
  listViewDS = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 });

  state = {
    query: '',
    searchIsFocused: false,
    fullScreenOverlayOpacity: new Animated.Value(0),
  };

  constructor(props: Props) {
    super(props);
    this.handleContactsSearch = debounce(this.handleContactsSearch, 500);
  }

  componentDidMount() {
    const { navigation } = this.props;
    this._willBlur = navigation.addListener('willBlur', this.onScreenBlur);
  }

  componentWillUnmount() {
    this._willBlur.remove();
  }

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    const isFocused = this.props.navigation.isFocused();
    if (!isFocused) {
      return false;
    }
    const isEq = isEqual(this.props, nextProps) && isEqual(this.state, nextState);
    return !isEq;
  }

  handleSearchChange = (query: any) => {
    this.setState({ query });
    this.handleContactsSearch(query);
  };

  animateFullScreenOverlayOpacity = (active: boolean, onEnd?: Function) => {
    const { fullScreenOverlayOpacity } = this.state;
    if (!active) {
      fullScreenOverlayOpacity.setValue(0);
      Animated.timing(fullScreenOverlayOpacity, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }).start();
    } else {
      fullScreenOverlayOpacity.setValue(1);
      Animated.timing(fullScreenOverlayOpacity, {
        toValue: 0,
        duration: 80,
        useNativeDriver: true,
      }).start(() => onEnd && onEnd());
    }
  };

  handleSearchFocus = () => {
    this.setState({
      searchIsFocused: true,
    });
    this.animateFullScreenOverlayOpacity(false);
  };

  animateAfterDelay = () => {
    this.setState({
      searchIsFocused: false,
    });
  };

  handleSearchBlur = () => {
    Keyboard.dismiss();
    this.animateFullScreenOverlayOpacity(true, this.animateAfterDelay);
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

  renderContact = (item) => (
    <styled.ContactItem>
      <ListItemWithImage
        label={item.username}
        onPress={this.handleContactCardPress(item)}
        avatarUrl={item.profileImage}
        navigateToProfile={this.handleContactCardPress(item)}
      />
      <Separator spaceOnLeft={82} />
    </styled.ContactItem>
  );

  onScreenBlur = () => {
    Keyboard.dismiss();
    this.animateFullScreenOverlayOpacity(true);
  };

  manageConnection = (type: 'mute' | 'remove' | 'block', contactData: Object) => {
    Alert.alert(`${type} ${contactData.username}`);
  };

  render() {
    const { query, searchIsFocused, fullScreenOverlayOpacity } = this.state;
    const {
      searchResults,
      contactState,
      navigation,
      invitations,
      localContacts,
    } = this.props;
    const inSearchMode = (query.length >= MIN_QUERY_LENGTH && !!contactState);
    const usersFound = !!searchResults.apiUsers.length || !!searchResults.localContacts.length;
    const pendingConnectionRequests = invitations.filter(({ type }) => type === TYPE_RECEIVED).length;
    const sortedLocalContacts = orderBy(localContacts, [user => user.username.toLowerCase()], 'asc');

    const sortedLocalContactsDS = this.listViewDS.cloneWithRows(sortedLocalContacts);
    const swipeButtonsWidth = '78';

    return (
      <Container inset={{ bottom: 0 }}>
        <styled.HeaderWrapper>
          <Header title="people" />
          <Wrapper zIndex={100} regularPadding>
            <SearchBar
              backgroundColor={baseColors.white}
              inputProps={{
                onFocus: this.handleSearchFocus,
                onBlur: this.handleSearchBlur,
                onChange: this.handleSearchChange,
                value: query,
                autoCapitalize: 'none',
              }}
              marginTop={15}
            />
          </Wrapper>
        </styled.HeaderWrapper>
        {searchIsFocused && !inSearchMode &&
          <styled.FullScreenOverlayWrapper onPress={this.handleSearchBlur}>
            <styled.AnimatedFullScreenOverlay
              style={{
                opacity: fullScreenOverlayOpacity,
              }}
            />
          </styled.FullScreenOverlayWrapper>
        }
        {!inSearchMode && !!pendingConnectionRequests &&
          <styled.ConnectionRequestBanner
            onPress={this.handleConnectionsRequestBannerPress}
            underlayColor={baseColors.lightGray}
          >
            <React.Fragment>
              <styled.ConnectionRequestBannerText>
                Connection requests
              </styled.ConnectionRequestBannerText>
              <styled.ConnectionRequestNotificationCircle>
                {pendingConnectionRequests}
              </styled.ConnectionRequestNotificationCircle>
              <styled.ConnectionRequestBannerIcon type="Entypo" name="chevron-thin-right" />
            </React.Fragment>
          </styled.ConnectionRequestBanner>
        }

        {inSearchMode && contactState === FETCHED && usersFound &&
          <PeopleSearchResults
            searchResults={searchResults}
            navigation={navigation}
            invitations={invitations}
            localContacts={sortedLocalContacts}
          />
        }

        {!inSearchMode && !!sortedLocalContacts.length &&
          <List
            disableRightSwipe
            rightOpenValue={-228}
            dataSource={sortedLocalContactsDS}
            renderRow={this.renderContact}
            renderRightHiddenRow={(data) => (
              <styled.ConnectionRowActions>
                <Button
                  alignTitleVertical
                  isSquare
                  noPadding
                  small
                  height={swipeButtonsWidth}
                  onPress={() => this.manageConnection('mute', data)}
                  title="Mute"
                  icon="mute"
                />
                <Button
                  alignTitleVertical
                  isSquare
                  noPadding
                  small
                  dark
                  height={swipeButtonsWidth}
                  onPress={() => this.manageConnection('remove', data)}
                  title="Remove"
                  icon="remove"
                />
                <Button
                  alignTitleVertical
                  isSquare
                  noPadding
                  danger
                  small
                  height={swipeButtonsWidth}
                  onPress={() => this.manageConnection('block', data)}
                  title="Block"
                  icon="warning"
                />
              </styled.ConnectionRowActions>
            )}
          />
        }

        {(!inSearchMode || !this.props.searchResults.apiUsers.length) &&
          <KeyboardAvoidingView behavior="padding" enabled={Platform.OS === 'ios'}>
            {!!query && contactState === FETCHING &&
              <Wrapper center><Spinner /></Wrapper>
            }

            {inSearchMode && contactState === FETCHED && !usersFound &&
              <Wrapper center fullScreen style={{ paddingBottom: 100 }}>
                <EmptyStateParagraph title="Nobody found" bodyText="Make sure you entered the name correctly" />
              </Wrapper>
            }

            {!inSearchMode && !sortedLocalContacts.length &&
              <Wrapper center fullScreen style={{ paddingBottom: 100 }}>
                <styled.EmptyStateBGWrapper>
                  <Image source={esBackground} />
                </styled.EmptyStateBGWrapper>
                <EmptyStateParagraph
                  title="Nobody is here"
                  bodyText="Start building your connection list by inviting friends or by searching for someone"
                />
              </Wrapper>
            }
          </KeyboardAvoidingView>
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
