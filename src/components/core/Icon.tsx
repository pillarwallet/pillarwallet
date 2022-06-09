// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

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
/* eslint-disable i18next/no-literal-string */

import * as React from 'react';
import { View } from 'react-native';

// Utils
import { useThemeColors } from 'utils/themes';

// Types
import type { ViewStyleProp } from 'utils/types/react-native';
import type { SvgImage } from 'utils/types/svg-stub';
import type { Record } from 'utils/object';

// Assets: generic icons
import IconAddCash from 'assets/icons/svg/icon-24-add-cash.svg';
import IconAddContact from 'assets/icons/svg/icon-24-add-contact.svg';
import IconArrowRight from 'assets/icons/svg/icon-24-arrow-right.svg';
import IconArrowDown from 'assets/icons/svg/icon-24-arrow-down.svg';
import IconArrowLeft from 'assets/icons/svg/icon-24-arrow-left.svg';
import IconArrowUp from 'assets/icons/svg/icon-24-arrow-up.svg';
import IconArrowUpDown from 'assets/icons/svg/icon-24-arrow-up-down.svg';
import IconBiometrics16 from 'assets/icons/svg/icon-16-biometrics.svg';
import IconBullet from 'assets/icons/svg/icon-24-bullet.svg';
import IconCancel from 'assets/icons/svg/icon-24-cancel.svg';
import IconCheckmark from 'assets/icons/svg/icon-24-checkmark.svg';
import IconChevronDown from 'assets/icons/svg/icon-24-chevron-down.svg';
import IconChevronRight from 'assets/icons/svg/icon-24-chevron-right.svg';
import IconChevronUp from 'assets/icons/svg/icon-24-chevron-up.svg';
import IconChevronLeftLarge from 'assets/icons/svg/icon-24-chevron-left-large.svg';
import IconChevronRightLarge from 'assets/icons/svg/icon-24-chevron-right-large.svg';
import IconCloseCircle from 'assets/icons/svg/icon-24-close-circle.svg';
import IconClose from 'assets/icons/svg/icon-24-close.svg';
import IconCollectible from 'assets/icons/svg/icon-24-collectible.svg';
import IconContacts from 'assets/icons/svg/icon-24-contacts.svg';
import IconCopy from 'assets/icons/svg/icon-24-copy.svg';
import IconCurrency16 from 'assets/icons/svg/icon-16-currency.svg';
import IconDarkMode16 from 'assets/icons/svg/icon-16-dark-mode.svg';
import IconDataset from 'assets/icons/svg/icon-24-dataset.svg';
import IconDeposit from 'assets/icons/svg/icon-24-deposit.svg';
import IconDots from 'assets/icons/svg/icon-24-dots.svg';
import IconEqual from 'assets/icons/svg/icon-24-equal.svg';
import IconExchange from 'assets/icons/svg/icon-24-exchange.svg';
import IconFailed from 'assets/icons/svg/icon-24-failed.svg';
import IconGift from 'assets/icons/svg/icon-24-gift.svg';
import IconHighFees from 'assets/icons/svg/icon-24-high-fees.svg';
import IconHistory from 'assets/icons/svg/icon-24-history.svg';
import IconImage from 'assets/icons/svg/icon-24-image.svg';
import IconInfo from 'assets/icons/svg/icon-24-info.svg';
import IconInvestment from 'assets/icons/svg/icon-24-investment.svg';
import IconKey from 'assets/icons/svg/icon-24-key.svg';
import IconKey16 from 'assets/icons/svg/icon-16-key.svg';
import IconLanguage16 from 'assets/icons/svg/icon-16-language.svg';
import IconLifebuoy from 'assets/icons/svg/icon-24-lifebuoy.svg';
import IconLiquidityPool from 'assets/icons/svg/icon-24-liquidity-pool.svg';
import IconLogout from 'assets/icons/svg/icon-24-logout.svg';
import IconMail from 'assets/icons/svg/icon-24-mail.svg';
import IconMenu from 'assets/icons/svg/icon-24-menu.svg';
import IconMessage from 'assets/icons/svg/icon-16-message.svg';
import IconMinus from 'assets/icons/svg/icon-24-minus.svg';
import IconMute from 'assets/icons/svg/icon-24-mute.svg';
import IconNote from 'assets/icons/svg/icon-24-note.svg';
import IconPending from 'assets/icons/svg/icon-24-pending.svg';
import IconPercentCircle from 'assets/icons/svg/icon-24-percent-circle.svg';
import IconPhone from 'assets/icons/svg/icon-24-phone.svg';
import IconPin16 from 'assets/icons/svg/icon-16-pin.svg';
import IconPlus from 'assets/icons/svg/icon-24-plus.svg';
import IconProfile from 'assets/icons/svg/icon-48-profile.svg';
import IconPower from 'assets/icons/svg/icon-24-power.svg';
import IconQrCode from 'assets/icons/svg/icon-24-qrcode.svg';
import IconReward from 'assets/icons/svg/icon-24-reward.svg';
import IconQuestion from 'assets/icons/svg/icon-24-question.svg';
import IconRecovery from 'assets/icons/svg/icon-24-recovery.svg';
import IconRefresh from 'assets/icons/svg/icon-24-refresh.svg';
import IconSearch from 'assets/icons/svg/icon-24-search.svg';
import IconSelect from 'assets/icons/svg/icon-24-select.svg';
import IconSendDown from 'assets/icons/svg/icon-24-send-down.svg';
import IconSend from 'assets/icons/svg/icon-24-send.svg';
import IconSettings from 'assets/icons/svg/icon-24-settings.svg';
import IconSetttlement from 'assets/icons/svg/icon-24-settlement.svg';
import IconSort from 'assets/icons/svg/icon-24-sort-ascending.svg';
import IconSynthetic from 'assets/icons/svg/icon-24-synthetic.svg';
import IconThumbUp from 'assets/icons/svg/icon-24-thumb-up.svg';
import IconUser from 'assets/icons/svg/icon-24-user.svg';
import IconWallet from 'assets/icons/svg/icon-24-wallet.svg';
import IconWarning from 'assets/icons/svg/icon-24-warning.svg';
import IconWithdraw from 'assets/icons/svg/icon-24-withdraw.svg';
import IconAlert from 'assets/icons/svg/icon-24-circle-filled-alert.svg';
import IconCheckedRadio from 'assets/icons/svg/form-radio-button-focus-dark.svg';
import IconUncheckedRadio from 'assets/icons/svg/form-radio-button-normal-dark.svg';
import IconPillarBrowser from 'assets/icons/svg/icon-24-pillar-browser.svg';
import IconPillarBrowserDark from 'assets/icons/svg/icon-24-pillar-browser-dark.svg';
import IconOpenLink from 'assets/icons/svg/icon-24-open-link.svg';
import IconSmallWarning from 'assets/icons/svg/icon-16-warning.svg';
import IconEnsMigration from 'assets/icons/svg/icon-24-ens.svg';
import IconAssetMigration from 'assets/icons/svg/icon-24-assets.svg';
import IconEnsMigrationDark from 'assets/icons/svg/icon-24-ens-dark.svg';
import IconAssetMigrationDark from 'assets/icons/svg/icon-24-assets-dark.svg';
import IconApps from 'assets/icons/svg/icon-apps.svg';
import InvestIcon from 'assets/icons/svg/24-dashboard-investments.svg';
import SelectedRadioButton from 'assets/icons/svg/form-radio-button-focus-light.svg';
import RadioButton from 'assets/icons/svg/form-radio-button-normal-light.svg';
import DeployLightIcon from 'assets/icons/svg/24-circle-filled-alert-light.svg';
import DeployIcon from 'assets/icons/svg/24-circle-filled-alert.svg';
import ExclamationLight from 'assets/icons/svg/exclamationLight.svg';

// Assets: services icons
import IconEthereum from 'assets/icons/svg/icon-24-ethereum.svg';
import IconBinance from 'assets/icons/svg/icon-24-binance.svg';
import IconXdai from 'assets/icons/svg/icon-24-xdai.svg';
import IconPolygon from 'assets/icons/svg/icon-24-polygon.svg';
import IconAvalanche from 'assets/icons/svg/icon-24-avalanche.svg';
import IconWalletConnect from 'assets/icons/svg/icon-24-wallet-connect.svg';
import IconAllNetworks from 'assets/icons/svg/services-48-circle-pillar-exchange.svg';
import IconAllNetworksLight from 'assets/icons/svg/services-48-circle-pillar-exchange-light.svg';

const components = {
  // Generic icons
  'add-cash': IconAddCash,
  'add-contact': IconAddContact,
  'arrow-right': IconArrowRight,
  'arrow-down': IconArrowDown,
  'arrow-left': IconArrowLeft,
  'arrow-up': IconArrowUp,
  'arrow-up-down': IconArrowUpDown,
  biometrics16: IconBiometrics16,
  bullet: IconBullet,
  cancel: IconCancel,
  checkmark: IconCheckmark,
  'chevron-down': IconChevronDown,
  'chevron-right': IconChevronRight,
  'chevron-up': IconChevronUp,
  'chevron-left-large': IconChevronLeftLarge,
  'chevron-right-large': IconChevronRightLarge,
  'close-circle': IconCloseCircle,
  close: IconClose,
  collectible: IconCollectible,
  contacts: IconContacts,
  copy: IconCopy,
  currency16: IconCurrency16,
  darkMode16: IconDarkMode16,
  dataset: IconDataset,
  deposit: IconDeposit,
  dots: IconDots,
  equal: IconEqual,
  exchange: IconExchange,
  failed: IconFailed,
  gift: IconGift,
  'high-fees': IconHighFees,
  history: IconHistory,
  image: IconImage,
  info: IconInfo,
  investment: IconInvestment,
  key: IconKey,
  key16: IconKey16,
  language16: IconLanguage16,
  lifebuoy: IconLifebuoy,
  'liquidity-pool': IconLiquidityPool,
  logout: IconLogout,
  mail: IconMail,
  menu: IconMenu,
  message: IconMessage,
  minus: IconMinus,
  mute: IconMute,
  note: IconNote,
  pending: IconPending,
  'percent-circle': IconPercentCircle,
  phone: IconPhone,
  pin16: IconPin16,
  plus: IconPlus,
  profile: IconProfile,
  power: IconPower,
  qrcode: IconQrCode,
  reward: IconReward,
  question: IconQuestion,
  recovery: IconRecovery,
  refresh: IconRefresh,
  search: IconSearch,
  select: IconSelect,
  'send-down': IconSendDown,
  send: IconSend,
  settings: IconSettings,
  settlement: IconSetttlement,
  sort: IconSort,
  synthetic: IconSynthetic,
  'thumb-up': IconThumbUp,
  user: IconUser,
  wallet: IconWallet,
  warning: IconWarning,
  withdraw: IconWithdraw,
  alert: IconAlert,
  'checked-radio': IconCheckedRadio,
  'unchecked-radio': IconUncheckedRadio,
  'pillar-browser': IconPillarBrowser,
  'pillar-browser-dark': IconPillarBrowserDark,
  'open-link': IconOpenLink,
  'small-warning': IconSmallWarning,
  'ens-migration': IconEnsMigration,
  'asset-migration': IconAssetMigration,
  'ens-migration-dark': IconEnsMigrationDark,
  'asset-migration-dark': IconAssetMigrationDark,
  apps: IconApps,
  invest: InvestIcon,
  'selected-radio-button': SelectedRadioButton,
  'radio-button': RadioButton,
  'deploy-light': DeployLightIcon,
  deploy: DeployIcon,
  'exclamation-round-light': ExclamationLight,

  // Service icons
  binance: IconBinance,
  ethereum: IconEthereum,
  polygon: IconPolygon,
  xdai: IconXdai,
  avalanche: IconAvalanche,
  'wallet-connect': IconWalletConnect,
  'all-networks': IconAllNetworks,
  'all-networks-light': IconAllNetworksLight,
};

export type IconName = keyof typeof components;

type Props = {
  name: IconName;
  color?: string;
  width?: number;
  height?: number;
  style?: ViewStyleProp;
};

/**
 * Modern component to display SVG icons.
 *
 * In order to add new icon:
 * 1. Add icon file to assets/icons/svg/
 * 2. Make sure that the color that is to be tinted is #000 in the icon SVG file
 * 3. Add import and `components` entry above
 *
 * @note Use it only for small icon-like images.
 * @note Be aware that the #000 will be replaced by `basic010` color by default or by `color` prop.
 */
const Icon: React.FC<Props> = ({ name, color, style, ...rest }) => {
  const colors = useThemeColors();

  const Component = components[name];
  return Component ? (
    <View style={style}>
      <Component fill={color ?? colors.basic010} {...rest} />
    </View>
  ) : null;
};

export default Icon;
