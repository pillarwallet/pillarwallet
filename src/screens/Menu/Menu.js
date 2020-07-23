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
import { FlatList, Alert, View } from 'react-native';
import Emoji from 'react-native-emoji';
import { CachedImage } from 'react-native-cached-image';
import { connect } from 'react-redux';
import Intercom from 'react-native-intercom';
import styled, { withTheme } from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';

// utils
import { getThemeColors, themedColors } from 'utils/themes';
import { spacing, fontStyles } from 'utils/variables';
import { images } from 'utils/images';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import SettingsListItem from 'components/ListItem/SettingsItem';
import { ListCard } from 'components/ListItem/ListCard';
import { TextLink } from 'components/Typography';
import Icon from 'components/Icon';
import HTMLContentModal from 'components/Modals/HTMLContentModal';

// constants
import {
  SECURITY_SETTINGS,
  RECOVERY_SETTINGS,
  APP_SETTINGS,
  COMMUNITY_SETTINGS,
  ADD_EDIT_USER,
  STORYBOOK,
  BACKUP_WALLET_IN_SETTINGS_FLOW,
  KEY_BASED_ASSET_TRANSFER_CHOOSE,
} from 'constants/navigationConstants';

// actions
import { lockScreenAction, logoutAction } from 'actions/authActions';
import { goToInvitationFlowAction } from 'actions/referralsActions';

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
};

type State = {
  visibleModal: ?string,
};

const Footer = styled.View``;

const LinksSection = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin: ${spacing.mediumLarge}px 0;
`;

const LogoutSection = styled.View`
  border-top-color: ${themedColors.tertiary};
  border-top-width: 1px;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: ${spacing.large}px;
`;

const LockScreenSection = styled.View`
  border-top-color: ${themedColors.tertiary};
  border-top-width: 1px;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: ${spacing.mediumLarge}px;
`;

const HeaderLogo = styled(CachedImage)`
  width: 40px;
  height: 20px;
`;

const LogoutIcon = styled(Icon)`
  color: ${themedColors.negative};
  ${fontStyles.regular};
  margin-right: 5px;
`;

const LegalTextLink = styled(TextLink)`
  ${fontStyles.regular};
`;

const LogoutTextLink = styled(TextLink)`
  color: ${themedColors.negative};
  ${fontStyles.regular};
`;

const LockScreenTextLink = styled(TextLink)`
  color: ${themedColors.link};
  ${fontStyles.regular};
`;

class Menu extends React.Component<Props, State> {
  state = {
    visibleModal: null,
  };

  getMenuItems = () => {
    const {
      theme, navigation, backupStatus, goToInvitationFlow, isPillarRewardCampaignActive,
    } = this.props;
    const colors = getThemeColors(theme);
    const isBackedUp = backupStatus.isImported || backupStatus.isBackedUp;
    const menuItems = [
      {
        key: 'securitySettings',
        title: 'Security settings',
        emoji: 'rotating_light',
        card: true,
        action: () => navigation.navigate(SECURITY_SETTINGS),
      },
      {
        key: 'recoverySettings',
        title: 'Recovery settings',
        labelBadge: !isBackedUp && {
          label: 'Warning',
          color: colors.negative,
        },
        emoji: 'mage',
        card: true,
        action: () => navigation.navigate(RECOVERY_SETTINGS),
      },
      {
        key: 'userProfile',
        title: 'User profile',
        emoji: 'male-singer',
        card: true,
        action: () => navigation.navigate(ADD_EDIT_USER),
      },
      {
        key: 'appSettings',
        title: 'App settings',
        emoji: 'gear',
        card: true,
        action: () => navigation.navigate(APP_SETTINGS),
      },
      {
        key: 'referFriends',
        title: isPillarRewardCampaignActive ? 'Refer friends' : 'Invite friends',
        icon: 'present',
        iconColor: colors.accent,
        action: goToInvitationFlow,
      },
      {
        key: 'community',
        title: 'Community',
        icon: 'like',
        iconColor: colors.accent,
        action: () => navigation.navigate(COMMUNITY_SETTINGS),
      },
      {
        key: 'chatWithSupport',
        title: 'Chat with support',
        icon: 'help',
        iconColor: colors.helpIcon,
        action: () => Intercom.displayMessenger(),
      },
      {
        key: 'knowledgeBase',
        title: 'Knowledge base',
        icon: 'dictionary',
        iconColor: colors.positive,
        action: () => Intercom.displayHelpCenter(),
      },
      {
        key: 'assetsMigration',
        title: 'Transfer assets to Smart Wallet',
        icon: 'send-asset',
        iconColor: colors.accent,
        action: () => navigation.navigate(KEY_BASED_ASSET_TRANSFER_CHOOSE),
      },
      {
        key: 'storybook',
        title: 'Storybook',
        icon: 'dictionary',
        iconColor: colors.primary,
        action: () => navigation.navigate(STORYBOOK),
        hidden: !__DEV__,
      },
    ];
    return menuItems;
  };

  renderMenuItem = ({ item }) => {
    const {
      title,
      action,
      labelBadge,
      card,
      emoji,
      icon,
      iconColor,
      hidden,
    } = item;

    if (hidden) {
      return null;
    }

    if (card) {
      return (
        <ListCard
          title={title}
          action={action}
          labelBadge={labelBadge}
          contentWrapperStyle={{ paddingHorizontal: 20, paddingVertical: 24 }}
          customIcon={<View style={{ marginRight: 10 }}><Emoji name={emoji} /></View>}
        />
      );
    }

    return (
      <SettingsListItem
        label={title}
        onPress={action}
        labelBadge={labelBadge}
        icon={icon}
        iconColor={iconColor}
      />
    );
  };

  toggleSlideModalOpen = (modal: ?string = null) => {
    this.setState({ visibleModal: modal });
  };

  deleteWallet = () => {
    const { logoutUser, backupStatus, navigation } = this.props;
    const isBackedUp = backupStatus.isImported || backupStatus.isBackedUp || __DEV__;
    if (isBackedUp) {
      Alert.alert(
        'Logout',
        'After logging out you will not be able to log in back to this wallet without 12 words backup.',
        [
          { text: 'Cancel' },
          { text: 'Confirm', onPress: logoutUser },
        ],
      );
    } else {
      Alert.alert(
        'Logout',
        'You can logout only after securing your 12 words backup phrase.',
        [
          { text: 'Cancel' },
          {
            text: 'Backup 12 words',
            onPress: () => navigation.navigate(BACKUP_WALLET_IN_SETTINGS_FLOW, { backupViaSettings: true }),
          },
        ],
      );
    }
  };

  render() {
    const items = this.getMenuItems();
    const { visibleModal } = this.state;
    const { theme, lockScreen } = this.props;
    const { pillarLogoSmall: logo } = images(theme);

    return (
      <ContainerWithHeader
        headerProps={{ leftItems: [{ close: true }], centerItems: [{ custom: <HeaderLogo source={logo} /> }] }}
        inset={{ bottom: 'never' }}
      >
        <FlatList
          data={items}
          keyExtractor={item => item.key}
          renderItem={this.renderMenuItem}
          contentContainerStyle={{ width: '100%', padding: spacing.layoutSides, paddingBottom: 40 }}
          ListFooterComponent={
            <Footer>
              <LinksSection>
                <LegalTextLink onPress={() => this.toggleSlideModalOpen('termsOfService')}>
                  Terms of Use
                </LegalTextLink>
                <LegalTextLink>  •  </LegalTextLink>
                <LegalTextLink onPress={() => this.toggleSlideModalOpen('privacyPolicy')}>
                  Privacy policy
                </LegalTextLink>
              </LinksSection>
              <LockScreenSection>
                <LockScreenTextLink onPress={lockScreen}>
                  Lock wallet
                </LockScreenTextLink>
              </LockScreenSection>
              <LogoutSection>
                <LogoutIcon name="signout" />
                <LogoutTextLink onPress={this.deleteWallet}>
                  Sign out from wallet
                </LogoutTextLink>
              </LogoutSection>
            </Footer>
          }
        />
        {/* LEGAL MODALS */}
        <HTMLContentModal
          isVisible={visibleModal === 'termsOfService'}
          modalHide={this.toggleSlideModalOpen}
          htmlEndpoint="terms_of_service"
        />

        <HTMLContentModal
          isVisible={visibleModal === 'privacyPolicy'}
          modalHide={this.toggleSlideModalOpen}
          htmlEndpoint="privacy_policy"
        />
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  user: { data: user },
  wallet: { backupStatus },
  referrals: { isPillarRewardCampaignActive },
}: RootReducerState): $Shape<Props> => ({
  user,
  backupStatus,
  isPillarRewardCampaignActive,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  lockScreen: () => dispatch(lockScreenAction()),
  logoutUser: () => dispatch(logoutAction()),
  goToInvitationFlow: () => dispatch(goToInvitationFlowAction()),
});

export default withTheme(connect(mapStateToProps, mapDispatchToProps)(Menu));
