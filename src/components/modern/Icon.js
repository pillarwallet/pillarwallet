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

import * as React from 'react';

// Utils
import { useThemeColors } from 'utils/themes';

// Assets
import IconAddCash from 'assets/icons/svg/icon-24-add-cash.svg';
import IconAddContact from 'assets/icons/svg/icon-24-add-contact.svg';
import IconArrowRight from 'assets/icons/svg/icon-24-arrow-right.svg';
import IconArrowDown from 'assets/icons/svg/icon-24-arrow-down.svg';
import IconArrowLeft from 'assets/icons/svg/icon-24-arrow-left.svg';
import IconArrowUp from 'assets/icons/svg/icon-24-arrow-up.svg';
import IconBullet from 'assets/icons/svg/icon-24-bullet.svg';
import IconCancel from 'assets/icons/svg/icon-24-cancel.svg';
import IconCheckmark from 'assets/icons/svg/icon-24-checkmark.svg';
import IconChevronDown from 'assets/icons/svg/icon-24-chevron-down.svg';
import IconChevronRight from 'assets/icons/svg/icon-24-chevron-right.svg';
import IconChevronUp from 'assets/icons/svg/icon-24-chevron-up.svg';
import IconCloseCircle from 'assets/icons/svg/icon-24-close-circle.svg';
import IconClose from 'assets/icons/svg/icon-24-close.svg';
import IconCollectible from 'assets/icons/svg/icon-24-collectible.svg';
import IconContacts from 'assets/icons/svg/icon-24-contacts.svg';
import IconCopy from 'assets/icons/svg/icon-24-copy.svg';
import IconDeposit from 'assets/icons/svg/icon-24-deposit.svg';
import IconDots from 'assets/icons/svg/icon-24-dots.svg';
import IconEqual from 'assets/icons/svg/icon-24-equal.svg';
import IconExchange from 'assets/icons/svg/icon-24-exchange.svg';
import IconFailed from 'assets/icons/svg/icon-24-failed.svg';
import IconGift from 'assets/icons/svg/icon-24-gift.svg';
import IconHighFees from 'assets/icons/svg/icon-24-high-fees.svg';
import IconImage from 'assets/icons/svg/icon-24-image.svg';
import IconInfo from 'assets/icons/svg/icon-24-info.svg';
import IconInvestment from 'assets/icons/svg/icon-24-investment.svg';
import IconKey from 'assets/icons/svg/icon-24-key.svg';
import IconLifebuoy from 'assets/icons/svg/icon-24-lifebuoy.svg';
import IconLiquidityPool from 'assets/icons/svg/icon-24-liquidity-pool.svg';
import IconLogout from 'assets/icons/svg/icon-24-logout.svg';
import IconMail from 'assets/icons/svg/icon-24-mail.svg';
import IconMenu from 'assets/icons/svg/icon-24-menu.svg';
import IconMinus from 'assets/icons/svg/icon-24-minus.svg';
import IconMute from 'assets/icons/svg/icon-24-mute.svg';
import IconNote from 'assets/icons/svg/icon-24-note.svg';
import IconPending from 'assets/icons/svg/icon-24-pending.svg';
import IconPercentCircle from 'assets/icons/svg/icon-24-percent-circle.svg';
import IconPhone from 'assets/icons/svg/icon-24-phone.svg';
import IconPlus from 'assets/icons/svg/icon-24-plus.svg';
import IconPower from 'assets/icons/svg/icon-24-power.svg';
import IconQrCode from 'assets/icons/svg/icon-24-qrcode.svg';
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

const components = {
  'add-cash': IconAddCash,
  'add-contact': IconAddContact,
  'arrow-right': IconArrowRight,
  'arrow-down': IconArrowDown,
  'arrow-left': IconArrowLeft,
  'arrow-up': IconArrowUp,
  bullet: IconBullet,
  cancel: IconCancel,
  checkmark: IconCheckmark,
  'chevron-down': IconChevronDown,
  'chevron-right': IconChevronRight,
  'chevron-up': IconChevronUp,
  'close-circle': IconCloseCircle,
  close: IconClose,
  collectible: IconCollectible,
  contacts: IconContacts,
  copy: IconCopy,
  deposit: IconDeposit,
  dots: IconDots,
  equal: IconEqual,
  exchange: IconExchange,
  failed: IconFailed,
  gift: IconGift,
  'high-fees': IconHighFees,
  image: IconImage,
  info: IconInfo,
  investment: IconInvestment,
  key: IconKey,
  lifebuoy: IconLifebuoy,
  'liquidity-pool': IconLiquidityPool,
  logout: IconLogout,
  mail: IconMail,
  menu: IconMenu,
  minus: IconMinus,
  mute: IconMute,
  note: IconNote,
  pending: IconPending,
  'percent-circle': IconPercentCircle,
  phone: IconPhone,
  plus: IconPlus,
  power: IconPower,
  qrcode: IconQrCode,
  question: IconQuestion,
  recovery: IconRecovery,
  refresh: IconRefresh,
  search: IconSearch,
  select: IconSelect,
  'send-down': IconSendDown,
  send: IconSend,
  settings: IconSettings,
  settlement: IconSetttlement,
  'sort': IconSort,
  synthetic: IconSynthetic,
  'thumb-up': IconThumbUp,
  user: IconUser,
  wallet: IconWallet,
  warning: IconWarning,
};

export type IconName = $Keys<typeof components>;

type Props = {|
    name: string;
    color?: string;
    width?: number;
    height?: number;
|};

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
function Icon({ name, color, ...rest }: Props) {
  const colors = useThemeColors();

  const Component = components[name];
  return Component ? <Component fill={color ?? colors.basic010} {...rest} /> : null;
}

export default Icon;
