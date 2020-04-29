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
import { View, Linking } from 'react-native';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import styled, { withTheme } from 'styled-components/native';
import { SafeAreaView } from 'react-navigation';
import { format as formatDate } from 'date-fns';
import { CachedImage } from 'react-native-cached-image';
import { utils } from 'ethers';
import get from 'lodash.get';
import isEmpty from 'lodash.isempty';
import { TX_DETAILS_URL, BITCOIN_TX_DETAILS_URL, SDK_PROVIDER } from 'react-native-dotenv';

// components
import { BaseText, MediumText } from 'components/Typography';
import { Spacing } from 'components/Layout';
import Button from 'components/Button';
import SlideModal from 'components/Modals/SlideModal';
import ProfileImage from 'components/ProfileImage';
import Icon from 'components/Icon';
import TankAssetBalance from 'components/TankAssetBalance';
import ReceiveModal from 'screens/Asset/ReceiveModal';
import SWActivationModal from 'components/SWActivationModal';

// utils
import { spacing, fontStyles, fontSizes } from 'utils/variables';
import { themedColors, getThemeColors } from 'utils/themes';
import { getRate, addressesEqual, getAssetData, getAssetsAsList } from 'utils/assets';
import {
  formatFiat,
  formatAmount,
  formatUnits,
  formatTransactionFee,
} from 'utils/common';
import {
  groupPPNTransactions, elipsizeAddress, isPendingTransaction, isSWAddress, isKWAddress, getUsernameOrAddress,
} from 'utils/feedData';
import { createAlert } from 'utils/alerts';
import { findMatchingContact } from 'utils/contacts';
import { getActiveAccount, getAccountName } from 'utils/accounts';
import { images } from 'utils/images';

// constants
import { defaultFiatCurrency, ETH } from 'constants/assetsConstants';
import {
  TYPE_RECEIVED,
  TYPE_ACCEPTED,
  TYPE_REJECTED,
  TYPE_SENT,
} from 'constants/invitationsConstants';
import { COLLECTIBLE_TRANSACTION } from 'constants/collectiblesConstants';
import { TRANSACTION_EVENT } from 'constants/historyConstants';
import {
  PAYMENT_NETWORK_ACCOUNT_DEPLOYMENT,
  PAYMENT_NETWORK_ACCOUNT_TOPUP,
  PAYMENT_NETWORK_ACCOUNT_WITHDRAWAL,
  PAYMENT_NETWORK_TX_SETTLEMENT,
} from 'constants/paymentNetworkConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import { USER_EVENT, PPN_INIT_EVENT, WALLET_CREATE_EVENT, WALLET_BACKUP_EVENT } from 'constants/userEventsConstants';
import { BADGE_REWARD_EVENT } from 'constants/badgesConstants';
import {
  SET_SMART_WALLET_ACCOUNT_ENS,
  SMART_WALLET_SWITCH_TO_GAS_TOKEN_RELAYER,
} from 'constants/smartWalletConstants';
import { BLOCKCHAIN_NETWORK_TYPES } from 'constants/blockchainNetworkConstants';
import {
  BADGE,
  CHAT,
  SEND_TOKEN_FROM_CONTACT_FLOW,
  TANK_FUND_FLOW,
  SEND_TOKEN_AMOUNT,
  SEND_TOKEN_FROM_HOME_FLOW,
  SEND_SYNTHETIC_ASSET,
  SETTLE_BALANCE,
  TANK_WITHDRAWAL_FLOW,
} from 'constants/navigationConstants';

// selectors
import {
  PPNTransactionsSelector,
  isPPNActivatedSelector,
} from 'selectors/paymentNetwork';
import {
  activeAccountAddressSelector,
  bitcoinAddressSelector,
  isSmartWalletActivatedSelector,
} from 'selectors';
import { assetDecimalsSelector, accountAssetsSelector } from 'selectors/assets';
import { activeBlockchainSelector } from 'selectors/selectors';

// actions
import { switchAccountAction } from 'actions/accountsActions';
import { goToInvitationFlowAction } from 'actions/referralsActions';

// types
import type { RootReducerState, Dispatch } from 'reducers/rootReducer';
import type { Rates, Assets, Asset } from 'models/Asset';
import type { ContactSmartAddressData, ApiUser } from 'models/Contacts';
import type { Theme } from 'models/Theme';
import type { EnsRegistry } from 'reducers/ensRegistryReducer';
import type { Accounts } from 'models/Account';
import type { Transaction } from 'models/Transaction';
import type { BitcoinAddress } from 'models/Bitcoin';
import type { TransactionsGroup } from 'utils/feedData';
import type { NavigationScreenProp } from 'react-navigation';

type Props = {
  theme: Theme,
  navigation: NavigationScreenProp<*>,
  event: Object,
  isVisible: boolean,
  onClose: (?(() => void)) => void,
  rejectInvitation: (event: Object) => void,
  acceptInvitation: (event: Object) => void,
  rates: Rates,
  baseFiatCurrency: ?string,
  contacts: ApiUser[],
  contactsSmartAddresses: ContactSmartAddressData[],
  user: Object,
  accounts: Accounts,
  ensRegistry: EnsRegistry,
  supportedAssets: Asset[],
  PPNTransactions: Transaction[],
  isSmartWalletActivated: boolean,
  assetDecimals: number,
  activeAccountAddress: string,
  accountAssets: Assets,
  activeBlockchainNetwork: string,
  bitcoinAddresses: BitcoinAddress[],
  switchAccount: (accountId: string) => void,
  goToInvitationFlow: (onNavigationCallback: () => void) => void,
  referralsFeatureEnabled: boolean,
  isPPNActivated: boolean,
};

type State = {
  isReceiveModalVisible: boolean,
  SWActivationModalVisible: boolean,
};

type EventData = {
  date?: number,
  name?: string,
  imageUrl?: string,
  itemImageSource?: string,
  profileImage?: string,
  iconName?: ?string,
  iconColor?: ?string,
  actionTitle?: string,
  actionSubtitle?: string,
  actionIcon?: ?string,
  actionColor?: ?string,
  customActionTitle?: React.Node,
  buttons?: Object[],
  fee?: string,
  settleEventData?: Object,
  username?: string,
  imageBorder?: boolean,
  imageBackground?: ?string,
};

const Wrapper = styled(SafeAreaView)`
  padding: 16px 0 40px;
  align-items: center;
`;

const ButtonsContainer = styled.View`
  align-self: stretch;
`;

const TokenImage = styled(CachedImage)`
  width: 64px;
  height: 64px;
  border-radius: 64px;
`;

const IconCircle = styled.View`
  width: 64px;
  height: 64px;
  border-radius: 32px;
  background-color: ${props => props.backgroundColor || themedColors.tertiary};
  align-items: center;
  justify-content: center;
  text-align: center;
  ${({ border, theme }) => border &&
  `border-color: ${theme.colors.border};
    border-width: 1px;`};
`;

const ItemIcon = styled(Icon)`
  font-size: 64px;
  color: ${({ iconColor, theme }) => iconColor || theme.colors.primary};
`;

const ActionIcon = styled(Icon)`
  margin-left: 4px;
  color: ${themedColors.secondaryText};
  ${fontStyles.large};
`;

const ActionWrapper = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

const Row = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const SettleWrapper = styled.View`
  width: 100%;
  padding: 0 ${spacing.layoutSides}px 36px;
`;

const Divider = styled.View`
  width: 100%;
  height: 1px;
  background-color: ${themedColors.tertiary};
  margin: 8px 0px 18px;
`;


class EventDetail extends React.Component<Props, State> {
  state = {
    isReceiveModalVisible: false,
    SWActivationModalVisible: false,
  };

  isReceived = ({ to: address }: Object): boolean => {
    const { activeAccountAddress, bitcoinAddresses } = this.props;
    return addressesEqual(address, activeAccountAddress) || bitcoinAddresses.some(e => e.address === address);
  };

  getRelevantAddress = (event: Object): string => {
    const isReceived = this.isReceived(event);
    return isReceived ? event.from : event.to;
  };

  getFeeLabel = () => {
    const {
      event, baseFiatCurrency, rates, assetDecimals,
    } = this.props;
    const {
      gasUsed, gasPrice, btcFee, feeWithGasToken,
    } = event;

    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    let formattedFee;

    if (!isEmpty(feeWithGasToken)) {
      return `Fee ${formatTransactionFee(feeWithGasToken.feeInWei, get(feeWithGasToken, 'gasToken'))}`;
    }

    if (gasUsed) {
      const fee = gasUsed && gasPrice ? Math.round(gasUsed * gasPrice) : 0;
      formattedFee = parseFloat(utils.formatEther(fee.toString()));
    } else {
      formattedFee = parseFloat(formatUnits(btcFee, assetDecimals));
    }
    const rate = getRate(rates, ETH, fiatCurrency);
    const formattedFiatValue = formatFiat(formattedFee * rate, fiatCurrency);
    const feeLabel = `Fee ${formattedFee} ETH (${formattedFiatValue})`;
    return feeLabel;
  }

  messageContact = (contact: ApiUser) => {
    this.props.navigation.navigate(CHAT, { username: contact.username });
    this.props.onClose();
  }

  sendTokensToContact = (contact: ApiUser) => {
    this.props.navigation.navigate(SEND_TOKEN_FROM_CONTACT_FLOW, { contact });
    this.props.onClose();
  }

  sendTokensToAddress = (address: string) => {
    const { ensRegistry } = this.props;
    this.props.navigation.navigate(SEND_TOKEN_FROM_CONTACT_FLOW, {
      contact: {
        ethAddress: address,
        username: ensRegistry[address] || address,
      },
    });
    this.props.onClose();
  }

  acceptInvitation = () => {
    const { event, onClose, acceptInvitation } = this.props;
    onClose();
    acceptInvitation(event);
  }

  rejectInvitation = () => {
    const { event, onClose, rejectInvitation } = this.props;
    createAlert(TYPE_REJECTED, event, () => {
      onClose();
      rejectInvitation(event);
    });
  }

  viewOnTheBlockchain = () => {
    const { hash, asset } = this.props.event;
    let url = TX_DETAILS_URL + hash;
    if (asset && asset === 'BTC') {
      url = BITCOIN_TX_DETAILS_URL + hash;
    }
    Linking.openURL(url);
  };

  viewBadge = () => {
    const { navigation, event, onClose } = this.props;
    const { badgeId } = event;
    onClose();
    navigation.navigate(BADGE, { badgeId });
  }

  switchToKW = async () => {
    const {
      accounts, switchAccount,
    } = this.props;
    const keyBasedAccount = accounts.find((acc) => acc.type === ACCOUNT_TYPES.KEY_BASED) || {};
    const { type: activeAccType } = getActiveAccount(accounts) || {};
    if (activeAccType !== ACCOUNT_TYPES.KEY_BASED) {
      await switchAccount(keyBasedAccount.id);
    }
  }

  switchToSW = async () => {
    const {
      accounts, switchAccount,
    } = this.props;
    const swAccount = accounts.find((acc) => acc.type === ACCOUNT_TYPES.SMART_WALLET) || {};
    const { type: activeAccType } = getActiveAccount(accounts) || {};
    if (activeAccType !== ACCOUNT_TYPES.SMART_WALLET) {
      await switchAccount(swAccount.id);
    }
  }

  showReceiveModal = () => {
    this.props.onClose(() => this.setState({ isReceiveModalVisible: true }));
  }

  topUpKeyWallet = async () => {
    await this.switchToKW();
    this.showReceiveModal();
  }

  topUpSW = async () => {
    await this.switchToSW();
    this.showReceiveModal();
  }

  referFriends = () => {
    this.props.goToInvitationFlow(this.props.onClose);
  }

  activateSW = () => {
    this.props.onClose(() => this.setState({ SWActivationModalVisible: true }));
  }

  sendETHFromKWToSW = async () => {
    const {
      onClose, navigation, accounts, accountAssets, supportedAssets,
    } = this.props;
    const SWAccount = accounts.find((acc) => acc.type === ACCOUNT_TYPES.SMART_WALLET) || {};

    const assetsData = getAssetsAsList(accountAssets);
    const assetData = getAssetData(assetsData, supportedAssets, ETH);
    const fullIconUrl = `${SDK_PROVIDER}/${assetData.iconUrl}?size=3`;
    const fullIconMonoUrl = `${SDK_PROVIDER}/${assetData.iconMonoUrl}?size=2`;

    const params = {
      assetData: {
        token: assetData.symbol,
        contractAddress: assetData.address,
        decimals: assetData.decimals,
        icon: fullIconMonoUrl,
        iconColor: fullIconUrl,
      },
      receiver: SWAccount.id,
      source: 'Home',
    };

    onClose();
    await this.switchToKW();
    navigation.navigate(SEND_TOKEN_AMOUNT, params);
  }

  topUpPillarNetwork = () => {
    const { onClose, navigation } = this.props;
    onClose();
    navigation.navigate(TANK_FUND_FLOW);
  }

  PPNwithdraw = () => {
    const { onClose, navigation } = this.props;
    onClose();
    navigation.navigate(TANK_WITHDRAWAL_FLOW);
  }

  send = () => {
    const { onClose, navigation } = this.props;
    onClose();
    navigation.navigate(SEND_TOKEN_FROM_HOME_FLOW);
  }

  sendSynthetic = () => {
    const { onClose, navigation } = this.props;
    onClose();
    navigation.navigate(SEND_SYNTHETIC_ASSET);
  }

  settle = () => {
    const { onClose, navigation } = this.props;
    onClose();
    navigation.navigate(SETTLE_BALANCE);
  }

  getWalletCreatedEventData = (event: Object): ?EventData => {
    const { theme, isSmartWalletActivated } = this.props;
    const { keyWalletIcon, smartWalletIcon } = images(theme);
    const keyWalletButtons = [
      {
        title: 'Top up',
        onPress: this.topUpKeyWallet,
        secondary: true,
      },
      {
        title: 'Refer friends',
        onPress: this.referFriends,
        squarePrimary: true,
      },
    ];

    switch (event.eventTitle) {
      case 'Wallet created':
        return {
          name: 'Key wallet',
          itemImageSource: keyWalletIcon,
          actionTitle: 'Created',
          buttons: keyWalletButtons,
        };
      case 'Smart Wallet created':
        const activateButton = {
          title: 'Activate',
          onPress: this.activateSW,
          secondary: true,
        };

        const topUpButton = {
          title: 'Top Up',
          onPress: this.topUpSW,
          secondary: true,
        };

        const topUpButtonSecondary = {
          title: 'Top Up',
          onPress: this.topUpSW,
          squarePrimary: true,
        };

        return {
          name: 'Smart Wallet',
          itemImageSource: smartWalletIcon,
          actionTitle: 'Created',
          buttons: isSmartWalletActivated ? [topUpButton] : [activateButton, topUpButtonSecondary],
        };
      case 'Wallet imported':
        return {
          name: 'Key wallet',
          itemImageSource: keyWalletIcon,
          actionTitle: 'Imported',
          primaryButtonTitle: 'Top up',
          secondaryButtonTitle: 'Refer friends',
          buttons: keyWalletButtons,
        };
      default:
        return null;
    }
  }

  getUserEventData = (event: Object): ?EventData => {
    const { theme, isPPNActivated } = this.props;
    const { PPNIcon, keyWalletIcon } = images(theme);

    switch (event.subType) {
      case WALLET_CREATE_EVENT:
        return this.getWalletCreatedEventData(event);
      case PPN_INIT_EVENT:
        if (isPPNActivated) {
          return {
            name: 'Pillar Network',
            itemImageSource: PPNIcon,
            actionTitle: 'Activated',
            buttons: [
              {
                title: 'Send',
                onPress: this.sendSynthetic,
                secondary: true,
              },
              {
                title: 'Top up',
                onPress: this.topUpPillarNetwork,
                squarePrimary: true,
              },
            ],
          };
        }
        return {
          name: 'Pillar Network',
          itemImageSource: PPNIcon,
          actionTitle: 'Created',
          buttons: [
            {
              title: 'Activate',
              onPress: this.topUpPillarNetwork,
            },
          ],
        };

      case WALLET_BACKUP_EVENT:
        return {
          name: 'Key wallet',
          itemImageSource: keyWalletIcon,
          actionTitle: 'Backup secured',
          buttons: [
            {
              title: 'Top up',
              onPress: this.topUpKeyWallet,
              secondary: true,
            },
            {
              title: 'Refer friends',
              onPress: this.referFriends,
              squarePrimary: true,
            },
          ],
        };
      default:
        return null;
    }
  };

  getTransactionEventData = (event: Object): ?EventData => {
    const {
      ensRegistry,
      activeBlockchainNetwork,
      assetDecimals,
      accounts,
      contacts,
      contactsSmartAddresses,
      theme,
      isPPNActivated,
    } = this.props;
    const isReceived = this.isReceived(event);
    const value = formatUnits(event.value, assetDecimals);
    const relevantAddress = this.getRelevantAddress(event);
    const contact = findMatchingContact(relevantAddress, contacts, contactsSmartAddresses) || {};
    const avatarUrl = contact && contact.profileImage;
    const { smartWalletIcon, PPNIcon } = images(theme);

    const formattedValue = formatAmount(value);

    const directionIcon = isReceived ? 'received' : 'sent';
    let directionSymbol = isReceived ? '+' : '-';

    if (formattedValue === '0') {
      directionSymbol = '';
    }

    const isPending = isPendingTransaction(event);

    let eventData: ?EventData = null;

    switch (event.tag) {
      case PAYMENT_NETWORK_ACCOUNT_DEPLOYMENT:
        const activatePillarNetworkButton = {
          title: 'Activate Pillar Network',
          onPress: this.topUpPillarNetwork,
          secondary: true,
        };

        const referFriendsButton = {
          title: 'Refer friends',
          onPress: this.referFriends,
          secondary: true,
        };

        const referFriendsButtonSecondary = {
          title: 'Refer friends',
          onPress: this.referFriends,
          squarePrimary: true,
        };

        return {
          name: 'Smart Wallet',
          itemImageSource: smartWalletIcon,
          actionTitle: 'Activated',
          actionSubtitle: this.getFeeLabel(),
          buttons: isPPNActivated ? [referFriendsButton] : [activatePillarNetworkButton, referFriendsButtonSecondary],
        };
      case PAYMENT_NETWORK_ACCOUNT_TOPUP:
        if (activeBlockchainNetwork === BLOCKCHAIN_NETWORK_TYPES.PILLAR_NETWORK) {
          return {
            name: 'Pillar Network',
            itemImageSource: PPNIcon,
            actionTitle: `+ ${formattedValue} ${event.asset}`,
            actionColor: this.getColor('positive'),
            actionSubtitle: 'Top up',
            buttons: [
              {
                title: 'Send',
                onPress: this.sendSynthetic,
                secondary: true,
              },
              {
                title: 'Top up more',
                onPress: this.topUpPillarNetwork,
                squarePrimary: true,
              },
            ],
          };
        }
        return {
          name: 'Pillar Network',
          iconName: 'sent',
          iconColor: this.getColor('negative'),
          actionTitle: `- ${formattedValue} ${event.asset}`,
          actionSubtitle: 'from Smart Wallet',
          buttons: [
            {
              title: 'Top up more',
              onPress: this.topUpPillarNetwork,
              secondary: true,
            },
          ],
        };
      case SET_SMART_WALLET_ACCOUNT_ENS:
        return {
          name: 'ENS name',
          itemImageSource: smartWalletIcon,
          actionTitle: 'Registered',
          actionSubtitle: event.extra.ensName,
          buttons: [
            {
              title: 'View on the blockchain',
              onPress: this.viewOnTheBlockchain,
              secondary: true,
            },
          ],
        };
      case PAYMENT_NETWORK_ACCOUNT_WITHDRAWAL:
        return {
          name: 'Smart Wallet',
          iconName: 'sent',
          iconColor: this.getColor('negative'),
          actionTitle: `- ${formattedValue} ${event.asset}`,
          actionSubtitle: 'from Pillar Tank',
          buttons: [
            {
              title: 'Withdraw more',
              onPress: this.PPNwithdraw,
              secondary: true,
            },
          ],
        };
      case PAYMENT_NETWORK_TX_SETTLEMENT:
        return {
          name: 'Settle',
          itemImageSource: PPNIcon,
          settleEventData: event,
          buttons: [
            {
              title: 'Settle more',
              onPress: this.settle,
              secondary: true,
            },
          ],
        };
      case SMART_WALLET_SWITCH_TO_GAS_TOKEN_RELAYER:
        return {
          name: 'Smart Wallet fees with PLR',
          itemImageSource: smartWalletIcon,
          actionTitle: 'Enabled',
          buttons: [
            {
              title: 'View on the blockchain',
              onPress: this.viewOnTheBlockchain,
              secondary: true,
            },
          ],
        };
      default:
        const usernameOrAddress = event.username
          || ensRegistry[relevantAddress]
          || elipsizeAddress(relevantAddress);
        const isPPNTransaction = get(event, 'isPPNTransaction', false);
        let subtext = getAccountName(event.accountType);
        const keyWallet = getAccountName(ACCOUNT_TYPES.KEY_BASED);
        const smartWallet = getAccountName(ACCOUNT_TYPES.SMART_WALLET);
        if (isReceived && isSWAddress(event.from, accounts) && isKWAddress(event.to, accounts)) {
          subtext = `to ${keyWallet}`;
        } else if (isReceived && isKWAddress(event.from, accounts) && isSWAddress(event.to, accounts)) {
          subtext = `to ${smartWallet}`;
        } else if (!isReceived && isSWAddress(event.from, accounts) && isKWAddress(event.to, accounts)) {
          subtext = `from ${smartWallet}`;
        } else if (!isReceived && isKWAddress(event.from, accounts) && isSWAddress(event.to, accounts)) {
          subtext = `from ${keyWallet}`;
        }

        if (isPPNTransaction) {
          eventData = {
            name: usernameOrAddress,
            profileImage: avatarUrl,
            customActionTitle: (
              <TankAssetBalance
                amount={`${directionSymbol} ${formattedValue} ${event.asset}`}
                textStyle={{ fontSize: fontSizes.large }}
                iconStyle={{ height: 14, width: 8, marginRight: 9 }}
              />
            ),
            actionSubtitle: 'Pillar Network',
            username: usernameOrAddress,
          };

          if (isReceived) {
            eventData.buttons = [
              {
                title: 'Message',
                onPress: () => this.messageContact(contact),
                secondary: true,
              },
              {
                title: 'Send back',
                onPress: this.sendSynthetic,
                squarePrimary: true,
              },
            ];
          } else {
            eventData.buttons = [
              {
                title: 'Send more',
                onPress: this.sendSynthetic,
                secondary: true,
              },
            ];
          }
        } else {
          eventData = {
            name: usernameOrAddress,
            iconName: !avatarUrl ? directionIcon : null,
            iconColor: this.getColor(isReceived ? 'transactionReceivedIcon' : 'negative'),
            profileImage: avatarUrl,
            username: usernameOrAddress,
            actionTitle: `${directionSymbol} ${formattedValue} ${event.asset}`,
            actionSubtitle: subtext,
            actionColor: this.getColor(isReceived && formattedValue !== '0' ? 'positive' : 'text'),
          };

          let buttons = [];
          const contactFound = Object.keys(contact).length > 0;

          const messageButton = {
            title: 'Message',
            onPress: () => this.messageContact(contact),
            secondary: true,
          };

          const viewOnBlockchainButton = {
            title: 'View on the blockchain',
            onPress: this.viewOnTheBlockchain,
            secondary: true,
          };

          const viewOnBlockchainButtonSecondary = {
            title: 'View on the blockchain',
            onPress: this.viewOnTheBlockchain,
            squarePrimary: true,
          };

          const sendBackButtonSecondary = {
            title: 'Send back',
            onPress: () => this.sendTokensToContact(contact),
            squarePrimary: true,
          };

          const inviteToPillarButton = {
            title: 'Invite to Pillar',
            onPress: this.referFriends,
            squarePrimary: true,
          };

          const sendMoreButtonSecondary = {
            title: 'Send more',
            onPress: () => this.sendTokensToContact(contact),
            squarePrimary: true,
          };

          const sendBackToAddress = {
            title: 'Send back',
            onPress: () => this.sendTokensToAddress(relevantAddress),
            secondary: true,
          };

          const sendMoreToAddress = {
            title: 'Send more',
            onPress: () => this.sendTokensToAddress(relevantAddress),
            secondary: true,
          };

          const send = {
            title: 'Send',
            onPress: this.send,
            secondary: true,
          };

          const topUpMore = {
            title: 'Top up more',
            onPress: this.sendETHFromKWToSW,
            squarePrimary: true,
          };

          if (isReceived) {
            if (isKWAddress(event.from, accounts) && isSWAddress(event.to, accounts)) {
              buttons = [send, topUpMore];
            } else if (contactFound) {
              if (isPending) {
                buttons = [messageButton, viewOnBlockchainButtonSecondary];
              } else {
                buttons = [messageButton, sendBackButtonSecondary];
              }
            } else if (isPending) {
              buttons = [viewOnBlockchainButton, inviteToPillarButton];
            } else {
              buttons = [sendBackToAddress, inviteToPillarButton];
            }
          } else if (contactFound) {
            if (isPending) {
              buttons = [messageButton, viewOnBlockchainButtonSecondary];
            } else {
              buttons = [messageButton, sendMoreButtonSecondary];
            }
          } else if (isPending) {
            buttons = [viewOnBlockchainButton, inviteToPillarButton];
          } else {
            buttons = [sendMoreToAddress, inviteToPillarButton];
          }
          eventData.buttons = buttons;
          if (!isReceived) {
            eventData.fee = this.getFeeLabel();
          }
        }
        if (isPending) {
          eventData.actionIcon = 'pending';
        }
        if (activeBlockchainNetwork === 'BITCOIN') {
          eventData.actionSubtitle = isReceived ? 'to Bitcoin wallet' : 'from Bitcoin wallet';
        }
        return eventData;
    }
  }

  getCollectibleTransactionEventData = (event: Object): EventData => {
    const { contacts } = this.props;
    const isReceived = this.isReceived(event);
    const { asset, icon } = event;
    const relevantAddress = this.getRelevantAddress(event);
    const usernameOrAddress = getUsernameOrAddress(event, relevantAddress, contacts);

    let eventData: EventData = {
      name: asset,
      imageUrl: icon,
      imageBackground: this.getColor('card'),
      imageBorder: true,
    };

    if (isReceived) {
      eventData = {
        ...eventData,
        actionTitle: 'Received',
        actionSubtitle: `Collectible from ${usernameOrAddress}`,
        buttons: [
          {
            title: 'View on the Blockchain',
            onPress: this.viewOnTheBlockchain,
            secondary: true,
          },
        ],
      };
    } else {
      eventData = {
        ...eventData,
        actionTitle: 'Sent',
        actionSubtitle: `Collectible to ${usernameOrAddress}`,
      };
    }

    if (isPendingTransaction(event)) {
      eventData.actionIcon = 'pending';
    }

    return eventData;
  }

  getBadgeRewardEventData = (event: Object): EventData => {
    const { name, imageUrl } = event;

    const viewBadgeButton = {
      title: 'View badge',
      onPress: this.viewBadge,
      secondary: true,
    };

    const viewOnBlockchainButton = {
      title: 'View on the blockchain',
      onPress: this.viewOnTheBlockchain,
      squarePrimary: true,
    };

    const isPending = isPendingTransaction(event);

    return {
      name,
      imageUrl,
      actionTitle: 'Received',
      actionSubtitle: 'Badge',
      actionIcon: isPending ? 'pending' : null,
      buttons: isPending ? [viewBadgeButton] : [viewBadgeButton, viewOnBlockchainButton],
    };
  }

  getSocialEventData = (event: Object): ?EventData => {
    const { contacts } = this.props;
    const { type, username, profileImage } = event;
    const acceptedContact = contacts.find(contact => contact.username === username);

    if (type === TYPE_RECEIVED) {
      return {
        name: username,
        profileImage,
        actionTitle: 'Connection request',
        buttons: [
          {
            title: 'Accept',
            onPress: this.acceptInvitation,
            secondary: true,
          },
          {
            title: 'Reject',
            onPress: this.rejectInvitation,
            secondaryDanger: true,
          },
        ],
        username,
      };
    }

    if (!acceptedContact) return null;

    if (type === TYPE_ACCEPTED) {
      return {
        name: username,
        profileImage,
        actionTitle: 'Connected',
        buttons: [
          {
            title: 'Message',
            onPress: () => this.messageContact(acceptedContact),
            secondary: true,
          },
          {
            title: 'Send tokens',
            onPress: () => this.sendTokensToContact(acceptedContact),
            squarePrimary: true,
          },
        ],
        username,
      };
    }

    return null;
  }

  getEventData = (event: Object): ?EventData => {
    let eventData = null;
    switch (event.type) {
      case USER_EVENT:
        eventData = this.getUserEventData(event);
        break;
      case TRANSACTION_EVENT:
        eventData = this.getTransactionEventData(event);
        break;
      case COLLECTIBLE_TRANSACTION:
        eventData = this.getCollectibleTransactionEventData(event);
        break;
      case BADGE_REWARD_EVENT:
        eventData = this.getBadgeRewardEventData(event);
        break;
      case TYPE_SENT:
      case TYPE_RECEIVED:
      case TYPE_ACCEPTED:
        eventData = this.getSocialEventData(event);
        break;
      default:
        eventData = null;
    }
    if (eventData) {
      eventData = {
        ...eventData,
        date: event.createdAt,
      };
    }
    return eventData;
  }

  renderImage = (eventData) => {
    const { theme } = this.props;
    const {
      imageUrl, itemImageSource, profileImage, username, iconName, iconColor, imageBackground, imageBorder,
    } = eventData;
    const { genericToken: fallbackSource } = images(theme);
    if (imageUrl) {
      return (
        <IconCircle border={imageBorder} backgroundColor={imageBackground}>
          <TokenImage source={{ uri: imageUrl }} fallbackSource={fallbackSource} />
        </IconCircle>
      );
    }
    if (itemImageSource) {
      return <TokenImage source={itemImageSource} />;
    }
    if (iconName) {
      return (
        <IconCircle>
          <ItemIcon name={iconName} iconColor={iconColor} />
        </IconCircle>
      );
    }

    return (
      <ProfileImage
        uri={profileImage}
        userName={username}
        noShadow
        borderWidth={0}
        diameter={64}
      />
    );
  }

  getColor = (color: ?string): ?string => {
    if (!color) return null;
    const { theme } = this.props;
    const colors = getThemeColors(theme);
    return colors[color] || color;
  }

  renderSettle = (settleEventData) => {
    const { PPNTransactions } = this.props;
    const mappedTransactions = settleEventData.extra.map(({ hash }) => PPNTransactions.find(tx => tx.hash === hash));
    const groupedTransactions: TransactionsGroup[] = groupPPNTransactions(mappedTransactions);

    return (
      <SettleWrapper>
        {groupedTransactions.map(group => (
          <React.Fragment key={group.symbol}>
            <Row marginBottom={10}>
              <BaseText regular synthetic>From Pillar Tank</BaseText>
              <TankAssetBalance
                amount={`- ${formatUnits(group.value.toString(), 18)} ${group.symbol}`}
                textStyle={{ fontSize: fontSizes.big }}
                iconStyle={{ height: 14, width: 8, marginRight: 9 }}
              />
            </Row>
            {group.transactions.map(({
              createdAt, asset, value, hash,
            }) => {
              const formattedDate = formatDate(new Date(createdAt * 1000), 'MMM D HH:mm');
              const formattedAmount = formatAmount(formatUnits(value.toString(), 18));
              return (
                <Row marginBottom={13} key={hash}>
                  <BaseText secondary tiny>{formattedDate}</BaseText>
                  <BaseText secondary small>-{formattedAmount} {asset}</BaseText>
                </Row>
              );
            })}
          </React.Fragment>
        ))}
        <Divider />
        <Row>
          <BaseText regular positive>To Smart Wallet</BaseText>
          <View>
            {groupedTransactions.map(({ value, symbol }) => (
              <BaseText positive large key={symbol}>+ {formatUnits(value.toString(), 18)} {symbol}</BaseText>
            ))}
          </View>
        </Row>
      </SettleWrapper>
    );
  };

  render() {
    const {
      isVisible, onClose, event, activeAccountAddress, navigation, referralsFeatureEnabled,
    } = this.props;
    const {
      isReceiveModalVisible,
      SWActivationModalVisible,
    } = this.state;

    const eventData = this.getEventData(event);
    if (!eventData) return null;
    const {
      date, name,
      actionTitle, actionSubtitle, actionIcon, actionColor, customActionTitle,
      buttons = [], settleEventData, fee,
    } = eventData;

    const filteredButtons = referralsFeatureEnabled ?
      buttons :
      buttons.filter(button => button.onPress !== this.referFriends);

    const eventTime = date && formatDate(new Date(date * 1000), 'MMMM D, YYYY HH:mm');

    return (
      <React.Fragment>
        <SlideModal
          isVisible={isVisible}
          onModalHide={onClose}
          noClose
          hideHeader
        >
          <Wrapper forceInset={{ top: 'never', bottom: 'always' }}>
            <BaseText tiny secondary>{eventTime}</BaseText>
            <Spacing h={10} />
            <BaseText medium>{name}</BaseText>
            <Spacing h={20} />
            {this.renderImage(eventData)}
            <Spacing h={20} />
            {settleEventData ? this.renderSettle(settleEventData) : (
              <React.Fragment>
                <ActionWrapper>
                  {!!actionTitle && <MediumText large color={actionColor}>{actionTitle}</MediumText>}
                  {customActionTitle}
                  {!!actionIcon && <ActionIcon name={actionIcon} />}
                </ActionWrapper>
                {actionSubtitle ? (
                  <React.Fragment>
                    <Spacing h={4} />
                    <BaseText regular secondary>{actionSubtitle}</BaseText>
                    <Spacing h={24} />
                  </React.Fragment>
                ) : (
                  <Spacing h={32} />
                )}
                {!!fee && (
                  <React.Fragment>
                    <BaseText regular secondary>{fee}</BaseText>
                    <Spacing h={32} />
                  </React.Fragment>
                )}
              </React.Fragment>
            )}
            <ButtonsContainer>
              {filteredButtons.map(buttonProps => (
                <React.Fragment key={buttonProps.title} >
                  <Button regularText {...buttonProps} />
                  <Spacing h={4} />
                </React.Fragment>
              ))}
            </ButtonsContainer>
          </Wrapper>
        </SlideModal>
        <ReceiveModal
          isVisible={isReceiveModalVisible}
          address={activeAccountAddress}
          onModalHide={() => this.setState({ isReceiveModalVisible: false })}
        />
        <SWActivationModal
          isVisible={SWActivationModalVisible}
          onClose={() => this.setState({ SWActivationModalVisible: false })}
          navigation={navigation}
        />
      </React.Fragment>
    );
  }
}

const mapStateToProps = ({
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency } },
  contacts: { data: contacts, contactsSmartAddresses: { addresses: contactsSmartAddresses } },
  user: { data: user },
  accounts: { data: accounts },
  ensRegistry: { data: ensRegistry },
  assets: { supportedAssets },
  featureFlags: { data: { REFERRALS_ENABLED: referralsFeatureEnabled } },
}: RootReducerState): $Shape<Props> => ({
  rates,
  baseFiatCurrency,
  contacts,
  contactsSmartAddresses,
  user,
  accounts,
  ensRegistry,
  supportedAssets,
  referralsFeatureEnabled,
});

const structuredSelector = createStructuredSelector({
  PPNTransactions: PPNTransactionsSelector,
  isSmartWalletActivated: isSmartWalletActivatedSelector,
  assetDecimals: assetDecimalsSelector((_, props) => props.event.asset),
  activeAccountAddress: activeAccountAddressSelector,
  accountAssets: accountAssetsSelector,
  activeBlockchainNetwork: activeBlockchainSelector,
  bitcoinAddresses: bitcoinAddressSelector,
  isPPNActivated: isPPNActivatedSelector,
});

const combinedMapStateToProps = (state: RootReducerState, props: Props): $Shape<Props> => ({
  ...structuredSelector(state, props),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  switchAccount: (accountId: string) => dispatch(switchAccountAction(accountId)),
  goToInvitationFlow: (onNavigationCallback: () => void) => dispatch(goToInvitationFlowAction(onNavigationCallback)),
});

export default withTheme(connect(combinedMapStateToProps, mapDispatchToProps)(EventDetail));
