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
import type { Node } from 'react';
import {
  FlatList,
  Keyboard,
  Image,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import Swipeout from 'react-native-swipeout';
import type { NavigationEventSubscription, NavigationScreenProp } from 'react-navigation';
import isEqual from 'lodash.isequal';
import capitalize from 'lodash.capitalize';
import { FETCHING, FETCHED } from 'constants/contactsConstants';
import { DISCONNECT } from 'constants/connectionsConstants';
import { baseColors, spacing } from 'utils/variables';
import { Container, Wrapper } from 'components/Layout';
import SearchBlock from 'components/SearchBlock';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import Separator from 'components/Separator';
import Spinner from 'components/Spinner';
import Button from 'components/Button/Button';
import PeopleSearchResults from 'components/PeopleSearchResults';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import type { SearchResults } from 'models/Contacts';
import ConnectionConfirmationModal from 'screens/Contact/ConnectionConfirmationModal';

import {
  ConnectionRequestBanner,
  ConnectionRequestBannerText,
  ConnectionRequestBannerIcon,
  ConnectionRequestNotificationCircle,
  EmptyStateBGWrapper,
} from './styles';


const MIN_QUERY_LENGTH = 2;

const esBackground = require('assets/images/esLeftLong.png');

type Props = {
  navigation: NavigationScreenProp<*>,
  onSearchChange: Function,
  searchResults: SearchResults,
  contactState: ?string,
  fetchInviteNotifications: Function,
  disconnectContact: Function,
  invitations: Object[],
  onHandleConnectionsRequestBannerPress: Function,
  sortedLocalContacts: Object[],
  onHandleContactCardPress: Function,
  pendingConnectionRequests: number,
}

type State = {
  query: string,
  showConfirmationModal: boolean,
  manageContactType: string,
  manageContactId: string,
  forceHideRemoval: boolean,
}

class PeopleScene extends React.Component<Props, State> {
  didBlur: NavigationEventSubscription;
  willFocus: NavigationEventSubscription;

  state = {
    query: '',
    showConfirmationModal: false,
    manageContactType: '',
    manageContactId: '',
    forceHideRemoval: false,
  };

  componentDidMount() {
    this.willFocus = this.props.navigation.addListener(
      'willFocus',
      () => { this.setState({ forceHideRemoval: false }); },
    );

    this.didBlur = this.props.navigation.addListener(
      'didBlur',
      () => { this.setState({ forceHideRemoval: true }); },
    );
  }

  componentWillUnmount() {
    if (this.didBlur) this.didBlur.remove();
    if (this.willFocus) this.willFocus.remove();
  }

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    const isFocused = this.props.navigation.isFocused();
    if (!isFocused) {
      return false;
    }
    const isEq = isEqual(this.props, nextProps) && isEqual(this.state, nextState);
    return !isEq;
  }

  manageConnection = (manageContactType: string, contactData: Object) => {
    // condition to avoid confirmation if MUTE should be considered here
    this.setState({
      showConfirmationModal: true,
      forceHideRemoval: false,
      manageContactType,
      manageContactId: contactData.id,
    });
  };

  renderSwipeoutBtns = (data: Object): Array<Node> => {
    const swipeButtons = [
      // { actionType: MUTE, icon: 'mute'},
      { actionType: DISCONNECT, icon: 'remove' },
      // { actionType: BLOCK, icon: 'warning'},
    ];

    return swipeButtons.map((buttonDefinition): Object => {
      const { actionType, icon, ...btnProps } = buttonDefinition;

      return {
        component: (
          <Button
            square
            extraSmall
            height={80}
            onPress={() => this.manageConnection(actionType, data)}
            title={capitalize(actionType)}
            icon={icon}
            iconSize="small"
            {...btnProps}
            style={{
              marginTop: 2,
            }}
            textStyle={{
              marginTop: 9,
            }}
          />
        ),
        backgroundColor: baseColors.lighterGray,
      };
    });
  };

  renderContact = ({ item }: Object) => (
    // please refer to https://www.pivotaltracker.com/story/show/163147492
    // to understand the reason for the temporary disabling of swipeout feature
    <Swipeout
      disabled
      right={this.renderSwipeoutBtns(item)}
      backgroundColor="transparent"
      sensitivity={10}
      close={this.state.forceHideRemoval}
      style={{
        paddingRight: 14,
      }}
      buttonWidth={80}
    >
      <ListItemWithImage
        label={item.username}
        onPress={() => this.props.onHandleContactCardPress(item)}
        avatarUrl={item.profileImage}
        navigateToProfile={() => this.props.onHandleContactCardPress(item)}
      />
    </Swipeout>
  );

  confirmManageAction = () => {
    // here will be called the action to manageContactType (block, disconnect, mute)
    const {
      manageContactType,
      manageContactId,
    } = this.state;

    if (manageContactType === DISCONNECT) {
      this.props.disconnectContact(manageContactId);
    }

    this.setState({
      showConfirmationModal: false,
      forceHideRemoval: true,
    });
  };

  render() {
    const {
      query,
      showConfirmationModal,
      manageContactType,
      manageContactId,
    } = this.state;
    const {
      navigation,
      contactState,
      onSearchChange,
      pendingConnectionRequests,
      invitations,
      onHandleConnectionsRequestBannerPress,
      searchResults,
      sortedLocalContacts,
      fetchInviteNotifications,
    } = this.props;

    const inSearchMode = (query.length >= MIN_QUERY_LENGTH && !!contactState);
    const usersFound = !!searchResults.apiUsers.length || !!searchResults.localContacts.length;
    const contact = sortedLocalContacts.find((localContact) => localContact.id === manageContactId) || {};

    return (
      <Container inset={{ bottom: 0 }}>
        <SearchBlock
          headerProps={{ title: 'people' }}
          searchInputPlaceholder="Search or add new contact"
          onSearchChange={(q) => {
            this.setState({ query: q });
            onSearchChange(q);
          }}
          itemSearchState={contactState}
          navigation={navigation}
        />
        {!inSearchMode && !!pendingConnectionRequests &&
          <ConnectionRequestBanner
            onPress={onHandleConnectionsRequestBannerPress}
            underlayColor={baseColors.lightGray}
          >
            <React.Fragment>
              <ConnectionRequestBannerText>
                Connection requests
              </ConnectionRequestBannerText>
              <ConnectionRequestNotificationCircle>
                {pendingConnectionRequests}
              </ConnectionRequestNotificationCircle>
              <ConnectionRequestBannerIcon type="Entypo" name="chevron-thin-right" />
            </React.Fragment>
          </ConnectionRequestBanner>
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
          <FlatList
            data={sortedLocalContacts}
            keyExtractor={(item) => item.id}
            renderItem={this.renderContact}
            initialNumToRender={8}
            ItemSeparatorComponent={() => <Separator spaceOnLeft={82} />}
            onScroll={() => Keyboard.dismiss()}
            contentContainerStyle={{
              paddingVertical: spacing.rhythm,
              paddingTop: 0,
            }}
            refreshControl={
              <RefreshControl
                refreshing={false}
                onRefresh={() => {
                  fetchInviteNotifications();
                }}
              />
            }
          />
        }

        {(!inSearchMode || !searchResults.apiUsers.length) &&
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
                <EmptyStateBGWrapper>
                  <Image source={esBackground} />
                </EmptyStateBGWrapper>
                <EmptyStateParagraph
                  title="Nobody is here"
                  bodyText="Start building your connection list by inviting friends or by searching for someone"
                />
              </Wrapper>
            }
          </KeyboardAvoidingView>
        }
        <ConnectionConfirmationModal
          showConfirmationModal={showConfirmationModal}
          manageContactType={manageContactType}
          contact={contact}
          onConfirm={this.confirmManageAction}
          onModalHide={() => {
            this.setState({
              showConfirmationModal: false,
              forceHideRemoval: true,
            });
          }}
        />
      </Container>
    );
  }
}

export default PeopleScene;
