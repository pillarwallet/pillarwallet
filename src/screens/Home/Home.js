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

// Constants
import { MENU, HOME_HISTORY } from 'constants/navigationConstants';

// Selectors
import { useRootSelector, useSmartWalletAccounts } from 'selectors';
import { accountTotalBalancesSelector } from 'selectors/totalBalances';
import { useUser } from 'selectors/user';

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
  const wallet = useRootSelector((root) => root.wallet.data);

  const dispatch = useDispatch();

  React.useEffect(() => {
    if (!wallet) {
      getSupportedBiometryType((biometryType) => {
        if (biometryType) {
          Modal.open(() => <BiometricModal biometricType={biometryType} />);
        } else {
          dispatch(beginOnboardingAction());
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { accountSwitchTooltipDismissed } = useRootSelector(({ appSettings }) => appSettings.data);

  const canSwitchAccount = useSmartWalletAccounts().length > 1;

  const balancePerCategory = calculateTotalBalancePerCategory(accountTotalBalances);
  const balancePerChain = calculateTotalBalancePerChain(accountTotalBalances);
  const totalBalance = sumRecord(balancePerCategory);
  const showRegisterENSTooltip = !user.username && wallet;

  const isRefreshing = useRootSelector(({ totalBalances }) => !!totalBalances.isFetching);
  const onRefresh = () => {
    dispatch(refreshEtherspotAccountsAction());
    dispatch(fetchAllAccountsTotalBalancesAction());
  };

  return (
    <Container>
      <HeaderBlock
        leftItems={[{ svgIcon: 'menu', color: colors.basic020, onPress: () => navigation.navigate(MENU) }]}
        centerItems={[{ custom: <UserNameAndImage user={user} address={wallet?.address} /> }]}
        rightItems={[{ svgIcon: 'history', color: colors.basic020, onPress: () => navigation.navigate(HOME_HISTORY) }]}
        navigation={navigation}
        noPaddingTop
      />

      {/* this should stay first element, avoid putting it inside UserNameAndImage */}
      {canSwitchAccount && (
        <Tooltip
          isVisible={!accountSwitchTooltipDismissed}
          body={t('tooltip.switchAccountsByTappingHere')}
          wrapperStyle={{ zIndex: 9999, top: -10, position: 'relative' }}
        />
      )}

      {showRegisterENSTooltip && (
        <Tooltip
          isVisible={!accountSwitchTooltipDismissed}
          body={t('tooltip.registerENS')}
          wrapperStyle={{ zIndex: 9999, top: -10, position: 'relative' }}
        />
      )}

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

