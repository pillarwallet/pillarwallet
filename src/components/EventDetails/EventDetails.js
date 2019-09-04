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
import { TX_DETAILS_URL } from 'react-native-dotenv';
import { format as formatDate, differenceInSeconds } from 'date-fns';
import { createStructuredSelector } from 'reselect';
import isEmpty from 'lodash.isempty';

// models
import type { Transaction } from 'models/Transaction';
import type { Asset } from 'models/Asset';
import type { GasInfo } from 'models/GasInfo';
import type { ApiUser, ContactSmartAddressData } from 'models/Contacts';
import type { Accounts } from 'models/Account';

// components
import { BaseText, BoldText } from 'components/Typography';
import Button from 'components/Button';
import ListItemParagraph from 'components/ListItem/ListItemParagraph';
import ListItemUnderlined from 'components/ListItem';
import ProfileImage from 'components/ProfileImage';
import { Wrapper } from 'components/Layout';

// utils
import { spacing, baseColors, fontSizes, fontWeights } from 'utils/variables';
import {
  formatFullAmount,
  noop,
  formatUnits,
  formatAmount,
} from 'utils/common';
import { createAlert } from 'utils/alerts';
import { addressesEqual } from 'utils/assets';
import {
  checkIfSmartWalletAccount,
  findAccountByAddress,
  getAccountAddress,
  getAccountName,
  getActiveAccount,
  getInactiveUserAccounts,
} from 'utils/accounts';
import { findMatchingContact } from 'utils/contacts';
import { calculateGasEstimate } from 'services/assets';

// actions
import { fetchGasInfoAction, updateTransactionStatusAction } from 'actions/historyActions';
import { getTxNoteByContactAction } from 'actions/txNoteActions';
import { speedUpTransactionAction } from 'actions/assetsActions';

// constants
import { TRANSACTION_EVENT, TX_PENDING_STATUS } from 'constants/historyConstants';
import {
  TYPE_RECEIVED,
  TYPE_ACCEPTED,
  TYPE_REJECTED,
  TYPE_SENT,
} from 'constants/invitationsConstants';
import {
  CONTACT,
  SEND_TOKEN_FROM_CONTACT_FLOW,
  COLLECTIBLE,
  CHAT,
} from 'constants/navigationConstants';
import { COLLECTIBLE_TRANSACTION, COLLECTIBLE_SENT, COLLECTIBLE_RECEIVED } from 'constants/collectiblesConstants';
import { PAYMENT_NETWORK_ACCOUNT_TOPUP, PAYMENT_NETWORK_TX_SETTLEMENT } from 'constants/paymentNetworkConstants';
import { SPEED_TYPES } from 'constants/assetsConstants';

// selectors
import { accountHistorySelector } from 'selectors/history';
import { activeAccountAddressSelector } from 'selectors';

// local components
import EventHeader from './EventHeader';

type Props = {
  transaction: Transaction,
  contacts: ApiUser[],
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
  activeAccountAddress: string,
  speedUpTransaction: Function,
  gasInfo: GasInfo,
  fetchGasInfo: Function,
  session: Object,
  contactsSmartAddresses: ContactSmartAddressData[],
  accounts: Accounts,
}

type State = {
  gasLimit: number,
  showSpeedUp: boolean,
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

const speedMultipliers = [1, 3, 5];

class EventDetails extends React.Component<Props, State> {
  timer: ?IntervalID;
  timeout: ?TimeoutID;
  // HACK: we need to cache the tx data for smart wallet migration process
  cachedTxInfo = {};
  state = {
    gasLimit: 0,
    showSpeedUp: false,
  };

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    return !isEqual(this.props, nextProps) || this.state.gasLimit !== nextState.gasLimit;
  }

  componentDidMount() {
    const {
      eventType,
      eventData,
      updateTransactionStatus,
      getTxNoteByContact,
      contacts,
      fetchGasInfo,
      accounts,
      assets,
    } = this.props;

    if (eventType !== TRANSACTION_EVENT) return;

    if (contacts.find(contact => contact.username === eventData.username)
      && Object.keys(eventData.contact).length) {
      getTxNoteByContact(eventData.contact.username);
    }

    const txInfo = this.props.history.find(tx => tx.hash === eventData.hash) || {};
    if (txInfo.status !== TX_PENDING_STATUS) return;

    const activeAccount = getActiveAccount(accounts);
    if (activeAccount && !checkIfSmartWalletAccount(activeAccount)) {
      // TODO: add support for smart wallet sdk transactions speed up
      const activeAccountAddress = getAccountAddress(activeAccount);
      if (addressesEqual(txInfo.from, activeAccountAddress)) {
        const {
          symbol: assetSymbol,
          decimals,
          address: contractAddress,
        } = assets.find(({ symbol }) => symbol === assetSymbol) || {};
        const amount = formatUnits(txInfo.value, decimals);
        calculateGasEstimate({
          from: activeAccountAddress,
          to: txInfo.to,
          amount,
          assetSymbol,
          contractAddress,
          decimals,
        })
          .then(gasLimit => this.setState({ gasLimit, showSpeedUp: gasLimit !== 0 }))
          .catch(() => null);
      }
    }

    fetchGasInfo();
    this.timeout = setTimeout(() => updateTransactionStatus(eventData.hash), 500);
    this.timer = setInterval(() => updateTransactionStatus(eventData.hash), 10000);
  }

  componentWillUnmount() {
    if (this.timer) clearInterval(this.timer);
    if (this.timeout) clearTimeout(this.timeout);
  }

  componentDidUpdate(prevProps: Props) {
    const {
      eventType,
      eventData,
      history,
      fetchGasInfo,
      session,
    } = this.props;
    if (eventType !== TRANSACTION_EVENT) return;

    const txInfo = history.find(tx => tx.hash === eventData.hash) || {};

    if (!this.timer && txInfo.status !== TX_PENDING_STATUS) return;

    if (prevProps.session.isOnline !== session.isOnline && session.isOnline) {
      fetchGasInfo();
    }

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

  goToCollectible = (assetData = {}) => {
    const {
      navigation,
      onClose,
    } = this.props;
    onClose();
    navigation.navigate(COLLECTIBLE, { assetData });
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

  onSelectSpeedPress = (gasPrice) => {
    const {
      eventData: { hash },
      speedUpTransaction,
      onClose,
    } = this.props;
    const { gasLimit } = this.state;
    if (onClose) onClose();
    speedUpTransaction(hash, gasPrice, gasLimit);
  };

  findMatchingContactOrAccount = (address) => {
    const {
      contacts,
      contactsSmartAddresses = [],
      accounts,
    } = this.props;
    const inactiveAccounts = getInactiveUserAccounts(accounts);
    return findMatchingContact(address, contacts, contactsSmartAddresses)
      || findAccountByAddress(address, inactiveAccounts)
      || {};
  };

  renderSpeedUpOptions = (gasLimit) => {
    const { gasInfo } = this.props;
    const fastSpeedGasPrice = (gasInfo && gasInfo.gasPrice[SPEED_TYPES.FAST]) || 0;
    return (
      <ListItemUnderlined
        label="SPEED UP TRANSACTION"
        autoHeight
        noRightPadding
        valueAddon={
          <Wrapper
            style={{
              width: '100%',
              paddingTop: 10,
              paddingBottom: 5,
              flexDirection: 'column',
            }}
          >
            {speedMultipliers.map(multiplier => {
              const newGasPrice = fastSpeedGasPrice * multiplier;
              const gasPriceWei = utils.parseUnits(newGasPrice.toString(), 'gwei');
              const gasPriceEth = formatAmount(utils.formatEther(gasPriceWei.mul(gasLimit)));
              return (
                <Button
                  key={multiplier}
                  title={`${gasPriceEth} ETH`}
                  onPress={() => this.onSelectSpeedPress(newGasPrice)}
                  small
                  primaryInverted
                  style={{ marginBottom: 5 }}
                />
              );
            })}
          </Wrapper>
        }
      />
    );
  };

  renderEventBody = (eventType, eventStatus) => {
    const {
      eventData,
      activeAccountAddress,
      onClose,
      history,
      txNotes,
      assets,
      contacts,
      contactsSmartAddresses = [],
    } = this.props;
    const { gasLimit, showSpeedUp } = this.state;
    let eventTime = formatDate(new Date(eventData.createdAt * 1000), 'MMMM D, YYYY HH:mm');
    if (eventType === TRANSACTION_EVENT) {
      let txInfo = history.find(tx => tx.hash === eventData.hash);
      if (!txInfo) {
        txInfo = this.cachedTxInfo || {};
      } else {
        this.cachedTxInfo = txInfo;
      }
      const {
        to,
        from,
        asset: assetSymbol,
        hash,
        gasUsed,
        gasPrice,
        status,
        note,
        isPPNTransaction,
        tag,
        extra,
      } = txInfo;

      const isReceived = addressesEqual(to, activeAccountAddress);
      const toMyself = isReceived && addressesEqual(from, to);
      let transactionNote = note;
      if (txNotes && txNotes.length > 0) {
        const txNote = txNotes.find(txn => txn.txHash === eventData.hash);
        if (txNote) {
          transactionNote = txNote.text;
        }
      }
      const hasNote = transactionNote && transactionNote !== '';
      const isPending = status === TX_PENDING_STATUS;
      const { decimals = 18 } = assets.find(({ symbol }) => symbol === assetSymbol) || {};
      const value = formatUnits(txInfo.value, decimals);
      const recipientContact = findMatchingContact(to, contacts, contactsSmartAddresses) || {};
      // apply to wallet accounts only if received from other account address
      const senderContact = this.findMatchingContactOrAccount(from);
      const relatedUser = isReceived ? senderContact : recipientContact;
      // $FlowFixMe
      const relatedUserTitle = relatedUser.username || getAccountName(relatedUser.type) || (isReceived
        ? `${from.slice(0, 7)}…${from.slice(-7)}`
        : `${to.slice(0, 7)}…${to.slice(-7)}`);
      const relatedUserProfileImage = relatedUser.profileImage || null;
      // $FlowFixMe
      const showProfileImage = !relatedUser.type;

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

      const fee = gasUsed && gasPrice ? Math.round(gasUsed * gasPrice) : 0;
      const freeTx = isPPNTransaction;
      let showAmountReceived = true;
      let showSender = true;
      let showNote = true;
      let showViewOnBlockchain = true;
      let showAmountTxType = false;
      let txType = '';
      const listSettledAssets = (tag === PAYMENT_NETWORK_TX_SETTLEMENT && !isEmpty(extra));

      if (tag === PAYMENT_NETWORK_TX_SETTLEMENT) {
        showAmountReceived = false;
        showSender = false;
        showNote = false;
        showAmountTxType = true;
        txType = 'PLR Network settle';
      } else if (tag === PAYMENT_NETWORK_ACCOUNT_TOPUP) {
        showSender = false;
        showNote = false;
        showAmountTxType = true;
        txType = 'TANK TOP UP';
      }

      if (isPPNTransaction) {
        showViewOnBlockchain = false;
      }

      return (
        <React.Fragment>
          <EventHeader
            eventType={TRANSACTION_EVENT}
            eventStatus={status}
            eventTime={eventTime}
            onClose={onClose}
          />
          <EventBody>
            {showAmountReceived &&
            <ListItemUnderlined
              label={isReceived ? 'AMOUNT RECEIVED' : 'AMOUNT SENT'}
              value={formatFullAmount(value)}
              valueAdditionalText={assetSymbol}
            />
            }
            {showAmountTxType &&
            <ListItemUnderlined
              label="TRANSACTION TYPE"
              value={txType}
            />
            }
            {showSender &&
            <ListItemUnderlined
              label={isReceived ? 'SENDER' : 'RECIPIENT'}
              value={relatedUserTitle}
              valueAddon={(!!relatedUser.username && <EventProfileImage
                uri={relatedUserProfileImage}
                showProfileImage={showProfileImage}
                userName={relatedUserTitle}
                diameter={40}
                initialsSize={fontSizes.extraSmall}
                style={{ marginBottom: 4 }}
                onPress={() => this.goToProfile(relatedUser)}
                noShadow
                borderWidth={0}
              />)}
            />
            }
            {listSettledAssets &&
            <ListItemUnderlined
              label="ASSETS"
              value={extra.map(item => <BoldText key={item.hash}> {item.value} {item.symbol}</BoldText>)}
            />
            }
            {(toMyself || !isReceived) && !isPending &&
            <ListItemUnderlined
              label="TRANSACTION FEE"
              value={freeTx ? 'free' : utils.formatEther(fee.toString())}
              valueAdditionalText={freeTx ? '' : 'ETH'}
            />
            }
            {showSpeedUp && this.renderSpeedUpOptions(gasLimit)}
            {!!hasNote && showNote &&
            <ListItemParagraph
              label="NOTE"
              value={transactionNote}
            />
            }
            {showViewOnBlockchain &&
            <ButtonsWrapper>
              <EventButton
                block
                title="View on the blockchain"
                primaryInverted
                onPress={() => viewTransactionOnBlockchain(hash)}
              />
            </ButtonsWrapper>
            }
          </EventBody>
        </React.Fragment>
      );
    }

    if (eventType === COLLECTIBLE_TRANSACTION) {
      /**
        * TODO: add support for collectible transactions speed up when needed
        * the only missing piece is to build updated payload in action
        */
      const {
        to,
        from,
        note,
        icon,
        assetData = {},
        gasUsed,
        gasPrice,
        hash,
      } = eventData;

      const { name = '' } = assetData;

      const isReceived = addressesEqual(to, activeAccountAddress);
      const toMyself = isReceived && addressesEqual(from, to);
      const status = isReceived ? COLLECTIBLE_RECEIVED : COLLECTIBLE_SENT;
      const fee = gasUsed && gasPrice ? Math.round(gasUsed * gasPrice) : 0;
      let transactionNote = note;

      if (txNotes && txNotes.length > 0) {
        const txNote = txNotes.find(txn => txn.txHash === eventData.hash);
        if (txNote) {
          transactionNote = txNote.text;
        }
      }
      const hasNote = transactionNote && transactionNote !== '';
      const recipientContact = findMatchingContact(to, contacts, contactsSmartAddresses) || {};
      // apply to wallet accounts only if received from other account address
      const senderContact = this.findMatchingContactOrAccount(from);
      const relatedUser = isReceived ? senderContact : recipientContact;
      // $FlowFixMe
      const relatedUserTitle = relatedUser.username || getAccountName(relatedUser.type) || (isReceived
        ? `${from.slice(0, 7)}…${from.slice(-7)}`
        : `${to.slice(0, 7)}…${to.slice(-7)}`);
      const relatedUserProfileImage = relatedUser.profileImage || null;
      // $FlowFixMe
      const showProfileImage = !relatedUser.type;

      return (
        <React.Fragment>
          <EventHeader
            eventType={COLLECTIBLE_TRANSACTION}
            eventStatus={status}
            eventTime={eventTime}
            onClose={onClose}
            iconUrl={icon}
            onIconPress={Object.keys(assetData).length ? () => this.goToCollectible(assetData) : noop}
            imageKey={name}
            touchDisabled={!Object.keys(assetData).length}
          />
          <EventBody>
            <ListItemUnderlined
              label={isReceived ? 'SENDER' : 'RECIPIENT'}
              value={relatedUserTitle}
              valueAddon={(!!relatedUser.username && <EventProfileImage
                uri={relatedUserProfileImage}
                showProfileImage={showProfileImage}
                userName={relatedUserTitle}
                diameter={40}
                initialsSize={fontSizes.extraSmall}
                style={{ marginBottom: 4 }}
                onPress={() => this.goToProfile(relatedUser)}
                noShadow
                borderWidth={0}
              />)}
            />
            {(toMyself || !isReceived) && !!fee &&
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
            <EventButton block title="Send assets" primaryInverted onPress={() => this.sendTokensToUser(userData)} />
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
  contacts: { data: contacts, contactsSmartAddresses: { addresses: contactsSmartAddresses } },
  txNotes: { data: txNotes },
  assets: { data: assets },
  session: { data: session },
  history: { gasInfo },
  accounts: { data: accounts },
}) => ({
  contacts,
  txNotes,
  assets: Object.values(assets),
  session,
  gasInfo,
  contactsSmartAddresses,
  accounts,
});

const structuredSelector = createStructuredSelector({
  history: accountHistorySelector,
  activeAccountAddress: activeAccountAddressSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch) => ({
  updateTransactionStatus: (hash) => dispatch(updateTransactionStatusAction(hash)),
  getTxNoteByContact: (username) => dispatch(getTxNoteByContactAction(username)),
  speedUpTransaction: (hash, gasPrice, gasLimit) => dispatch(speedUpTransactionAction(hash, gasPrice, gasLimit)),
  fetchGasInfo: () => dispatch(fetchGasInfoAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(EventDetails);
