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
import { Animated, RefreshControl, Platform, View, ScrollView, FlatList } from 'react-native';
import { connect } from 'react-redux';
import isEqual from 'lodash.isequal';
import type { NavigationScreenProp, NavigationEventSubscription } from 'react-navigation';
import firebase from 'react-native-firebase';
import { createStructuredSelector } from 'reselect';
import Intercom from 'react-native-intercom';

// components
import ActivityFeed from 'components/ActivityFeed';
import styled, { withTheme } from 'styled-components/native';
import { MediumText } from 'components/Typography';
import Tabs from 'components/Tabs';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import BadgeTouchableItem from 'components/BadgeTouchableItem';
import PortfolioBalance from 'components/PortfolioBalance';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import IconButton from 'components/IconButton';
import ProfileImage from 'components/ProfileImage';
import CircleButton from 'components/CircleButton';
import ActionModal from 'components/ActionModal';
import { LabelBadge } from 'components/LabelBadge';
import ReceiveModal from 'screens/Asset/ReceiveModal';
import SlideModal from 'components/Modals/SlideModal';
import { Wrapper } from 'components/Layout';
import CheckPin from 'components/CheckPin';
import Loader from 'components/Loader';

// constants
import { defaultFiatCurrency } from 'constants/assetsConstants';
import {
  BADGE,
  MENU,
  MANAGE_USERS_FLOW, SEND_BITCOIN_FLOW,
  SEND_TOKEN_FROM_HOME_FLOW,
} from 'constants/navigationConstants';
import { ALL, TRANSACTIONS, SOCIAL } from 'constants/activityConstants';
import { TRANSACTION_EVENT } from 'constants/historyConstants';
import { COLLECTIBLE_TRANSACTION } from 'constants/collectiblesConstants';
import { TYPE_ACCEPTED } from 'constants/invitationsConstants';
import { RECEIVE, SEND } from 'constants/walletConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import { BLOCKCHAIN_NETWORK_TYPES } from 'constants/blockchainNetworkConstants';
import { EXCHANGE } from 'constants/exchangeConstants';

// actions
import {
  fetchTransactionsHistoryAction,
  fetchTransactionsHistoryNotificationsAction,
} from 'actions/historyActions';
import { setUnreadNotificationsStatusAction } from 'actions/notificationsActions';
import { fetchAllCollectiblesDataAction } from 'actions/collectiblesActions';
import {
  cancelInvitationAction,
  acceptInvitationAction,
  rejectInvitationAction,
  fetchInviteNotificationsAction,
} from 'actions/invitationsActions';
import { fetchBadgesAction, fetchBadgeAwardHistoryAction } from 'actions/badgesActions';
import { logScreenViewAction } from 'actions/analyticsActions';
import { resetIncorrectPasswordAction } from 'actions/authActions';
import { switchAccountAction } from 'actions/accountsActions';

// selectors
import { accountHistorySelector } from 'selectors/history';
import { accountCollectiblesHistorySelector } from 'selectors/collectibles';
import { activeBlockchainSelector } from 'selectors/selectors';

// utils
import { spacing, fontStyles, fontSizes } from 'utils/variables';
import { getThemeColors, themedColors } from 'utils/themes';
import { mapTransactionsHistory, mapOpenSeaAndBCXTransactionsHistory } from 'utils/feedData';
import { calculateBalanceInFiat } from 'utils/assets';
import { formatFiat } from 'utils/common';
import { calculateBitcoinBalanceInFiat } from 'utils/bitcoin';
import { getActiveAccount } from 'utils/accounts';

// models, types
import type { Account, Accounts } from 'models/Account';
import type { Badges, BadgeRewardEvent } from 'models/Badge';
import type { ContactSmartAddressData } from 'models/Contacts';
import type { Connector } from 'models/WalletConnect';
import type { UserEvent } from 'models/userEvent';
import type { Theme } from 'models/Theme';
import type { RootReducerState, Dispatch } from 'reducers/rootReducer';
import type { BalancesStore, Rates } from 'models/Asset';
import type { BitcoinAddress, BitcoinBalance } from 'models/Bitcoin';
import type { EthereumWallet } from 'models/Wallet';


type Props = {
  navigation: NavigationScreenProp<*>,
  contacts: Object[],
  invitations: Object[],
  user: Object,
  fetchTransactionsHistory: Function,
  fetchTransactionsHistoryNotifications: Function,
  fetchInviteNotifications: Function,
  acceptInvitation: Function,
  cancelInvitation: Function,
  rejectInvitation: Function,
  setUnreadNotificationsStatus: Function,
  homeNotifications: Object[],
  intercomNotificationsCount: number,
  fetchAllCollectiblesData: Function,
  openSeaTxHistory: Object[],
  history: Object[],
  badges: Badges,
  fetchBadges: Function,
  connectors: Connector[],
  pendingConnector: ?Connector,
  logScreenView: (view: string, screen: string) => void,
  activeAccount: ?Account,
  contactsSmartAddresses: ContactSmartAddressData[],
  accounts: Accounts,
  userEvents: UserEvent[],
  fetchBadgeAwardHistory: () => void,
  badgesEvents: BadgeRewardEvent[],
  theme: Theme,
  baseFiatCurrency: ?string,
  activeBlockchainNetwork: ?string,
  rates: Rates,
  balances: BalancesStore,
  smartWalletFeatureEnabled: boolean,
  bitcoinFeatureEnabled: boolean,
  bitcoinBalances: BitcoinBalance,
  bitcoinAddresses: BitcoinAddress[],
  switchAccount: (accountId: string, privateKey?: string) => void,
  resetIncorrectPassword: () => void,
};

type State = {
  showCamera: boolean,
  usernameWidth: number,
  activeTab: string,
  permissionsGranted: boolean,
  scrollY: Animated.Value,
  visibleActionModal: string,
  receiveAddress: string,
  showPinModal: boolean,
  onPinValidAction: ?(_: string, wallet: EthereumWallet) => Promise<void>,
  isChangingAcc: boolean,
};


const profileImageWidth = 24;

const ListHeader = styled(MediumText)`
  color: ${themedColors.accent};
  ${fontStyles.regular};
  margin: ${spacing.medium}px ${spacing.layoutSides}px ${spacing.small}px;
`;

const BadgesWrapper = styled.View`
  padding-top: ${spacing.medium}px;
  border-top-width: 1px;
  border-bottom-width: 1px;
  border-color: ${themedColors.border};
`;

const EmptyStateWrapper = styled.View`
  margin: 20px 0 30px;
`;

const ActionButtonsWrapper = styled.View`
  padding: 45px 26px 36px;
  flex-direction: row;
  justify-content: space-between;
`;

const getModalActionsInfo = (actionType: string) => {
  switch (actionType) {
    case ACCOUNT_TYPES.SMART_WALLET:
      return {
        title: 'Smart Wallet',
        paragraph: 'You are able to recover your wallet using another device, i.e. desktop computer.',
        children: (<LabelBadge label="Recommended" positive containerStyle={{ marginTop: 11 }} />),
      };

    case ACCOUNT_TYPES.KEY_BASED:
      return {
        title: 'Key Wallet',
        paragraph: 'Needs to be backed up in order to enable Smart Wallet recovery.',
      };

    case BLOCKCHAIN_NETWORK_TYPES.BITCOIN:
      return {
        title: 'Bitcoin Wallet',
      };
    default:
      return {};
  }
};


class HomeScreen extends React.Component<Props, State> {
  _willFocus: NavigationEventSubscription;
  forceRender = false;

  state = {
    showCamera: false,
    permissionsGranted: false,
    scrollY: new Animated.Value(0),
    activeTab: ALL,
    usernameWidth: 0,
    visibleActionModal: '',
    receiveAddress: '',
    isChangingAcc: false,
    onPinValidAction: null,
    showPinModal: false,
  };

  componentDidMount() {
    const {
      logScreenView,
      fetchBadges,
      fetchBadgeAwardHistory,
    } = this.props;

    logScreenView('View home', 'Home');

    if (Platform.OS === 'ios') {
      firebase.notifications().setBadge(0);
    }

    this._willFocus = this.props.navigation.addListener('willFocus', () => {
      this.props.setUnreadNotificationsStatus(false);
    });
    fetchBadges();
    fetchBadgeAwardHistory();
  }

  componentWillUnmount() {
    this._willFocus.remove();
  }

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    const isEq = isEqual(this.props, nextProps) && isEqual(this.state, nextState);
    const isFocused = this.props.navigation.isFocused();

    if (!isFocused) {
      if (!isEq) this.forceRender = true;
      return false;
    }

    if (this.forceRender) {
      this.forceRender = false;
      return true;
    }

    return !isEq;
  }

  refreshScreenData = () => {
    const {
      fetchTransactionsHistoryNotifications,
      fetchInviteNotifications,
      fetchAllCollectiblesData,
      fetchTransactionsHistory,
      fetchBadges,
    } = this.props;
    fetchTransactionsHistoryNotifications();
    fetchInviteNotifications();
    fetchAllCollectiblesData();
    fetchBadges();
    fetchTransactionsHistory();
  };

  getModalActions = () => {
    const { visibleActionModal } = this.state;
    const {
      rates,
      accounts: _accounts,
      balances,
      baseFiatCurrency,
      smartWalletFeatureEnabled,
      bitcoinFeatureEnabled,
      bitcoinBalances,
      bitcoinAddresses,
    } = this.props;
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;

    const keyWallet = _accounts.find(({ type }) => type === ACCOUNT_TYPES.KEY_BASED) || {};
    const accountsToShow = [keyWallet];

    if (smartWalletFeatureEnabled) {
      const smartWallet = _accounts.find(({ type }) => type === ACCOUNT_TYPES.SMART_WALLET) || {};
      accountsToShow.unshift(smartWallet);
    }

    if (bitcoinFeatureEnabled && bitcoinAddresses.length > 0) {
      const bitcoinAcc = { type: BLOCKCHAIN_NETWORK_TYPES.BITCOIN, id: bitcoinAddresses[0].address };
      accountsToShow.push(bitcoinAcc);
    }

    const accountsInfo = accountsToShow.map((account) => {
      const { type, id } = account;
      const isBitcoin = type === BLOCKCHAIN_NETWORK_TYPES.BITCOIN;
      const accBalance = isBitcoin
        ? calculateBitcoinBalanceInFiat(rates, bitcoinBalances, fiatCurrency)
        : calculateBalanceInFiat(rates, balances[id], fiatCurrency);
      return {
        type,
        balance: accBalance,
        formattedBalance: formatFiat(accBalance, fiatCurrency),
        address: id,
        additionalInfo: getModalActionsInfo(type),
        sendFlow: isBitcoin ? SEND_BITCOIN_FLOW : SEND_TOKEN_FROM_HOME_FLOW,
        exchangeFlow: EXCHANGE,
      };
    });


    switch (visibleActionModal) {
      case RECEIVE:
        return accountsInfo.map(({
          type,
          formattedBalance,
          additionalInfo,
          address,
        }) => ({
          key: type,
          value: formattedBalance,
          ...additionalInfo,
          onPress: () => this.setState({ receiveAddress: address }),
          label: `To ${additionalInfo.title}`,
        }),
        );
      case SEND:
        return accountsInfo.map(({
          type,
          formattedBalance,
          balance,
          additionalInfo,
          sendFlow,
        }) => ({
          key: type,
          value: formattedBalance,
          ...additionalInfo,
          onPress: () => this.navigateToAction(type, sendFlow),
          label: `From ${additionalInfo.title}`,
          isDisabled: balance <= 0,
        }),
        );
      case EXCHANGE:
        return accountsInfo.filter(({ type }) => type !== BLOCKCHAIN_NETWORK_TYPES.BITCOIN).map(({
          type,
          formattedBalance,
          balance,
          additionalInfo,
          exchangeFlow,
        }) => ({
          key: type,
          value: formattedBalance,
          ...additionalInfo,
          onPress: () => this.navigateToAction(type, exchangeFlow),
          label: `From ${additionalInfo.title}`,
          isDisabled: balance <= 0,
        }),
        );
      default:
        return [];
    }
  };

  closeActionModal = (callback: () => void) => {
    this.setState({ visibleActionModal: '' }, () => {
      if (callback) callback();
    });
  };

  openActionModal = (actionModalType: string) => {
    this.setState({ visibleActionModal: actionModalType });
  };

  setActiveTab = (activeTab) => {
    const { logScreenView } = this.props;

    logScreenView(`View tab Home.${activeTab}`, 'Home');
    this.setState({ activeTab });
  };

  closeReceiveModal = () => {
    this.setState({ receiveAddress: '' });
  };

  switchAccAndNavigate = (navigateTo: string) => {
    const { navigation, accounts, switchAccount } = this.props;
    const smartAccount = accounts.find((acc) => acc.type === ACCOUNT_TYPES.SMART_WALLET) || {};

    this.setState({
      showPinModal: true,
      isChangingAcc: false,
      onPinValidAction: async (_: string, wallet: Object) => {
        this.setState({ isChangingAcc: true });
        await switchAccount(smartAccount.id, wallet.privateKey);
        this.setState({ showPinModal: false });
        navigation.navigate(navigateTo);
      },
    });
  };


  navigateToAction = (type: string, navigateTo: string) => {
    const { navigation, accounts, switchAccount } = this.props;
    const { type: activeAccType } = getActiveAccount(accounts) || {};
    const keyBasedAccount = accounts.find((acc) => acc.type === ACCOUNT_TYPES.KEY_BASED) || {};

    switch (type) {
      case ACCOUNT_TYPES.SMART_WALLET:
        if (activeAccType === ACCOUNT_TYPES.SMART_WALLET) {
          navigation.navigate(navigateTo);
        } else {
          this.switchAccAndNavigate(navigateTo);
        }
        break;

      case ACCOUNT_TYPES.KEY_BASED:
        if (activeAccType !== ACCOUNT_TYPES.KEY_BASED) {
          switchAccount(keyBasedAccount.id);
        }
        navigation.navigate(navigateTo);
        break;

      case BLOCKCHAIN_NETWORK_TYPES.BITCOIN:
        navigation.navigate(navigateTo);
        break;

      default:
        break;
    }
  };

  renderBadge = ({ item }) => {
    const { navigation } = this.props;
    return (
      <BadgeTouchableItem
        data={item}
        onPress={() => navigation.navigate(BADGE, { badgeId: item.badgeId })}
      />
    );
  };

  renderUser = () => {
    const { user, navigation } = this.props;
    const userImageUri = user.profileImage ? `${user.profileImage}?t=${user.lastUpdateTime || 0}` : null;
    return (
      <ProfileImage
        uri={userImageUri}
        userName={user.username}
        diameter={profileImageWidth}
        noShadow
        borderWidth={0}
        onPress={() => navigation.navigate(MANAGE_USERS_FLOW)}
      />
    );
  };

  handleCheckPinModalClose = () => {
    const { resetIncorrectPassword } = this.props;
    resetIncorrectPassword();
    this.setState({
      showPinModal: false,
    });
  };

  render() {
    const {
      cancelInvitation,
      acceptInvitation,
      rejectInvitation,
      intercomNotificationsCount,
      navigation,
      history,
      openSeaTxHistory,
      contacts,
      invitations,
      badges,
      contactsSmartAddresses,
      accounts,
      userEvents,
      badgesEvents,
      theme,
      baseFiatCurrency,
      activeBlockchainNetwork,
    } = this.props;
    const colors = getThemeColors(theme);

    const {
      activeTab,
      visibleActionModal,
      receiveAddress,
      showPinModal,
      onPinValidAction,
      isChangingAcc,
    } = this.state;

    const tokenTxHistory = history.filter(({ tranType }) => tranType !== 'collectible');
    const bcxCollectiblesTxHistory = history.filter(({ tranType }) => tranType === 'collectible');

    const transactionsOnMainnet = activeBlockchainNetwork === 'BITCOIN' ? history : mapTransactionsHistory(
      tokenTxHistory,
      contacts,
      contactsSmartAddresses,
      accounts,
      TRANSACTION_EVENT,
    );
    const collectiblesTransactions = mapOpenSeaAndBCXTransactionsHistory(openSeaTxHistory, bcxCollectiblesTxHistory);
    const mappedCTransactions = mapTransactionsHistory(
      collectiblesTransactions,
      contacts,
      contactsSmartAddresses,
      accounts,
      COLLECTIBLE_TRANSACTION,
    );

    const mappedContacts = contacts.map(({ ...rest }) => ({ ...rest, type: TYPE_ACCEPTED }));

    const activityFeedTabs = [
      {
        id: ALL,
        name: 'All',
        icon: 'cube',
        onPress: () => this.setActiveTab(ALL),
        data: [
          ...transactionsOnMainnet,
          ...mappedCTransactions,
          ...mappedContacts,
          ...invitations,
          ...userEvents,
          ...badgesEvents,
        ],
        emptyState: {
          title: 'Make your first step',
          bodyText: 'Your activity will appear here.',
        },
      },
      {
        id: TRANSACTIONS,
        name: 'Transactions',
        icon: 'paperPlane',
        onPress: () => this.setActiveTab(TRANSACTIONS),
        data: [...transactionsOnMainnet, ...mappedCTransactions],
        emptyState: {
          title: 'Make your first step',
          bodyText: 'Your transactions will appear here. Send or receive tokens to start.',
        },
      },
      {
        id: SOCIAL,
        name: 'Social',
        icon: 'cup',
        onPress: () => this.setActiveTab(SOCIAL),
        data: [...mappedContacts, ...invitations],
        emptyState: {
          title: 'Make your first step',
          bodyText: 'Information on your connections will appear here. Send a connection request to start.',
        },
      },
    ];

    const hasIntercomNotifications = !!intercomNotificationsCount;

    const badgesContainerStyle = !badges.length ? { width: '100%', justifyContent: 'center' } : {};
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const modalActions = this.getModalActions();


    return (
      <ContainerWithHeader
        backgroundColor={colors.card}
        headerProps={{
          leftItems: [
            {
              custom: (
                <IconButton
                  icon="hamburger"
                  onPress={() => navigation.navigate(MENU)}
                  fontSize={fontSizes.large}
                  secondary
                />
              ),
            },
          ],
          centerItems: [{ custom: this.renderUser() }],
          rightItems: [
            {
              link: 'Support',
              onPress: () => Intercom.displayMessenger(),
              addon: hasIntercomNotifications && (
                <View
                  style={{
                    width: 8,
                    height: 8,
                    backgroundColor: colors.indicator,
                    borderRadius: 4,
                    marginLeft: 4,
                    marginRight: -6,
                  }}
                />
              ),
            },
          ],
          sideFlex: 4,
        }}
        inset={{ bottom: 0 }}
      >
        <ScrollView
          style={{ width: '100%', flex: 1 }}
          stickyHeaderIndices={[3]}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={this.refreshScreenData}
            />}
        >
          <PortfolioBalance fiatCurrency={fiatCurrency} />
          <ActionButtonsWrapper>
            <CircleButton
              label="Receive"
              fontIcon="qrDetailed"
              onPress={() => this.openActionModal(RECEIVE)}
            />
            <CircleButton
              label="Send"
              fontIcon="paperPlane"
              onPress={() => this.openActionModal(SEND)}
            />
            <CircleButton
              label="Exchange"
              fontIcon="exchange"
              onPress={() => this.openActionModal(EXCHANGE)}
            />
          </ActionButtonsWrapper>
          <BadgesWrapper>
            <ListHeader>Game of badges</ListHeader>
            <FlatList
              data={badges}
              horizontal
              keyExtractor={(item) => (item.id.toString())}
              renderItem={this.renderBadge}
              style={{ width: '100%', paddingBottom: spacing.medium }}
              contentContainerStyle={{ paddingHorizontal: 6, ...badgesContainerStyle }}
              initialNumToRender={5}
              ListEmptyComponent={(
                <EmptyStateWrapper>
                  <EmptyStateParagraph
                    title="No badges"
                    bodyText="You do not have badges yet"
                  />
                </EmptyStateWrapper>
              )}
            />
          </BadgesWrapper>
          <Tabs
            tabs={activityFeedTabs}
            wrapperStyle={{ paddingTop: 16 }}
            activeTab={activeTab}
          />
          <ActivityFeed
            onCancelInvitation={cancelInvitation}
            onRejectInvitation={rejectInvitation}
            onAcceptInvitation={acceptInvitation}
            navigation={navigation}
            tabs={activityFeedTabs}
            activeTab={activeTab}
            hideTabs
            initialNumToRender={8}
            wrapperStyle={{ flexGrow: 1 }}
            contentContainerStyle={{ flexGrow: 1 }}
          />
        </ScrollView>
        <ActionModal
          onModalClose={this.closeActionModal}
          isVisible={!!visibleActionModal}
          items={modalActions}
          doNotCloseOnPress={visibleActionModal === RECEIVE}
        />
        <ReceiveModal
          isVisible={!!receiveAddress}
          address={receiveAddress}
          onModalHide={this.closeReceiveModal}
        />
        <SlideModal
          isVisible={showPinModal}
          onModalHide={this.handleCheckPinModalClose}
          title="Enter pincode"
          centerTitle
          fullScreen
          showHeader
        >
          <Wrapper flex={1} style={{ justifyContent: 'center' }}>
            {isChangingAcc
            ? <Loader messages={['']} />
            : <CheckPin onPinValid={onPinValidAction} revealMnemonic />}
          </Wrapper>
        </SlideModal>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  contacts: { data: contacts, contactsSmartAddresses: { addresses: contactsSmartAddresses } },
  user: { data: user },
  invitations: { data: invitations },
  notifications: { intercomNotificationsCount },
  badges: { data: badges, badgesEvents },
  accounts: { data: accounts },
  userEvents: { data: userEvents },
  appSettings: { data: { baseFiatCurrency } },
  rates: { data: rates },
  balances: { data: balances },
  featureFlags: {
    data: {
      SMART_WALLET_ENABLED: smartWalletFeatureEnabled,
      BITCOIN_ENABLED: bitcoinFeatureEnabled,
    },
  },
  bitcoin: { data: { addresses: bitcoinAddresses, balances: bitcoinBalances } },
}: RootReducerState): $Shape<Props> => ({
  contacts,
  user,
  invitations,
  intercomNotificationsCount,
  badges,
  badgesEvents,
  contactsSmartAddresses,
  accounts,
  userEvents,
  baseFiatCurrency,
  rates,
  balances,
  smartWalletFeatureEnabled,
  bitcoinFeatureEnabled,
  bitcoinBalances,
  bitcoinAddresses,
});

const structuredSelector = createStructuredSelector({
  history: accountHistorySelector,
  openSeaTxHistory: accountCollectiblesHistorySelector,
  activeBlockchainNetwork: activeBlockchainSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  cancelInvitation: (invitation) => dispatch(cancelInvitationAction(invitation)),
  acceptInvitation: (invitation) => dispatch(acceptInvitationAction(invitation)),
  rejectInvitation: (invitation) => dispatch(rejectInvitationAction(invitation)),
  fetchTransactionsHistory: () => dispatch(fetchTransactionsHistoryAction()),
  fetchTransactionsHistoryNotifications: () => dispatch(fetchTransactionsHistoryNotificationsAction()),
  fetchInviteNotifications: () => dispatch(fetchInviteNotificationsAction()),
  setUnreadNotificationsStatus: status => dispatch(setUnreadNotificationsStatusAction(status)),
  fetchAllCollectiblesData: () => dispatch(fetchAllCollectiblesDataAction()),
  fetchBadges: () => dispatch(fetchBadgesAction()),
  logScreenView: (view: string, screen: string) => dispatch(logScreenViewAction(view, screen)),
  fetchBadgeAwardHistory: () => dispatch(fetchBadgeAwardHistoryAction()),

  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
  switchAccount: (accountId: string, privateKey?: string) => dispatch(switchAccountAction(accountId, privateKey)),
});

export default withTheme(connect(combinedMapStateToProps, mapDispatchToProps)(HomeScreen));
