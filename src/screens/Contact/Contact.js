// @flow
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
import { CHAT, SEND_TOKEN_FROM_CONTACT_FLOW } from 'constants/navigationConstants';
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
};

type State = {
  avatarRefreshed: boolean,
  showManageContactModal: boolean,
  showConfirmationModal: boolean,
  manageContactType: string,
};

class Contact extends React.Component<Props, State> {
  isComponentMounted: boolean = false;
  localContact: ?ApiUser;

  constructor(props: Props) {
    super(props);
    const { navigation, contacts, session } = this.props;
    const contact = navigation.getParam('contact', {});
    this.localContact = contacts.find(({ username }) => username === contact.username);
    const profileImage = this.localContact ? this.localContact.profileLargeImage : contact.profileLargeImage;
    this.state = {
      avatarRefreshed: !profileImage || !session.isOnline,
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
    } = this.props;
    this.isComponentMounted = true;

    const localContact = this.localContact; // eslint-disable-line
    if (localContact && session.isOnline) {
      syncContact(localContact.id);
      fetchContactTransactions(wallet.address, localContact.ethAddress);

      const defaultImageCacheManager = ImageCacheManager();

      if (localContact.profileImage) {
        defaultImageCacheManager
          .deleteUrl(localContact.profileImage, {
            useQueryParamsInCacheKey: true,
          })
          .catch(() => null);
      }

      if (localContact.profileLargeImage) {
        defaultImageCacheManager
          .deleteUrl(localContact.profileLargeImage, {
            useQueryParamsInCacheKey: true,
          })
          .then(() => this.isComponentMounted && this.setState({ avatarRefreshed: true }))
          .catch(() => null);
      }
    }
  }

  componentWillUnmount() {
    this.isComponentMounted = false;
  }

  getUserAvatar = (isAccepted, avatarRefreshed, displayContact) => {
    if (isAccepted) {
      if (avatarRefreshed && displayContact.profileLargeImage) {
        return `${displayContact.profileLargeImage}?t=${displayContact.lastUpdateTime || 0}`;
      }
      return undefined;
    }
    return displayContact.profileLargeImage;
  };

  getUnreadCount = (chats: Object[], username: string): number => {
    const userChat = chats.find(chat => chat.username === username) || {};
    const { unread = 0 } = userChat;
    return unread;
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

  render() {
    const {
      navigation,
      contacts,
      fetchContactTransactions,
      wallet,
      chats,
    } = this.props;
    const {
      avatarRefreshed,
      showManageContactModal,
      showConfirmationModal,
      manageContactType,
    } = this.state;

    const contact = navigation.getParam('contact', {});
    // NOTE: we need a fresh copy of the contact here as the avatar might be changed
    const localContact = contacts.find(({ username }) => username === contact.username);
    const isAccepted = !!localContact;
    const displayContact = localContact || contact;
    const userAvatar = this.getUserAvatar(isAccepted, avatarRefreshed, displayContact);
    const unreadCount = this.getUnreadCount(chats, displayContact.username);

    return (
      <Container inset={{ bottom: 0 }}>
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
