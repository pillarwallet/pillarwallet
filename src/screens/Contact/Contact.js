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
import Button from 'components/Button';
import { CHAT, SEND_TOKEN_FROM_CONTACT_FLOW } from 'constants/navigationConstants';
import { TRANSACTIONS } from 'constants/activityConstants';
import SlideModal from 'components/Modals/SlideModal';
import Header from 'components/Header';
import ProfileImage from 'components/ProfileImage';
import CircleButton from 'components/CircleButton';
import ActivityFeed from 'components/ActivityFeed';
import type { ApiUser } from 'models/Contacts';
import { BaseText } from 'components/Typography';

const ContactWrapper = styled.View`
  position: relative;
  justify-content: center;
  align-items: center;
  margin: 5px 20px 20px;
  padding-top: 20px;
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
};

type State = {
  isOptionsModalActive: boolean,
  avatarRefreshed: boolean,
};

class Contact extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    const { navigation } = this.props;
    const contact = navigation.getParam('contact', {});
    this.state = {
      isOptionsModalActive: false,
      avatarRefreshed: !contact.profileImage,
    };
  }

  componentDidMount() {
    const {
      fetchContactTransactions,
      wallet,
      navigation,
      contacts,
      syncContact,
    } = this.props;
    const contact = navigation.getParam('contact', {});

    const localContact = contacts.find(({ username }) => username === contact.username);
    if (localContact) {
      syncContact(localContact.id);
      if (localContact.profileImage) {
        const defaultImageCacheManager = ImageCacheManager();
        defaultImageCacheManager
          .deleteUrl(localContact.profileImage)
          .then(() => this.setState({ avatarRefreshed: true }))
          .catch(() => null);
      }
      fetchContactTransactions(wallet.address, localContact.ethAddress);
    }
  }

  openOptionsModal = () => {
    this.setState({
      isOptionsModalActive: true,
    });
  };

  closeOptionsModal = () => {
    this.setState({
      isOptionsModalActive: false,
    });
  };

  getUserAvatar = (isAccepted, avatarRefreshed, displayContact) => {
    if (isAccepted) {
      if (avatarRefreshed) return displayContact.profileImage;
      return undefined;
    }
    return displayContact.profileImage;
  };

  getUnreadCount = (chats: Object[], username: string): number => {
    const userChat = chats.find(chat => chat.username === username) || {};
    const { unread = 0 } = userChat;
    return unread;
  };

  render() {
    const {
      navigation,
      contacts,
      fetchContactTransactions,
      wallet,
      chats,
    } = this.props;
    const { isOptionsModalActive, avatarRefreshed } = this.state;
    const contact = navigation.getParam('contact', {});
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
            />
          </ContactWrapper>
          <CircleButtonsWrapper center horizontal>
            {isAccepted && (
              <React.Fragment>
                <View>
                  <CircleButton
                    label="Chat"
                    icon="chat-filled"
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
                  icon="send-asset"
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
        <SlideModal title="manage" isVisible={isOptionsModalActive} onModalHide={this.closeOptionsModal}>
          <Button secondary block marginBottom="10px" onPress={() => {}} title="Mute" />
          <Button secondary block marginBottom="10px" onPress={() => {}} title="Remove connection" />
          <Button secondary danger block marginBottom="10px" onPress={() => {}} title="Report / Block" />
        </SlideModal>
      </Container>
    );
  }
}

const mapStateToProps = ({
  contacts: { data: contacts },
  wallet: { data: wallet },
  chat: { data: { chats } },
}) => ({
  contacts,
  wallet,
  chats,
});

const mapDispatchToProps = (dispatch: Function) => ({
  syncContact: userId => dispatch(syncContactAction(userId)),
  fetchContactTransactions: (walletAddress, contactAddress) => {
    dispatch(fetchContactTransactionsAction(walletAddress, contactAddress));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(Contact);
