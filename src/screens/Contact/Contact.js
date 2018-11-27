// @flow
import * as React from 'react';
import { RefreshControl, Platform, View } from 'react-native';
import { connect } from 'react-redux';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { ImageCacheManager } from 'react-native-cached-image';
import { baseColors, fontSizes, UIColors } from 'utils/variables';
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

const iconSend = require('assets/icons/icon_send.png');
const iconChat = require('assets/icons/icon_chat.png');

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
  isOptionsModalActive: boolean,
  avatarRefreshed: boolean,
  scrollShadow: boolean,
};

class Contact extends React.Component<Props, State> {
  isComponentMounted: boolean = false;
  localContact: ?ApiUser;

  constructor(props: Props) {
    super(props);
    const { navigation, contacts, session } = this.props;
    const contact = navigation.getParam('contact', {});
    this.localContact = contacts.find(({ username }) => username === contact.username);
    const profileImage = this.localContact ? this.localContact.profileImage : contact.profileImage;
    this.state = {
      isOptionsModalActive: false,
      avatarRefreshed: !profileImage || !session.isOnline,
      scrollShadow: false,
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
      if (!localContact.profileImage) { return; }

      const defaultImageCacheManager = ImageCacheManager();
      defaultImageCacheManager
        .deleteUrl(localContact.profileImage, {
          useQueryParamsInCacheKey: true,
        })
        .then(() => this.isComponentMounted && this.setState({ avatarRefreshed: true }))
        .catch(() => null);
    }
  }

  componentWillUnmount() {
    this.isComponentMounted = false;
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
    const { isOptionsModalActive, avatarRefreshed, scrollShadow } = this.state;
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
          scrollShadow={scrollShadow}
          style={{
            backgroundColor: UIColors.defaultBackgroundColor,
            marginTop: 0,
            paddingTop: 20,
            height: 60,
          }}
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
          onScrollBeginDrag={() => {
            this.setState({ scrollShadow: true });
          }}
          onScrollEndDrag={(event: Object) => {
            this.setState({ scrollShadow: !!event.nativeEvent.contentOffset.y });
          }}
          onMomentumScrollEnd={(event: Object) => {
            this.setState({ scrollShadow: !!event.nativeEvent.contentOffset.y });
          }}
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
