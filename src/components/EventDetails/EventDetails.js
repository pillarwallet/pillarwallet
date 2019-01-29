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
import { connect } from 'react-redux';
import isEqual from 'lodash.isequal';
import type { NavigationScreenProp } from 'react-navigation';
import { Linking } from 'react-native';
import styled from 'styled-components/native';
import { utils } from 'ethers';
import { BigNumber } from 'bignumber.js';
import { TX_DETAILS_URL } from 'react-native-dotenv';
import { format as formatDate, differenceInSeconds } from 'date-fns';
import type { Transaction } from 'models/Transaction';
import type { Asset } from 'models/Asset';
import { BaseText } from 'components/Typography';
import Button from 'components/Button';
import ListItemParagraph from 'components/ListItem/ListItemParagraph';
import ListItemUnderlined from 'components/ListItem';
import ProfileImage from 'components/ProfileImage';
import { spacing, baseColors, fontSizes, fontWeights } from 'utils/variables';
import { formatFullAmount } from 'utils/common';
import { createAlert } from 'utils/alerts';
import { updateTransactionStatusAction } from 'actions/historyActions';
import { getTxNoteByContactAction } from 'actions/txNoteActions';

// constants
import { TRANSACTION_EVENT, TX_PENDING_STATUS } from 'constants/historyConstants';
import {
  TYPE_RECEIVED,
  TYPE_ACCEPTED,
  TYPE_REJECTED,
  TYPE_SENT,
} from 'constants/invitationsConstants';
import { CONTACT, SEND_TOKEN_FROM_CONTACT_FLOW, CHAT } from 'constants/navigationConstants';

import EventHeader from './EventHeader';

type Props = {
  transaction: Transaction,
  contacts: Object[],
  wallet: Object,
  history: Object[],
  assets: Asset[],
  onClose: Function,
  onAccept: Function,
  onReject: Function,
  onCancel: Function,
  updateTransactionStatus: Function,
  navigation: NavigationScreenProp<*>,
  eventData: Object,
  eventType: string,
  eventStatus: string,
  txNotes: Object[],
  getTxNoteByContact: Function,
}

const ContentWrapper = styled.View`
  width: 100%;
`;

const EventBody = styled.View`
  padding: 0 ${spacing.mediumLarge}px 40px;
  background-color: ${baseColors.snowWhite};
`;

const EventProfileImage = styled(ProfileImage)`
`;

const ButtonsWrapper = styled.View`
  margin-top: 6px;
`;

const EventButton = styled(Button)`
  margin-top: 14px;
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
  margin: 0 10px 2px;
  text-align: center;
`;

const viewTransactionOnBlockchain = (hash: string) => {
  Linking.openURL(TX_DETAILS_URL + hash);
};

class EventDetails extends React.Component<Props, {}> {
  timer: ?IntervalID;
  timeout: ?TimeoutID;

  shouldComponentUpdate(nextProps: Props) {
    return !isEqual(this.props, nextProps);
  }

  componentDidMount() {
    const {
      eventType,
      eventData,
      updateTransactionStatus,
      getTxNoteByContact,
      contacts,
    } = this.props;

    if (eventType !== TRANSACTION_EVENT) return;

    if (contacts.find(contact => contact.username === eventData.username)
      && Object.keys(eventData.contact).length) {
      getTxNoteByContact(eventData.contact.username);
    }

    const txInfo = this.props.history.find(tx => tx.hash === eventData.hash) || {};
    if (txInfo.status !== TX_PENDING_STATUS) return;

    this.timeout = setTimeout(() => updateTransactionStatus(eventData.hash), 1000);
    this.timer = setInterval(() => updateTransactionStatus(eventData.hash), 10000);
  }

  componentWillUnmount() {
    if (this.timer) clearInterval(this.timer);
    if (this.timeout) clearTimeout(this.timeout);
  }

  componentDidUpdate() {
    const { eventType, eventData, history } = this.props;
    if (eventType !== TRANSACTION_EVENT || !this.timer) return;

    const txInfo = history.find(tx => tx.hash === eventData.hash) || {};
    if (txInfo.status !== TX_PENDING_STATUS && this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  handleAcceptConnection = () => {
    const { onClose, onAccept } = this.props;
    onClose();
    onAccept();
  };

  handleRejectConnection = (userData) => {
    const { onClose, onReject } = this.props;
    createAlert(TYPE_REJECTED, userData, () => {
      onClose();
      onReject();
    });
  };

  handleCancelConnection = () => {
    const { onClose, onCancel } = this.props;
    onClose();
    onCancel();
  };

  goToProfile = (contact = {}) => {
    if (!contact.username) return;
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
    navigation.navigate(CHAT, { username: contact.username });
  };

  renderEventBody = (eventType, eventStatus) => {
    const {
      eventData,
      contacts,
      wallet: { address: myAddress },
      onClose,
      history,
      txNotes,
      assets,
    } = this.props;
    let eventTime = formatDate(new Date(eventData.createdAt * 1000), 'MMMM D, YYYY HH:mm');
    if (eventType === TRANSACTION_EVENT) {
      const txInfo = history.find(tx => tx.hash === eventData.hash) || {};
      const {
        to,
        from,
        asset,
        hash,
        gasUsed,
        gasPrice,
        status,
        note,
      } = txInfo;

      const isReceived = to.toUpperCase() === myAddress.toUpperCase();
      let transactionNote = note;
      if (txNotes && txNotes.length > 0) {
        const txNote = txNotes.find(txn => txn.txHash === eventData.hash);
        if (txNote) {
          transactionNote = txNote.text;
        }
      }
      const hasNote = transactionNote && transactionNote !== '';
      const isPending = status === TX_PENDING_STATUS;
      const { decimals = 18 } = assets.find(({ symbol }) => symbol === asset) || {};
      const value = utils.formatUnits(new BigNumber(txInfo.value.toString()).toFixed(), decimals);
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

      const fee = gasUsed ? Math.round(gasUsed * gasPrice) : 0;

      return (
        <React.Fragment>
          <EventHeader
            eventType={TRANSACTION_EVENT}
            eventStatus={status}
            eventTime={eventTime}
            onClose={onClose}
          />
          <EventBody>
            <ListItemUnderlined
              label={isReceived ? 'AMOUNT RECEIVED' : 'AMOUNT SENT'}
              value={formatFullAmount(value)}
              valueAdditionalText={asset}
            />
            <ListItemUnderlined
              label={isReceived ? 'SENDER' : 'RECIPIENT'}
              value={relatedUserTitle}
              valueAddon={(!!relatedUser.username && <EventProfileImage
                uri={relatedUser.profileImage}
                userName={relatedUserTitle}
                diameter={40}
                initialsSize={fontSizes.extraSmall}
                style={{ marginBottom: 4 }}
                onPress={() => this.goToProfile(relatedUser)}
                noShadow
                borderWidth={0}
              />)}
            />
            {!isReceived && !isPending &&
            <ListItemUnderlined
              label="TRANSACTION FEE"
              value={utils.formatEther(fee.toString())}
              valueAdditionalText="ETH"
            />
            }
            {!!hasNote &&
            <ListItemParagraph
              label="NOTE"
              value={transactionNote}
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
              initialsSize={fontSizes.extraSmall}
              onPress={() => this.goToProfile(userData)}
              noShadow
              borderWidth={0}
            />
            <EventBodyTitle>
              @{userData.username}
            </EventBodyTitle>
          </EventRow>
          {eventStatus === TYPE_RECEIVED &&
          <ButtonsWrapper>
            <EventButton
              block
              title="Accept request"
              primaryInverted
              onPress={this.handleAcceptConnection}
            />
            <EventButton
              block
              title="Decline"
              dangerInverted
              onPress={() => {
                this.handleRejectConnection(userData);
              }}
            />
          </ButtonsWrapper>
          }
          {eventStatus === TYPE_SENT &&
          <ButtonsWrapper>
            <EventButton
              block
              title="Cancel request"
              dangerInverted
              onPress={this.handleCancelConnection}
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

const mapStateToProps = ({
  contacts: { data: contacts },
  wallet: { data: wallet },
  history: { data: history },
  txNotes: { data: txNotes },
  assets: { data: assets },
}) => ({
  contacts,
  wallet,
  history,
  txNotes,
  assets: Object.values(assets),
});

const mapDispatchToProps = (dispatch) => ({
  updateTransactionStatus: (hash) => dispatch(updateTransactionStatusAction(hash)),
  getTxNoteByContact: (username) => dispatch(getTxNoteByContactAction(username)),
});

export default connect(mapStateToProps, mapDispatchToProps)(EventDetails);
