// @flow
import * as React from 'react';
import { RefreshControl } from 'react-native';
import { connect } from 'react-redux';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { ImageCacheManager } from 'react-native-cached-image';
import { baseColors, fontSizes } from 'utils/variables';
import { syncContactAction } from 'actions/contactsActions';
import { fetchContactTransactionsAction } from 'actions/historyActions';
import { Container, Wrapper, ScrollWrapper } from 'components/Layout';
import { BoldText } from 'components/Typography';
import Button from 'components/Button';
import { CHAT, SEND_TOKEN_FROM_CONTACT_FLOW } from 'constants/navigationConstants';
import { TRANSACTIONS } from 'constants/activityConstants';
import SlideModal from 'components/Modals/SlideModal';
import Header from 'components/Header';
import ProfileImage from 'components/ProfileImage';
import CircleButton from 'components/CircleButton';
import ActivityFeed from 'components/ActivityFeed';
import type { ApiUser } from 'models/Contacts';

const ContactWrapper = styled.View`
  height: 250px;
  position: relative;
  justify-content: flex-end;
  margin: 5px 20px 20px;
  padding-top: 50px;
`;

const ContactHeader = styled.View`
  height: 200px;
  background: ${baseColors.cyan};
  shadow-color: ${baseColors.black};
  shadow-offset: 0 0;
  shadow-radius: 2px;
  shadow-opacity: 0.1;
  border-radius: 12px;
  align-items: center;
  position: relative;
  z-index: -1;
`;

const ContactHeaderBody = styled.View`
  height: 200px;
  justify-content: center;
  padding: 55px 16px;
`;

const ContactHeaderName = styled(BoldText)`
  font-size: ${fontSizes.extraExtraLarge};
  color: ${baseColors.white};
`;

const ContactHeaderAvatarWrapper = styled.View`
  height: 102px;
  width: 102px;
  position: absolute;
  top: 0;
  left: 50%;
  margin-left: -51px;
`;

type Props = {
  name: string,
  navigation: NavigationScreenProp<*>,
  contacts: ApiUser[],
  syncContact: Function,
  fetchContactTransactions: (walletAddress: string, contactAddress: string, asset?: string) => Function,
  wallet: Object,
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

  render() {
    const {
      navigation,
      contacts,
      fetchContactTransactions,
      wallet,
    } = this.props;
    const { isOptionsModalActive, avatarRefreshed } = this.state;
    const contact = navigation.getParam('contact', {});
    const localContact = contacts.find(({ username }) => username === contact.username);
    const isAccepted = !!localContact;
    const displayContact = localContact || contact;
    const userAvatar = avatarRefreshed ? displayContact.profileImage : undefined;
    return (
      <Container>
        <Header
          title="contact"
          onBack={() => navigation.goBack(null)}
          // onNextPress={this.openOptionsModal}
          // nextIcon="more"
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
            <ContactHeader>
              <ContactHeaderBody>
                <ContactHeaderName>{displayContact.username}</ContactHeaderName>
              </ContactHeaderBody>
            </ContactHeader>
            <ContactHeaderAvatarWrapper>
              <ProfileImage
                uri={userAvatar}
                userName={displayContact.username}
                diameter={96}
                borderWidth={3}
                initialsSize={fontSizes.extraExtraLarge}
                noShadow
              />
            </ContactHeaderAvatarWrapper>
          </ContactWrapper>
          <Wrapper center horizontal>
            {isAccepted && (
              <React.Fragment>
                <CircleButton
                  label="Send"
                  icon="send-asset"
                  onPress={() => navigation.navigate(SEND_TOKEN_FROM_CONTACT_FLOW, { contact: displayContact })}
                />
                <CircleButton
                  label="Chat"
                  icon="chat-filled"
                  onPress={() => navigation.navigate(CHAT, { contact: displayContact })}
                />
              </React.Fragment>
            )}
          </Wrapper>
          {isAccepted &&
          <ActivityFeed
            feedTitle="activity."
            navigation={navigation}
            activeTab={TRANSACTIONS}
            additionalFiltering={data => data.filter(({ username }) => username === displayContact.username)}
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
}) => ({
  contacts,
  wallet,
});

const mapDispatchToProps = (dispatch: Function) => ({
  syncContact: userId => dispatch(syncContactAction(userId)),
  fetchContactTransactions: (walletAddress, contactAddress) => {
    dispatch(fetchContactTransactionsAction(walletAddress, contactAddress));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(Contact);
