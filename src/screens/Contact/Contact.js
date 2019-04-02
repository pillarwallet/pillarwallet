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
import { syncContactAction } from 'actions/contactsActions';
import { fetchContactTransactionsAction } from 'actions/historyActions';
import { Container, Wrapper, ScrollWrapper } from 'components/Layout';
import { SEND_TOKEN_FROM_CONTACT_FLOW } from 'constants/navigationConstants';
import { TRANSACTIONS } from 'constants/activityConstants';
import { CHAT, ACTIVITY } from 'constants/tabsConstants';
import Header from 'components/Header';
import ProfileImage from 'components/ProfileImage';
import CircleButton from 'components/CircleButton';
import ActivityFeed from 'components/ActivityFeed';
import BottomSheet from 'components/BottomSheet';
import ChatTab from 'components/ChatTab';
import Tabs from 'components/Tabs';
import type { ApiUser } from 'models/Contacts';
import ConnectionConfirmationModal from './ConnectionConfirmationModal';
import ManageContactModal from './ManageContactModal';

const iconSend = require('assets/icons/icon_send.png');

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

type Props = {
  name: string,
  navigation: NavigationScreenProp<*>,
  contacts: ApiUser[],
  syncContact: Function,
  fetchContactTransactions: (walletAddress: string, contactAddress: string, asset?: string) => Function,
  wallet: Object,
  chats: Object[],
  session: Object,
};

type State = {
  showManageContactModal: boolean,
  showConfirmationModal: boolean,
  manageContactType: string,
  activeTab: string,
  isSheetOpen: boolean,
  screenHeight: number,
  chatHeight: number,
};

class Contact extends React.Component<Props, State> {
  isComponentMounted: boolean = false;
  localContact: ?ApiUser;
  activityFeedRef: ?Object;

  constructor(props: Props) {
    super(props);
    const { navigation, contacts } = this.props;
    this.activityFeedRef = React.createRef();
    const contactName = navigation.getParam('username', '');
    const shouldOpenSheet = navigation.getParam('chatTabOpen', false);
    const contact = navigation.getParam('contact', { username: contactName });
    this.localContact = contacts.find(({ username }) => username === contact.username);
    this.state = {
      showManageContactModal: false,
      showConfirmationModal: false,
      manageContactType: '',
      screenHeight: 0,
      chatHeight: 0,
      activeTab: 'CHAT',
      isSheetOpen: shouldOpenSheet,
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
    const contactName = navigation.getParam('username', '');
    const contact = navigation.getParam('contact', { username: contactName });
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

  manageContact = (manageContactType: string) => {
    this.setState({
      showManageContactModal: false,
      manageContactType,
    });

    setTimeout(() => {
      this.setState({ showConfirmationModal: true });
    }, 1000);
  };

  confirmManageAction = () => {
    this.setState({
      showConfirmationModal: false,
    });
  };

  setActiveTab = (activeTab) => {
    this.setState({ activeTab });
  };

  handleSheetOpen = () => {
    this.setState({ isSheetOpen: true });
  };

  renderSheetContent = (displayContact) => {
    const { activeTab, isSheetOpen, chatHeight } = this.state;
    const { navigation } = this.props;
    if (activeTab === ACTIVITY) {
      return (
        <ActivityFeed
          ref={(ref) => { this.activityFeedRef = ref; }}
          navigation={navigation}
          activeTab={TRANSACTIONS}
          additionalFiltering={data => data.filter(({ username }) => username === displayContact.username)}
          showArrowsOnly
          contentContainerStyle={{ paddingTop: 20 }}
        />
      );
    }
    return (
      <ChatTab
        height={chatHeight}
        contact={displayContact}
        isOpen={activeTab === CHAT && isSheetOpen}
        navigation={navigation}
      />
    );
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
      screenHeight,
      activeTab,
      isSheetOpen,
    } = this.state;

    const contactName = navigation.getParam('username', '');
    const contact = navigation.getParam('contact', { username: contactName });
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

    const chatInfo = chats.find(chat => chat.username === displayContact.username) || {};

    const contactTabs = [
      {
        id: CHAT,
        name: 'Chat',
        onPress: () => this.setActiveTab(CHAT),
        unread: chatInfo.unread,
      },
      {
        id: ACTIVITY,
        name: 'Activity',
        onPress: () => this.setActiveTab(ACTIVITY),
      },
    ];

    return (
      <Container
        inset={{ bottom: 0 }}
        onLayout={(event) => {
          this.setState({ screenHeight: event.nativeEvent.layout.height });
        }}
      >
        <Header
          title={displayContact.username}
          onBack={() => navigation.goBack(null)}
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
                <CircleButton
                  label="Send"
                  icon={iconSend}
                  onPress={() => navigation.navigate(SEND_TOKEN_FROM_CONTACT_FLOW, { contact: displayContact })}
                />
              </React.Fragment>
            )}
          </CircleButtonsWrapper>
        </ScrollWrapper>
        {isAccepted && !!screenHeight &&
        <BottomSheet
          forceOpen={isSheetOpen}
          initialSheetHeight={250}
          swipeToCloseHeight={62}
          // scrollingComponentsRefs={[this.activityFeedRef]}
          screenHeight={screenHeight}
          onSheetOpen={this.handleSheetOpen}
          onSheetClose={() => { this.setState({ isSheetOpen: false }); }}
          // sheetWrapperStyle={{ marginTop: 38 }}
          onAnimate={(pos) => {
            const chatHeight = screenHeight - pos - 68;
            this.setState({ chatHeight });
          }}
          animateHeight={activeTab === CHAT}
          floatingHeaderContent={(<Tabs
            initialActiveTab={activeTab}
            tabs={contactTabs}
            wrapperStyle={{
              position: 'absolute',
              top: 8,
              left: 0,
              zIndex: 2,
              width: '100%',
            }}
          />)}
        >
          <View style={{ paddingTop: 30, flex: 1 }}>
            {this.renderSheetContent(displayContact)}
          </View>
        </BottomSheet>
        }
        <ManageContactModal
          showManageContactModal={showManageContactModal}
          onManageContact={this.manageContact}
          onModalHide={() => {
            this.setState({ showManageContactModal: false });
          }}
        />
        <ConnectionConfirmationModal
          showConfirmationModal={showConfirmationModal}
          manageContactType={manageContactType}
          contact={contact}
          onConfirm={this.confirmManageAction}
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
});

export default connect(mapStateToProps, mapDispatchToProps)(Contact);
