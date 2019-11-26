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
import { SafeAreaView } from 'react-navigation';
import { Linking, Dimensions, ScrollView, Clipboard } from 'react-native';
import styled from 'styled-components/native';
import { utils } from 'ethers';
import { TX_DETAILS_URL, BITCOIN_TX_DETAILS_URL } from 'react-native-dotenv';
import { format as formatDate, differenceInSeconds } from 'date-fns';
import { createStructuredSelector } from 'reselect';
import isEmpty from 'lodash.isempty';
import type { ScrollToProps } from 'components/Modals/SlideModal';
import { CachedImage } from 'react-native-cached-image';

// models
import type { Transaction } from 'models/Transaction';
import type { Assets, Asset } from 'models/Asset';
import type { ApiUser, ContactSmartAddressData } from 'models/Contacts';
import type { Accounts } from 'models/Account';

// components
import { MediumText } from 'components/Typography';
import Button from 'components/Button';
import ListItemParagraph from 'components/ListItem/ListItemParagraph';
import ListItemUnderlined from 'components/ListItem';
import ProfileImage from 'components/ProfileImage';
import Toast from 'components/Toast';

// utils
import { spacing, baseColors, fontSizes, fontStyles } from 'utils/variables';
import {
  formatFullAmount,
  noop,
  formatUnits,
  formatAmount,
} from 'utils/common';
import { createAlert } from 'utils/alerts';
import { addressesEqual, getAssetData, getAssetsAsList } from 'utils/assets';
import { findAccountByAddress, getAccountName, getInactiveUserAccounts } from 'utils/accounts';
import { findMatchingContact } from 'utils/contacts';

// actions
import { updateTransactionStatusAction } from 'actions/historyActions';
import { getTxNoteByContactAction } from 'actions/txNoteActions';

// constants
import { TRANSACTION_EVENT, TX_PENDING_STATUS, TX_CONFIRMED_STATUS } from 'constants/historyConstants';
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
  BADGE,
} from 'constants/navigationConstants';
import { COLLECTIBLE_TRANSACTION, COLLECTIBLE_SENT, COLLECTIBLE_RECEIVED } from 'constants/collectiblesConstants';
import { BADGE_REWARD_EVENT } from 'constants/badgesConstants';
import {
  PAYMENT_NETWORK_ACCOUNT_TOPUP,
  PAYMENT_NETWORK_ACCOUNT_WITHDRAWAL,
  PAYMENT_NETWORK_TX_SETTLEMENT,
} from 'constants/paymentNetworkConstants';

// selectors
import { accountHistorySelector } from 'selectors/history';
import { activeAccountAddressSelector, supportedAssetsSelector, bitcoinAddressSelector } from 'selectors';
import { accountAssetsSelector } from 'selectors/assets';

// local components
import EventHeader from './EventHeader';

type Props = {
  transaction: Transaction,
  contacts: ApiUser[],
  history: Object[],
  assets: Assets,
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
  contactsSmartAddresses: ContactSmartAddressData[],
  inactiveAccounts: Accounts,
  supportedAssets: Asset[],
  getRef?: () => Object,
  getScrollOffset?: (number) => ScrollToProps,
  getMaxScrollOffset?: (number) => number,
  accounts: Accounts,
  bitcoinAddresses: Object[],
}

type State = {
  containerHeight: ?number,
}

const { height: screenHeight } = Dimensions.get('window');

const ContentWrapper = styled.View`
  width: 100%;
  maxHeight: ${screenHeight * 0.8}px;
  border-top-left-radius: 30px;
  border-top-right-radius: 30px;
  overflow: hidden;
  background-color: ${baseColors.snowWhite};
`;

const EventBody = styled.View`
  padding: 0 ${spacing.mediumLarge}px;
  background-color: ${baseColors.snowWhite};
`;

const EventProfileImage = styled(ProfileImage)`
`;

const ButtonsWrapper = styled.View`
  padding: 6px ${spacing.mediumLarge}px ${spacing.large}px;
  background-color: ${baseColors.snowWhite};
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

const EventBodyTitle = styled(MediumText)`
  ${fontStyles.big};
  color: ${props => props.color ? props.color : baseColors.slateBlack};
  margin: 0 10px 2px;
  text-align: center;
`;

const Icon = styled(CachedImage)`
  width: 6px;
  height: 12px;
  margin-bottom: ${spacing.small}px;
`;

const viewTransactionOnBlockchain = (hash: string, asset?: ?string) => {
  let url = TX_DETAILS_URL + hash;
  if (asset && asset === 'BTC') {
    url = BITCOIN_TX_DETAILS_URL + hash;
  }
  Linking.openURL(url);
};

const lightningIcon = require('assets/icons/icon_lightning_sm.png');

class EventDetails extends React.Component<Props, State> {
  timer: ?IntervalID;
  timeout: ?TimeoutID;
  // HACK: we need to cache the tx data for smart wallet migration process
  cachedTxInfo = {};

  state = {
    containerHeight: undefined,
  };

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
      history,
    } = this.props;

    if (eventType !== TRANSACTION_EVENT) return;

    if (contacts.find(contact => contact.username === eventData.username)
      && Object.keys(eventData.contact).length) {
      getTxNoteByContact(eventData.contact.username);
    }

    const txInfo = history.find(tx => tx.hash === eventData.hash) || {};
    if (txInfo.status === TX_PENDING_STATUS) {
      this.timeout = setTimeout(() => updateTransactionStatus(eventData.hash), 500);
      this.timer = setInterval(() => updateTransactionStatus(eventData.hash), 10000);
    }

    if (txInfo.status === TX_CONFIRMED_STATUS && (!txInfo.gasUsed || !txInfo.gasPrice)) {
      updateTransactionStatus(eventData.hash);
    }
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

  goToCollectible = (assetData = {}) => {
    const {
      navigation,
      onClose,
    } = this.props;
    onClose();
    navigation.navigate(COLLECTIBLE, { assetData });
  };

  goToBadge = (badgeId: string) => {
    const {
      navigation,
      onClose,
    } = this.props;
    onClose();
    navigation.navigate(BADGE, { badgeId });
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

  findMatchingContactOrAccount = (address) => {
    const {
      contacts,
      contactsSmartAddresses = [],
      inactiveAccounts,
    } = this.props;
    return findMatchingContact(address, contacts, contactsSmartAddresses)
      || findAccountByAddress(address, inactiveAccounts)
      || {};
  };

  renderEventBody = (eventType) => {
    const {
      eventData,
      activeAccountAddress,
      history,
      txNotes,
      assets,
      supportedAssets,
      accounts,
      bitcoinAddresses,
    } = this.props;
    const {
      hideAmount,
      hideSender,
      isPPNAsset,
      txType,
    } = eventData;

    if (eventType === TRANSACTION_EVENT) {
      let txInfo = history.find(tx => tx.hash === eventData.hash);
      if (!txInfo) {
        if (eventData.asset === 'BTC') {
          txInfo = eventData;
          txInfo.value *= 100000000;
        } else {
          txInfo = this.cachedTxInfo || {};
        }
      } else {
        this.cachedTxInfo = txInfo;
      }
      const {
        to,
        from,
        asset,
        gasUsed,
        gasPrice,
        status,
        note,
        isPPNTransaction,
        tag,
        extra,
      } = txInfo;

      const isReceived = addressesEqual(to, activeAccountAddress)
        || tag === PAYMENT_NETWORK_ACCOUNT_WITHDRAWAL
        || bitcoinAddresses.some(e => e.address === to);
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
      const assetsData = getAssetsAsList(assets);
      const { decimals = 18 } = getAssetData(assetsData, supportedAssets, asset);
      const value = formatUnits(txInfo.value, decimals);
      const recipientContact = this.findMatchingContactOrAccount(to);
      const senderContact = this.findMatchingContactOrAccount(from);
      const relatedAddress = isReceived ? from : to;
      const relatedUser = isReceived ? senderContact : recipientContact;
      // $FlowFixMe
      let relatedUserTitle = relatedUser.username || getAccountName(relatedUser.type, accounts) || relatedAddress;
      if (addressesEqual(to, from)) {
        relatedUserTitle = 'My account';
      }
      const relatedUserProfileImage = relatedUser.profileImage || null;
      // $FlowFixMe
      const showProfileImage = !relatedUser.type;

      const fee = gasUsed && gasPrice ? Math.round(gasUsed * gasPrice) : 0;
      const freeTx = isPPNTransaction;

      const showFeeBlock = (toMyself || !isReceived) && !isPending && (freeTx || !!fee);
      let showNote = true;
      const listSettledAssets = (tag === PAYMENT_NETWORK_TX_SETTLEMENT && !isEmpty(extra));

      if (tag === PAYMENT_NETWORK_TX_SETTLEMENT || tag === PAYMENT_NETWORK_ACCOUNT_TOPUP ||
        tag === PAYMENT_NETWORK_ACCOUNT_WITHDRAWAL) {
        showNote = false;
      }

      return (
        <EventBody>
          {txType &&
          <ListItemUnderlined
            label="TRANSACTION TYPE"
            value={txType}
          />
          }
          {!hideAmount &&
          <ListItemUnderlined
            label={isReceived ? 'AMOUNT RECEIVED' : 'AMOUNT SENT'}
            valueAddon={isPPNAsset ? <Icon source={lightningIcon} /> : null}
            value={`${formatFullAmount(value)} ${asset}`}
          />
          }
          {!hideSender &&
          <ListItemUnderlined
            label={isReceived ? 'SENDER' : 'RECIPIENT'}
            value={relatedUserTitle}
            valueAddon={(!!relatedUser.username && <EventProfileImage
              uri={relatedUserProfileImage}
              showProfileImage={showProfileImage}
              userName={relatedUserTitle}
              diameter={40}
              initialsSize={fontSizes.regular}
              style={{ marginBottom: 4 }}
              onPress={() => this.goToProfile(relatedUser)}
              noShadow
              borderWidth={0}
            />)}
            onPress={Object.keys(relatedUser).length ? null : () => this.writeToClipboard(relatedUserTitle)}
          />
          }
          {listSettledAssets &&
          <ListItemUnderlined
            label="ASSETS"
            value={extra.map(({ symbol, value: rawValue, hash }) => {
              const { decimals: assetDecimals = 18 } = getAssetData(assetsData, supportedAssets, symbol);
              const formattedValue = +formatAmount(formatUnits(rawValue.toString(), assetDecimals));
              return <MediumText key={hash}> {formattedValue} {symbol}</MediumText>;
            })}
          />
          }
          {showFeeBlock &&
          <ListItemUnderlined
            label="TRANSACTION FEE"
            value={freeTx ? 'free' : `${utils.formatEther(fee.toString())} ETH`}
          />
          }
          {!!hasNote && showNote &&
          <ListItemParagraph
            label="NOTE"
            value={transactionNote}
          />
          }
        </EventBody>
      );
    }

    if (eventType === COLLECTIBLE_TRANSACTION) {
      const {
        to,
        from,
        note,
        gasUsed,
        gasPrice,
      } = eventData;

      const isReceived = addressesEqual(to, activeAccountAddress);
      const toMyself = isReceived && addressesEqual(from, to);
      const fee = gasUsed && gasPrice ? Math.round(gasUsed * gasPrice) : 0;
      let transactionNote = note;

      if (txNotes && txNotes.length > 0) {
        const txNote = txNotes.find(txn => txn.txHash === eventData.hash);
        if (txNote) {
          transactionNote = txNote.text;
        }
      }
      const hasNote = transactionNote && transactionNote !== '';
      const recipientContact = this.findMatchingContactOrAccount(to);
      const senderContact = this.findMatchingContactOrAccount(from);
      const relatedUser = isReceived ? senderContact : recipientContact;
      // $FlowFixMe
      const relatedUserTitle = relatedUser.username || getAccountName(relatedUser.type, accounts) || (isReceived
        ? `${from.slice(0, 7)}…${from.slice(-7)}`
        : `${to.slice(0, 7)}…${to.slice(-7)}`);
      const relatedUserProfileImage = relatedUser.profileImage || null;
      // $FlowFixMe
      const showProfileImage = !relatedUser.type;

      return (
        <EventBody>
          <ListItemUnderlined
            label={isReceived ? 'SENDER' : 'RECIPIENT'}
            value={relatedUserTitle}
            valueAddon={(!!relatedUser.username && <EventProfileImage
              uri={relatedUserProfileImage}
              showProfileImage={showProfileImage}
              userName={relatedUserTitle}
              diameter={40}
              initialsSize={fontSizes.regular}
              style={{ marginBottom: 4 }}
              onPress={() => this.goToProfile(relatedUser)}
              noShadow
              borderWidth={0}
            />)}
          />
          {(toMyself || !isReceived) && !!fee &&
          <ListItemUnderlined
            label="TRANSACTION FEE"
            value={`${utils.formatEther(fee.toString())} ETH`}
          />
          }
          {!!hasNote &&
          <ListItemParagraph
            label="NOTE"
            value={transactionNote}
          />
          }
        </EventBody>
      );
    }

    if (eventType === BADGE_REWARD_EVENT) {
      const { name } = eventData;

      return (
        <EventBody>
          <ListItemUnderlined
            label="RECEIVED BADGE"
            value={name}
          />
        </EventBody>
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
      <EventBody>
        <EventRow>
          <EventProfileImage
            uri={userData.profileImage}
            userName={userData.username}
            diameter={40}
            initialsSize={fontSizes.regular}
            onPress={() => this.goToProfile(userData)}
            noShadow
            borderWidth={0}
          />
          <EventBodyTitle>
            @{userData.username}
          </EventBodyTitle>
        </EventRow>
      </EventBody>
    );
  };

  renderEventButtons = (eventType, eventStatus) => {
    const { eventData, history } = this.props;

    if (eventType === TRANSACTION_EVENT || eventType === COLLECTIBLE_TRANSACTION) {
      let txInfo = history.find(tx => tx.hash === eventData.hash);
      if (!txInfo) {
        if (eventData.asset === 'BTC') {
          txInfo = eventData;
        } else {
          txInfo = this.cachedTxInfo || {};
        }
      } else {
        this.cachedTxInfo = txInfo;
      }
      const { hash, isPPNTransaction, asset } = txInfo;

      if (!isPPNTransaction) {
        return (
          <ButtonsWrapper>
            <EventButton
              block
              title="View on the blockchain"
              primaryInverted
              onPress={() => viewTransactionOnBlockchain(hash, asset)}
            />
          </ButtonsWrapper>
        );
      }
      return null;
    }

    if (eventType === BADGE_REWARD_EVENT) {
      const { badgeId } = eventData;
      return (
        <ButtonsWrapper>
          <EventButton
            block
            title="See the badge"
            primaryInverted
            onPress={() => this.goToBadge(badgeId)}
          />
        </ButtonsWrapper>
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
            onPress={() => this.handleRejectConnection(userData)}
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
      </React.Fragment>
    );
  };

  renderEventHeader = (eventType, eventStatus) => {
    const {
      eventData,
      activeAccountAddress,
      onClose,
      history,
    } = this.props;
    let eventTime = formatDate(new Date(eventData.createdAt * 1000), 'MMMM D, YYYY HH:mm');

    if (eventType === TRANSACTION_EVENT) {
      let txInfo = history.find(tx => tx.hash === eventData.hash);
      if (!txInfo) {
        if (eventData.asset === 'BTC') {
          txInfo = eventData;
        } else {
          txInfo = this.cachedTxInfo || {};
        }
      } else {
        this.cachedTxInfo = txInfo;
      }
      const { status } = txInfo;
      const isPending = status === TX_PENDING_STATUS;

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

      return (
        <EventHeader
          eventType={TRANSACTION_EVENT}
          eventStatus={status}
          eventTime={eventTime}
          onClose={onClose}
        />
      );
    }

    if (eventType === COLLECTIBLE_TRANSACTION) {
      const { to, icon, assetData = {} } = eventData;
      const { name = '' } = assetData;

      const isReceived = addressesEqual(to, activeAccountAddress);
      const status = isReceived ? COLLECTIBLE_RECEIVED : COLLECTIBLE_SENT;

      return (
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
      );
    }

    if (eventType === BADGE_REWARD_EVENT) {
      const { name, imageUrl, badgeId } = eventData;

      return (
        <EventHeader
          eventType={BADGE_REWARD_EVENT}
          eventTime={eventTime}
          onClose={onClose}
          iconUrl={imageUrl}
          onIconPress={() => this.goToBadge(badgeId)}
          imageKey={name}
          imageDiameter={70}
          imageWrapperStyle={{ backgroundColor: 'transparent' }}
        />
      );
    }

    return (
      <EventHeader
        eventType={eventType}
        eventStatus={eventStatus}
        eventTime={eventTime}
        onClose={onClose}
      />
    );
  };

  writeToClipboard = async (valueToSet) => {
    await Clipboard.setString(valueToSet);
    Toast.show({ message: 'Address copied to clipboard', type: 'success', title: 'Success' });
  };

  render() {
    const {
      eventType,
      eventStatus,
      getScrollOffset,
      getRef,
      getMaxScrollOffset,
    } = this.props;
    const { containerHeight } = this.state;

    return (
      <ContentWrapper>
        {this.renderEventHeader(eventType, eventStatus)}
        <ScrollView
          style={{ flexGrow: 1 }}
          onScroll={(event) => {
            const { contentOffset } = event.nativeEvent;
            const { y } = contentOffset;
            if (getScrollOffset) getScrollOffset(y);
          }}
          onLayout={(event) => {
            const { height } = event.nativeEvent.layout;
            if (!containerHeight || containerHeight !== height) {
              this.setState({ containerHeight: height });
            }
          }}
          onContentSizeChange={(contentWidth, contentHeight) => {
            if (getMaxScrollOffset && containerHeight) getMaxScrollOffset(containerHeight - contentHeight);
          }}
          scrollEventThrottle={16}
          ref={getRef}
          scrollToOverflowEnabled={false}
          bounces={false}
        >
          {this.renderEventBody(eventType)}
        </ScrollView>
        <SafeAreaView forceInset={{ top: 'never', bottom: 'always' }}>
          {this.renderEventButtons(eventType, eventStatus)}
        </SafeAreaView>
      </ContentWrapper>
    );
  }
}

const mapStateToProps = ({
  contacts: { data: contacts, contactsSmartAddresses: { addresses: contactsSmartAddresses } },
  txNotes: { data: txNotes },
  accounts: { data: accounts },
}) => ({
  contacts,
  txNotes,
  contactsSmartAddresses,
  inactiveAccounts: getInactiveUserAccounts(accounts),
  accounts,
});

const structuredSelector = createStructuredSelector({
  history: accountHistorySelector,
  activeAccountAddress: activeAccountAddressSelector,
  assets: accountAssetsSelector,
  supportedAssets: supportedAssetsSelector,
  bitcoinAddresses: bitcoinAddressSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch) => ({
  updateTransactionStatus: (hash) => dispatch(updateTransactionStatusAction(hash)),
  getTxNoteByContact: (username) => dispatch(getTxNoteByContactAction(username)),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(EventDetails);
