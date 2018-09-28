// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import { Linking } from 'react-native';
import styled from 'styled-components/native';
import { utils } from 'ethers';
import { TX_DETAILS_URL } from 'react-native-dotenv';
import { format as formatDate, differenceInSeconds } from 'date-fns';
import type { Transaction } from 'models/Transaction';
import { BaseText, BoldText } from 'components/Typography';
import { spacing, baseColors, fontSizes, fontWeights } from 'utils/variables';
import Button from 'components/Button';
import { formatFullAmount } from 'utils/common';
import ListItemUnderlined from 'components/ListItem';
import ProfileImage from 'components/ProfileImage';

// constants
import { TRANSACTION_EVENT } from 'constants/historyConstants';
import {
  TYPE_RECEIVED,
  TYPE_ACCEPTED,
  TYPE_SENT,
} from 'constants/invitationsConstants';
import {
  cancelInvitationAction,
  acceptInvitationAction,
  rejectInvitationAction,
} from 'actions/invitationsActions';
import { CONTACT, SEND_TOKEN_FROM_CONTACT_FLOW, CHAT } from 'constants/navigationConstants';

import EventHeader from './EventHeader';

type Props = {
  transaction: Transaction,
  contacts: Object[],
  wallet: Object,
  onClose: Function,
  acceptInvitation: Function,
  rejectInvitation: Function,
  cancelInvitation: Function,
  navigation: NavigationScreenProp<*>,
  eventData: Object,
  eventType: string,
  eventStatus: string,
}

const ContentWrapper = styled.View`
  width: 100%;
`;

const EventBody = styled.View`
  padding: 0 ${spacing.mediumLarge}px 40px;
  background-color: ${baseColors.snowWhite};
`;

const EventProfileImage = styled(ProfileImage)`
  margin-right: 10px;
`;

const ButtonsWrapper = styled.View`
  margin-top: 6px;
`;

const EventButton = styled(Button)`
  margin-top: 14px;
`;

const Confirmations = styled(BoldText)`
  font-size: ${fontSizes.large}px;
  font-weight: ${fontWeights.bold};
  margin-bottom: ${spacing.medium}px;
  margin-right: 4px;
  color: ${baseColors.burningFire};
`;

const EventRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  margin-top: 32px;
  margin-bottom: 8px;
  flex-wrap: wrap;
`;

const EventBodyTitle = styled(BaseText)`
  font-size: ${fontSizes.large}px;
  font-weight: ${fontWeights.medium};
  color: ${props => props.color ? props.color : baseColors.slateBlack};
  margin: 0 2px 2px;
  text-align: center;
`;

const viewTransactionOnBlockchain = (hash: string) => {
  Linking.openURL(TX_DETAILS_URL + hash);
};

class EventDetails extends React.Component<Props, {}> {
  handleAcceptConnection = (eventData) => {
    const { acceptInvitation, onClose } = this.props;
    acceptInvitation(eventData);
    onClose();
  };

  handleRejectConnection = (eventData) => {
    const { rejectInvitation, onClose } = this.props;
    rejectInvitation(eventData);
    onClose();
  };

  handleCancelConnection = (eventData) => {
    const { cancelInvitation, onClose } = this.props;
    cancelInvitation(eventData);
    onClose();
  };

  goToProfile = (contact) => {
    const {
      navigation,
      onClose,
    } = this.props;
    onClose();
    navigation.navigate(CONTACT, { contact });
  };

  sendTokensToUser = (contact) => {
    const {
      navigation,
      onClose,
    } = this.props;
    onClose();
    navigation.navigate(SEND_TOKEN_FROM_CONTACT_FLOW, { contact });
  };

  goToChatWithUser = (contact) => {
    const {
      navigation,
      onClose,
    } = this.props;
    onClose();
    navigation.navigate(CHAT, { contact });
  };

  renderEventBody = (eventType, eventStatus) => {
    const {
      eventData,
      contacts,
      wallet: { address: myAddress },
      onClose,
    } = this.props;
    let eventTime = formatDate(new Date(eventData.createdAt * 1000), 'MMMM D, YYYY HH:MM');
    if (eventType === TRANSACTION_EVENT) {
      const {
        to,
        from,
        asset,
        nbConfirmations,
        hash,
        gasUsed,
        gasPrice,
        value,
      } = eventData;

      const isReceived = to.toUpperCase() === myAddress.toUpperCase();
      const isPending = eventStatus === 'pending';
      const recipientContact = contacts.find(({ ethAddress }) => to.toUpperCase() === ethAddress.toUpperCase()) || {};
      const senderContact = contacts.find(({ ethAddress }) => from.toUpperCase() === ethAddress.toUpperCase()) || {};
      const relatedUser = isReceived ? senderContact : recipientContact;
      const relatedUserTitle = relatedUser.username || (isReceived
        ? `${from.slice(0, 7)}…${from.slice(-7)}`
        : `${to.slice(0, 7)}…${to.slice(-7)}`);

      if (isPending) {
        const pendingTimeInSeconds = differenceInSeconds(new Date(), new Date(eventData.createdAt * 1000));
        const ph = Math.floor(pendingTimeInSeconds / 3600);
        const pm = Math.floor((pendingTimeInSeconds % 3600) / 60);
        const ps = Math.floor((pendingTimeInSeconds % 3600) % 60);

        const pendingHours = ph > 0 ? `${ph} H ` : '';
        const pendingMinutes = pm > 0 ? `${pm} MIN ` : '';
        const pendingSeconds = ps > 0 ? `${ps} SEC` : '';

        eventTime = `${pendingHours}${pendingMinutes}${pendingSeconds} AGO`;
      }

      const amount = `${formatFullAmount(value)} ${asset}`;
      const fee = gasUsed ? Math.round(gasUsed * gasPrice) : 0;

      return (
        <React.Fragment>
          <EventHeader
            eventType={TRANSACTION_EVENT}
            eventStatus={eventStatus}
            eventTime={eventTime}
            onClose={onClose}
          />
          <EventBody>
            <ListItemUnderlined
              label={isReceived ? 'AMOUNT RECEIVED' : 'AMOUNT SENT'}
              value={amount}
            />
            <ListItemUnderlined
              label={isReceived ? 'SENDER' : 'RECIPIENT'}
              value={relatedUserTitle}
              valueAddon={(<EventProfileImage
                uri={relatedUser.profileImage}
                userName={relatedUserTitle}
                diameter={40}
                style={{ marginBottom: 6 }}
                onPress={() => this.goToProfile(relatedUser)}
              />)}
            />
            {!isReceived &&
            <ListItemUnderlined
              label="TRANSACTION FEE"
              value={`${utils.formatEther(fee.toString())} ETH`}
            />
            }
            {isPending &&
            <ListItemUnderlined
              label="CONFIRMATIONS"
              valueAddon={(<Confirmations>{nbConfirmations}</Confirmations>)}
              value="of 6"
            />
            }
            <ButtonsWrapper>
              <EventButton
                block
                title="View on the blockchain"
                primaryInverted
                onPress={() => viewTransactionOnBlockchain(hash)}
              />
            </ButtonsWrapper>
          </EventBody>
        </React.Fragment>
      );
    }

    const userData = {
      username: eventData.username,
      name: eventData.firstName,
      lastName: eventData.lastName,
      profileImage: eventData.profileImage,
      ethAddress: eventData.ethAddress,
    };

    return (
      <React.Fragment>
        <EventHeader
          eventType={eventType}
          eventStatus={eventStatus}
          eventTime={eventTime}
          onClose={onClose}
        />
        <EventBody>
          <EventRow>
            <EventProfileImage
              uri={userData.profileImage}
              userName={userData.username}
              diameter={40}
              onPress={() => this.goToProfile(userData)}
            />
            <EventBodyTitle>
              @{userData.username}
            </EventBodyTitle>
            {!!userData.name &&
            <EventBodyTitle color={baseColors.coolGrey}>
              ({userData.name} {userData.lastName})
            </EventBodyTitle>}
          </EventRow>
          {eventStatus === TYPE_RECEIVED &&
          <ButtonsWrapper>
            <EventButton
              block
              title="Accept request"
              primaryInverted
              onPress={() => { this.handleAcceptConnection(eventData); }}
            />
            <EventButton
              block
              title="Decline"
              dangerInverted
              onPress={() => { this.handleRejectConnection(eventData); }}
            />
          </ButtonsWrapper>
          }
          {eventStatus === TYPE_SENT &&
          <ButtonsWrapper>
            <EventButton
              block
              title="Cancel request"
              dangerInverted
              onPress={() => { this.handleCancelConnection(eventData); }}
            />
          </ButtonsWrapper>
          }
          {eventStatus === TYPE_ACCEPTED &&
          <ButtonsWrapper>
            <EventButton block title="Send tokens" primaryInverted onPress={() => this.sendTokensToUser(userData)} />
            <EventButton block title="Send message" primaryInverted onPress={() => this.goToChatWithUser(userData)} />
          </ButtonsWrapper>
          }
        </EventBody>
      </React.Fragment>
    );
  };

  render() {
    const { eventType, eventStatus } = this.props;

    return (
      <ContentWrapper>
        {this.renderEventBody(eventType, eventStatus)}
      </ContentWrapper>
    );
  }
}

const mapDispatchToProps = (dispatch) => ({
  cancelInvitation: (invitation) => dispatch(cancelInvitationAction(invitation)),
  acceptInvitation: (invitation) => dispatch(acceptInvitationAction(invitation)),
  rejectInvitation: (invitation) => dispatch(rejectInvitationAction(invitation)),
});

const mapStateToProps = ({
  contacts: { data: contacts },
  wallet: { data: wallet },
}) => ({
  contacts,
  wallet,
});

export default connect(mapStateToProps, mapDispatchToProps)(EventDetails);
