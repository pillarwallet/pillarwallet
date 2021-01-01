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

import React from 'react';
import { FlatList, Alert, View } from 'react-native';
import Emoji from 'react-native-emoji';
import { CachedImage } from 'react-native-cached-image';
import { connect } from 'react-redux';
import Intercom from 'react-native-intercom';
import styled, { withTheme } from 'styled-components/native';
import { createStructuredSelector } from 'reselect';
import t from 'translations/translate';
import type { NavigationScreenProp } from 'react-navigation';

// utils
import { getColorByTheme, getThemeColors } from 'utils/themes';
import { spacing, fontStyles } from 'utils/variables';
import { images } from 'utils/images';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import SettingsListItem from 'components/ListItem/SettingsItem';
import ShadowedCard from 'components/ShadowedCard';
import { TextLink } from 'components/Typography';
import Icon from 'components/Icon';
import HTMLContentModal, { ENDPOINTS } from 'components/Modals/HTMLContentModal';
import Modal from 'components/Modal';

// constants
import {
  WALLET_SETTINGS,
  APP_SETTINGS,
  COMMUNITY_SETTINGS,
  ADD_EDIT_USER,
  STORYBOOK,
  BACKUP_WALLET_IN_SETTINGS_FLOW,
  KEY_BASED_ASSET_TRANSFER_CHOOSE,
  KEY_BASED_ASSET_TRANSFER_STATUS,
  CONTACTS_FLOW,
} from 'constants/navigationConstants';
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';

// actions
import { lockScreenAction, logoutAction } from 'actions/authActions';
import { goToInvitationFlowAction } from 'actions/referralsActions';

// selectors
import { hasKeyBasedAssetsTransferInProgressSelector } from 'selectors/wallets';
import { keyBasedWalletHasPositiveBalanceSelector } from 'selectors/balances';

// services
import { firebaseRemoteConfig } from 'services/firebase';

// types
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Theme } from 'models/Theme';
import type { BackupStatus } from 'reducers/walletReducer';
import type { User } from 'models/User';


type Props = {
  navigation: NavigationScreenProp<*>,
  theme: Theme,
  user: User,
  backupStatus: BackupStatus,
  logoutUser: () => void,
  lockScreen: () => void,
  goToInvitationFlow: () => void,
  isPillarRewardCampaignActive: boolean,
  hasKeyBasedAssetsTransferInProgress: boolean,
  keyBasedWalletHasPositiveBalance: boolean,
};

const Footer = styled.View``;

const LinksSection = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin: ${spacing.mediumLarge}px 0;
`;

const LogoutSection = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: ${spacing.large}px;
`;

const LockScreenSection = styled.View`
  border-color: ${getColorByTheme({ lightKey: 'basic060', darkKey: 'basic080' })};
  border-top-width: 1px;
  border-bottom-width: 1px;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: ${spacing.mediumLarge}px;
`;

const HeaderLogo = styled(CachedImage)`
  width: 68px;
  height: 20px;
`;

const LogoutIcon = styled(Icon)`
  color: ${({ theme }) => theme.colors.secondaryAccent240};
  ${fontStyles.regular};
  margin-right: 5px;
`;

const LegalTextLink = styled(TextLink)`
  ${fontStyles.regular};
`;

const LogoutTextLink = styled(TextLink)`
  color: ${({ theme }) => theme.colors.secondaryAccent240};
  ${fontStyles.regular};
`;

const LockScreenTextLink = styled(TextLink)`
  ${fontStyles.regular};
`;

const SEPARATOR_SYMBOL = '  •  ';

const Menu = ({
  theme,
  navigation,
  goToInvitationFlow,
  isPillarRewardCampaignActive,
  hasKeyBasedAssetsTransferInProgress,
  logoutUser,
  backupStatus,
  lockScreen,
  keyBasedWalletHasPositiveBalance,
}: Props) => {
  const openLegalModal = (endpoint: string) => Modal.open(() => (
    <HTMLContentModal htmlEndpoint={endpoint} />
  ));

  const { pillarLogoSmall: logo } = images(theme);
  const isBackedUp = backupStatus.isImported || backupStatus.isBackedUp || __DEV__;
  const colors = getThemeColors(theme);

  const isKeyBasedAssetsMigrationEnabled = firebaseRemoteConfig.getBoolean(REMOTE_CONFIG.KEY_BASED_ASSETS_MIGRATION);
  const isKeyBasedAssetsMigrationHidden = !isKeyBasedAssetsMigrationEnabled || (
    !hasKeyBasedAssetsTransferInProgress && !keyBasedWalletHasPositiveBalance
  );

  const menuItems = [
    {
      key: 'appSettings',
      title: t('settingsContent.settingsItem.appSettings.title'),
      emoji: 'gear',
      action: () => navigation.navigate(APP_SETTINGS),
    },
    {
      key: 'userProfile',
      title: t('settingsContent.settingsItem.userProfile.title'),
      emoji: 'male-singer',
      action: () => navigation.navigate(ADD_EDIT_USER),
    },
    {
      key: 'addressBook',
      title: t('settingsContent.settingsItem.addressBook.title'),
      emoji: 'book',
      action: () => navigation.navigate(CONTACTS_FLOW),
    },
    {
      key: 'walletSettings',
      title: t('settingsContent.settingsItem.walletSettings.title'),
      emoji: 'moneybag',
      action: () => navigation.navigate(WALLET_SETTINGS),
      labelBadge: !isBackedUp && {
        label: t('settingsContent.settingsItem.recoverySettings.label.notFinished'),
        color: colors.negative,
      },
    },
    {
      key: 'referFriends',
      title: isPillarRewardCampaignActive
        ? t('settingsContent.settingsItem.referFriends.title')
        : t('settingsContent.settingsItem.inviteFriends.title'),
      icon: 'present',
      iconColor: colors.accent,
      action: goToInvitationFlow,
    },
    {
      key: 'community',
      title: t('settingsContent.settingsItem.community.title'),
      icon: 'like',
      iconColor: colors.accent,
      action: () => navigation.navigate(COMMUNITY_SETTINGS),
    },
    {
      key: 'chatWithSupport',
      title: t('settingsContent.settingsItem.support.title'),
      icon: 'help',
      iconColor: colors.helpIcon,
      action: () => Intercom.displayMessenger(),
    },
    {
      key: 'knowledgeBase',
      title: t('settingsContent.settingsItem.faq.title'),
      icon: 'dictionary',
      iconColor: colors.positive,
      action: () => Intercom.displayHelpCenter(),
    },
    {
      key: 'assetsMigration',
      title: t('settingsContent.settingsItem.assetsMigration.title'),
      icon: 'send-asset',
      iconColor: colors.accent,
      hidden: isKeyBasedAssetsMigrationHidden,
      action: () => navigation.navigate(
        hasKeyBasedAssetsTransferInProgress
          ? KEY_BASED_ASSET_TRANSFER_STATUS
          : KEY_BASED_ASSET_TRANSFER_CHOOSE,
      ),
    },
    {
      key: 'storybook',
      title: 'Storybook', // eslint-disable-line i18next/no-literal-string
      icon: 'dictionary',
      iconColor: colors.primary,
      action: () => navigation.navigate(STORYBOOK),
      hidden: !__DEV__,
    },
  ];

  const renderMenuItem = ({ item }) => {
    const {
      title,
      action,
      labelBadge,
      emoji,
      icon,
      iconColor,
      hidden,
    } = item;

    if (hidden) {
      return null;
    }

    return (
      <ShadowedCard wrapperStyle={{ marginBottom: 10, width: '100%' }}>
        <SettingsListItem
          label={title}
          onPress={action}
          labelBadge={labelBadge}
          icon={icon}
          iconColor={iconColor}
          customIcon={!!emoji && <View style={{ marginRight: 10 }}><Emoji name={emoji} /></View>}
        />
      </ShadowedCard>
    );
  };

  const deleteWallet = () => {
    if (isBackedUp) {
      Alert.alert(
        t('alert.logOut.title'),
        t('alert.logOut.message'),
        [
          { text: t('alert.logOut.button.cancel') },
          { text: t('alert.logOut.button.ok'), onPress: logoutUser },
        ],
      );
    } else {
      Alert.alert(
        t('alert.attemptToLogOutWithoutBackup.title'),
        t('alert.attemptToLogOutWithoutBackup.message'),
        [
          { text: t('alert.attemptToLogOutWithoutBackup.button.cancel') },
          {
            text: t('alert.attemptToLogOutWithoutBackup.button.backup'),
            onPress: () => navigation.navigate(BACKUP_WALLET_IN_SETTINGS_FLOW),
          },
        ],
      );
    }
  };

  return (
    <ContainerWithHeader
      headerProps={{ leftItems: [{ close: true }], centerItems: [{ custom: <HeaderLogo source={logo} /> }] }}
      inset={{ bottom: 'never' }}
    >
      <FlatList
        data={menuItems}
        keyExtractor={item => item.key}
        renderItem={renderMenuItem}
        contentContainerStyle={{ width: '100%', padding: spacing.layoutSides, paddingBottom: 40 }}
        ListFooterComponent={
          <Footer>
            <LinksSection>
              <LegalTextLink onPress={() => openLegalModal(ENDPOINTS.TERMS_OF_SERVICE)}>
                {t('settingsContent.button.termOfUse')}
              </LegalTextLink>
              <LegalTextLink>{SEPARATOR_SYMBOL}</LegalTextLink>
              <LegalTextLink onPress={() => openLegalModal(ENDPOINTS.PRIVACY_POLICY)}>
                {t('settingsContent.button.privacyPolicy')}
              </LegalTextLink>
            </LinksSection>
            <LockScreenSection>
              <LockScreenTextLink onPress={lockScreen}>
                {t('settingsContent.button.lockWallet')}
              </LockScreenTextLink>
            </LockScreenSection>
            <LogoutSection>
              <LogoutIcon name="signout" />
              <LogoutTextLink onPress={deleteWallet}>
                {t('settingsContent.button.signOut')}
              </LogoutTextLink>
            </LogoutSection>
          </Footer>
        }
      />
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  user: { data: user },
  wallet: { backupStatus },
  referrals: { isPillarRewardCampaignActive },
}: RootReducerState): $Shape<Props> => ({
  user,
  backupStatus,
  isPillarRewardCampaignActive,
});

const structuredSelector = createStructuredSelector({
  hasKeyBasedAssetsTransferInProgress: hasKeyBasedAssetsTransferInProgressSelector,
  keyBasedWalletHasPositiveBalance: keyBasedWalletHasPositiveBalanceSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  lockScreen: () => dispatch(lockScreenAction()),
  logoutUser: () => dispatch(logoutAction()),
  goToInvitationFlow: () => dispatch(goToInvitationFlowAction()),
});

export default withTheme(connect(combinedMapStateToProps, mapDispatchToProps)(Menu));
