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
import { RefreshControl, Platform, View } from 'react-native';
import { connect } from 'react-redux';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { ImageCacheManager } from 'react-native-cached-image';
import { baseColors, fontSizes } from 'utils/variables';
import {
  syncContactAction,
  disconnectContactAction,
  muteContactAction,
  blockContactAction,
} from 'actions/contactsActions';
import { fetchContactTransactionsAction } from 'actions/historyActions';
import { Container, Wrapper, ScrollWrapper } from 'components/Layout';
import { CHAT, SEND_TOKEN_FROM_CONTACT_FLOW } from 'constants/navigationConstants';
import { DISCONNECT, MUTE, BLOCK } from 'constants/connectionsConstants';
import { TRANSACTIONS } from 'constants/activityConstants';
import Header from 'components/Header';
import ProfileImage from 'components/ProfileImage';
import CircleButton from 'components/CircleButton';
import ActivityFeed from 'components/ActivityFeed';
import type { ApiUser } from 'models/Contacts';
import { BaseText } from 'components/Typography';
import ConnectionConfirmationModal from './ConnectionConfirmationModal';
import ManageContactModal from './ManageContactModal';

const iconSend = require('assets/icons/icon_send.png');
const iconChat = require('assets/icons/icon_chat_contact.png');

const ContactWrapper = styled.View`
  position: relative;
  justify-content: center;
  align-items: center;
  margin: 5px 20px 20px;
  padding-top: ${Platform.select({
    ios: '20px',
    android: '14px',
  })};
`;

const CircleButtonsWrapper = styled(Wrapper)`
  margin-bottom: 35px;
  margin-top: ${Platform.select({
    ios: 0,
    android: '-20px',
  })}
`;

const BadgePlacer = styled.View`
  position: absolute;
  top: 21px;
  right: 14px;
  width: 22px;
  height: 22px;
  flex-direction: row;
`;

const ItemBadge = styled.View`
  height: 22px;
  width: 22px;
  border-width: 2px;
  border-color: ${baseColors.white}
  border-radius: 11px;
  background-color: ${baseColors.sunYellow}
  align-self: center;
`;

const UnreadCount = styled(BaseText)`
  color: ${baseColors.black};
  font-size: ${fontSizes.tiny};
  align-self: center;
  text-align: center;
  margin-top: 2px;
`;

type Props = {
  name: string,
  navigation: NavigationScreenProp<*>,
  contacts: ApiUser[],
  syncContact: Function,
  fetchContactTransactions: (walletAddress: string, contactAddress: string, asset?: string) => Function,
  wallet: Object,
  chats: Object[],
  session: Object,
  disconnectContact: Function,
  muteContact: Function,
  blockContact: Function,
};

type State = {
  showManageContactModal: boolean,
  showConfirmationModal: boolean,
  manageContactType: string,
};

class Contact extends React.Component<Props, State> {
  isComponentMounted: boolean = false;
  localContact: ?ApiUser;

  constructor(props: Props) {
    super(props);
    const { navigation, contacts } = this.props;
    const contact = navigation.getParam('contact', {});
    this.localContact = contacts.find(({ username }) => username === contact.username);
    this.state = {
      showManageContactModal: false,
      showConfirmationModal: false,
      manageContactType: '',
    };
  }

  componentDidMount() {
    const {
      fetchContactTransactions,
      wallet,
      syncContact,
      session,
      navigation,
    } = this.props;
    this.isComponentMounted = true;
    const contact = navigation.getParam('contact', {});
    const defaultImageCacheManager = ImageCacheManager();

    if (contact.profileImage && session.isOnline) {
      defaultImageCacheManager
        .deleteUrl(contact.profileImage, {
          useQueryParamsInCacheKey: true,
        })
        .catch(() => null);
      defaultImageCacheManager
        .deleteUrl(contact.profileLargeImage, {
          useQueryParamsInCacheKey: true,
        })
        .catch(() => null);
    }

    const localContact = this.localContact; // eslint-disable-line
    if (localContact && session.isOnline) {
      syncContact(localContact.id);
      fetchContactTransactions(wallet.address, localContact.ethAddress);
    }
  }

  componentWillUnmount() {
    this.isComponentMounted = false;
  }

  getUserAvatar = (isAccepted, url, updateTime) => {
    if (isAccepted && updateTime) {
      return `${url}?t=${updateTime}`;
    }
    return url;
  };

  getUnreadCount = (chats: Object[], username: string): number => {
    const userChat = chats.find(chat => chat.username === username) || {};
    const { unread = 0 } = userChat;
    return unread;
  };

  showManageContactModalTrigger = () => {
    this.setState({
      showManageContactModal: true,
    });
  };

  manageContact = (manageContactType: string) => {
    this.setState({
      showManageContactModal: false,
      manageContactType,
    });

    setTimeout(() => {
      this.setState({ showConfirmationModal: true });
    }, 1000);
  };

  confirmManageAction = (status: ?string = '') => {
    // here will be called the action to manageContactType (block, disconnect, mute)
    const { navigation, contacts } = this.props;
    const {
      manageContactType,
    } = this.state;

    const contact = navigation.getParam('contact', {});
    const theContact = contacts.find(({ username }) => username === contact.username);
    if (!theContact) {
      return;
    }
    if (manageContactType === DISCONNECT) {
      this.props.disconnectContact(theContact.id);
    } else if (manageContactType === MUTE) {
      const mute = !(status === 'muted');
      this.props.muteContact(theContact.id, mute);
    } else if (manageContactType === BLOCK) {
      const block = !(status === 'blocked');
      this.props.blockContact(theContact.id, block);
    }

    setTimeout(() => {
      this.setState({
        showConfirmationModal: false,
      });
    }, 1000);
  };

  render() {
    const {
      navigation,
      contacts,
      fetchContactTransactions,
      wallet,
      chats,
    } = this.props;
    const {
      showManageContactModal,
      showConfirmationModal,
      manageContactType,
    } = this.state;

    const contact = navigation.getParam('contact', {});
    // NOTE: we need a fresh copy of the contact here as the avatar might be changed
    const localContact = contacts.find(({ username }) => username === contact.username);
    const isAccepted = !!localContact;
    const displayContact = localContact || contact;

    // due to the fact that profileLargeImage is not being passed in connections notifications payload for now
    // profileImage is set here as a fallback so requester's avatar (if exists) would be visible
    const existingProfileImage = displayContact.profileLargeImage || displayContact.profileImage;
    const userAvatar = existingProfileImage
      ? this.getUserAvatar(isAccepted, existingProfileImage, displayContact.lastUpdateTime)
      : undefined;

    const unreadCount = this.getUnreadCount(chats, displayContact.username);

    return (
      <Container inset={{ bottom: 0 }}>
        <Header
          title={displayContact.username}
          onBack={() => navigation.goBack(null)}
          showRight
          onNextPress={this.showManageContactModalTrigger}
          nextIcon="more"
        />
        <ScrollWrapper
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => {
                fetchContactTransactions(wallet.address, displayContact.ethAddress);
              }}
            />
          }
        >
          <ContactWrapper>
            <ProfileImage
              uri={userAvatar}
              userName={displayContact.username}
              borderWidth={4}
              initialsSize={fontSizes.extraGiant}
              diameter={172}
              style={{ backgroundColor: baseColors.geyser }}
              imageUpdateTimeStamp={displayContact.lastUpdateTime}
            />
          </ContactWrapper>
          <CircleButtonsWrapper center horizontal>
            {isAccepted && (
              <React.Fragment>
                <View>
                  <CircleButton
                    label="Chat"
                    icon={iconChat}
                    onPress={() => navigation.navigate(CHAT, { username: displayContact.username })}
                  />
                  {!!unreadCount &&
                    <BadgePlacer>
                      <ItemBadge>
                        <UnreadCount>{unreadCount > 9 ? '9+' : unreadCount}</UnreadCount>
                      </ItemBadge>
                    </BadgePlacer>
                  }
                </View>
                <CircleButton
                  label="Send"
                  icon={iconSend}
                  onPress={() => navigation.navigate(SEND_TOKEN_FROM_CONTACT_FLOW, { contact: displayContact })}
                />
              </React.Fragment>
            )}
          </CircleButtonsWrapper>
          {isAccepted &&
          <ActivityFeed
            feedTitle="activity."
            navigation={navigation}
            activeTab={TRANSACTIONS}
            additionalFiltering={data => data.filter(({ username }) => username === displayContact.username)}
            showArrowsOnly
          />}
        </ScrollWrapper>
        <ManageContactModal
          showManageContactModal={showManageContactModal}
          onManageContact={this.manageContact}
          onModalHide={() => {
            this.setState({ showManageContactModal: false });
          }}
          contactStatus={displayContact.status}
        />
        <ConnectionConfirmationModal
          showConfirmationModal={showConfirmationModal}
          manageContactType={manageContactType}
          contact={displayContact}
          onConfirm={() => { this.confirmManageAction(displayContact.status); }}
          onModalHide={() => {
            this.setState({ showConfirmationModal: false });
          }}
        />
      </Container>
    );
  }
}

const mapStateToProps = ({
  contacts: { data: contacts },
  wallet: { data: wallet },
  chat: { data: { chats } },
  session: { data: session },
}) => ({
  contacts,
  wallet,
  chats,
  session,
});

const mapDispatchToProps = (dispatch: Function) => ({
  syncContact: userId => dispatch(syncContactAction(userId)),
  fetchContactTransactions: (walletAddress, contactAddress) => {
    dispatch(fetchContactTransactionsAction(walletAddress, contactAddress));
  },
  disconnectContact: (contactId: string) => dispatch(disconnectContactAction(contactId)),
  muteContact: (contactId: string, mute: boolean) => dispatch(muteContactAction(contactId, mute)),
  blockContact: (contactId: string, block: boolean) => dispatch(blockContactAction(contactId, block)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Contact);
