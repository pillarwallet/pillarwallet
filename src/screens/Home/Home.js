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
import { useNavigation } from 'react-navigation-hooks';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'translations/translate';

// Actions
import { fetchAllAccountsTotalBalancesAction } from 'actions/assetsActions';
import { refreshEtherspotAccountsAction } from 'actions/etherspotActions';
import { beginOnboardingAction } from 'actions/onboardingActions';

// Components
import { Container, Content } from 'components/layout/Layout';
import FloatingButtons from 'components/FloatingButtons';
import HeaderBlock from 'components/HeaderBlock';
import RefreshControl from 'components/RefreshControl';
import Stories from 'components/Stories';
import UserNameAndImage from 'components/UserNameAndImage';
import WalletConnectRequests from 'screens/WalletConnect/Requests';
import Tooltip from 'components/Tooltip';
import Modal from 'components/Modal';
import Spinner from 'components/Spinner';

// Constants
import { MENU, HOME_HISTORY, REGISTER_ENS } from 'constants/navigationConstants';
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';

// Selectors
import { useRootSelector, useAccounts, activeAccountAddressSelector } from 'selectors';
import { accountTotalBalancesSelector } from 'selectors/totalBalances';
import { useUser } from 'selectors/user';

// Services
import { firebaseRemoteConfig } from 'services/firebase';

// Screens
import GovernanceCallBanner from 'screens/GovernanceCall/GovernanceCallBanner';

// Utils
import { sumRecord } from 'utils/bigNumber';
import { calculateTotalBalancePerCategory, calculateTotalBalancePerChain } from 'utils/totalBalances';
import { useThemeColors } from 'utils/themes';
import { getSupportedBiometryType } from 'utils/keychain';

// Local
import BalanceSection from './BalanceSection';
import ChartsSection from './ChartsSection';
import AssetsSection from './AssetsSection';
import FloatingActions from './FloatingActions';
import { useAccountCollectibleCounts } from './utils';
import BiometricModal from '../../components/BiometricModal/BiometricModal';

function Home() {
  const navigation = useNavigation();
  const colors = useThemeColors();
  const { t } = useTranslation();

  const accountTotalBalances = useRootSelector(accountTotalBalancesSelector);
  const accountCollectibleCounts = useAccountCollectibleCounts();
  const user = useUser();
  const dispatch = useDispatch();
  const wallet = useRootSelector((root) => root.wallet.data);
  const accountAddress = useRootSelector(activeAccountAddressSelector);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showAccountSwitchTooltip, setShowAccountSwitchTooltip] = React.useState(false);
  const [showENSTooltip, setShowENSSwitchTooltip] = React.useState(false);
  const canSwitchAccount = useAccounts().length > 1;

  const showENStooltip = firebaseRemoteConfig.getBoolean(REMOTE_CONFIG.FEATURE_ONBOARDING_ENS);

  const { accountSwitchTooltipDismissed } = useRootSelector(({ appSettings }) => appSettings.data);
  const balancePerCategory = calculateTotalBalancePerCategory(accountTotalBalances);
  const balancePerChain = calculateTotalBalancePerChain(accountTotalBalances);
  const totalBalance = sumRecord(balancePerCategory);

  const isRefreshing = useRootSelector(({ totalBalances }) => !!totalBalances.isFetching);

  React.useEffect(() => {
    setTimeout(() => {
      if (!wallet) {
        getSupportedBiometryType((biometryType) => {
          if (biometryType) {
            Modal.open(() => <BiometricModal biometricType={biometryType} />);
          } else {
            dispatch(beginOnboardingAction());
            setIsLoading(true);
          }
        });
      }
    }, 2000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  React.useEffect(() => {
    if (canSwitchAccount) {
      if (!accountSwitchTooltipDismissed) {
        setTimeout(() => {
          setShowAccountSwitchTooltip(true);
        }, 3000);
        setTimeout(() => {
          setShowAccountSwitchTooltip(false);
          setShowENSSwitchTooltip(true);
        }, 10000);
      } else {
        setTimeout(() => {
          setShowENSSwitchTooltip(true);
        }, 4000);
      }
    }
  }, [canSwitchAccount, accountSwitchTooltipDismissed]);

  const onRefresh = () => {
    dispatch(refreshEtherspotAccountsAction());
    dispatch(fetchAllAccountsTotalBalancesAction());
  };

  return (
    <Container>
      <HeaderBlock
        leftItems={[{ svgIcon: 'menu', color: colors.basic020, onPress: () => navigation.navigate(MENU) }]}
        centerItems={[
          {
            custom: <UserNameAndImage user={user?.username} address={accountAddress} />,
          },
        ]}
        rightItems={[{ svgIcon: 'history', color: colors.basic020, onPress: () => navigation.navigate(HOME_HISTORY) }]}
        navigation={navigation}
        noPaddingTop
      />

      {/* this should stay first element, avoid putting it inside UserNameAndImage */}
      {canSwitchAccount && (
        <Tooltip
          isVisible={!accountSwitchTooltipDismissed && showAccountSwitchTooltip}
          body={t('tooltip.switchAccountsByTappingHere')}
          wrapperStyle={{ zIndex: 9999, top: -10, position: 'relative' }}
        />
      )}

      {showENStooltip && (
        <Tooltip
          isVisible={!user?.username && showENSTooltip}
          body={t('tooltip.registerENS')}
          wrapperStyle={{ zIndex: 9999, top: -10, position: 'relative' }}
          onPress={() => navigation.navigate(REGISTER_ENS)}
        />
      )}
      {(useAccounts().length === 0 || isLoading) && <Spinner size={20} />}
      <Content
        contentContainerStyle={{ paddingBottom: FloatingButtons.SCROLL_VIEW_BOTTOM_INSET }}
        paddingHorizontal={0}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        <Stories />

        <BalanceSection balanceInFiat={totalBalance} />

        <WalletConnectRequests />

        <GovernanceCallBanner />

        <ChartsSection balancePerCategory={balancePerCategory} balancePerChain={balancePerChain} />

        <AssetsSection
          accountTotalBalances={accountTotalBalances}
          accountCollectibleCounts={accountCollectibleCounts}
        />
      </Content>

      <FloatingActions />
    </Container>
  );
}

export default Home;

