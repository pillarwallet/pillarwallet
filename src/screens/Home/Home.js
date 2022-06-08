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
import { ENSNodeStates } from 'etherspot';

// Actions
import { fetchAllAccountsTotalBalancesAction } from 'actions/assetsActions';
import { refreshEtherspotAccountsAction } from 'actions/etherspotActions';

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
import Banner from 'components/Banner/Banner';
import { Spacing } from 'components/legacy/Layout';

// Constants
import { MENU, HOME_HISTORY, REGISTER_ENS } from 'constants/navigationConstants';
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';

// Selectors
import { useRootSelector, useAccounts, activeAccountAddressSelector } from 'selectors';
import { accountTotalBalancesSelector } from 'selectors/totalBalances';
import { useUser } from 'selectors/user';
import { etherspotAccountSelector } from 'selectors/accounts';
import { nativeIntegrationSelector } from 'redux/selectors/native-integration-selector';

// Services
import { firebaseRemoteConfig } from 'services/firebase';

// Screens
import GovernanceCallBanner from 'screens/GovernanceCall/GovernanceCallBanner';

// Utils
import { sumRecord } from 'utils/bigNumber';
import { calculateTotalBalancePerCategory } from 'utils/totalBalances';
import { useThemeColors } from 'utils/themes';
import { getSupportedBiometryType } from 'utils/keychain';
import { getEnsNodeState } from 'utils/accounts';
import { getActiveScreenName } from 'utils/navigation';

// Local
import BalanceSection from './BalanceSection';
import AssetsSection from './AssetsSection';
import FloatingActions from './FloatingActions';
import { useAccountCollectibleCounts } from './utils';
import BiometricModal from '../../components/BiometricModal/BiometricModal';
import AppsButton from './AppsButton';

// Redux
import { fetchNativeIntegration } from '../../redux/actions/native-integration-actions';

// Services
import visibleBalanceSession from '../../services/visibleBalance';

// Actions
import { saveDbAction } from '../../actions/dbActions';

function Home() {
  const navigation = useNavigation();
  const colors = useThemeColors();
  const { t } = useTranslation();

  const accountTotalBalances = useRootSelector(accountTotalBalancesSelector);
  const accountCollectibleCounts = useAccountCollectibleCounts();
  const user = useUser();
  const dispatch = useDispatch();
  const etherspotAccount = useRootSelector(etherspotAccountSelector);
  const wallet = useRootSelector((root) => root.wallet.data);
  const accountAddress = useRootSelector(activeAccountAddressSelector);
  const [showAccountSwitchTooltip, setShowAccountSwitchTooltip] = React.useState(false);
  const [showENSTooltip, setShowENSSwitchTooltip] = React.useState(false);
  const [balanceVisible, setBalanceVisible] = React.useState(true);

  const canSwitchAccount = useAccounts().length > 1;
  const ensNodeState = getEnsNodeState(etherspotAccount);
  const isEnsNodeCliamed = ensNodeState === ENSNodeStates.Claimed;
  const featureOnboardingENS = firebaseRemoteConfig.getBoolean(REMOTE_CONFIG.FEATURE_ONBOARDING_ENS);
  const showEnsTooltip = featureOnboardingENS && !isEnsNodeCliamed;
  const nativeIntegrationResponse = useRootSelector(nativeIntegrationSelector);

  const { accountSwitchTooltipDismissed } = useRootSelector(({ appSettings }) => appSettings.data);
  const balancePerCategory = calculateTotalBalancePerCategory(accountTotalBalances);
  const totalBalance = sumRecord(balancePerCategory);
  const screenName = getActiveScreenName(navigation);

  const isRefreshing = useRootSelector(({ totalBalances }) => !!totalBalances.isFetching);

  React.useEffect(() => {
    dispatch(fetchNativeIntegration());
    callVisibleBalanceFunction();
    setTimeout(() => {
      if (!wallet) {
        getSupportedBiometryType((biometryType) => {
          if (biometryType) {
            Modal.open(() => <BiometricModal biometricType={biometryType} />);
          } else {
            Modal.open(() => <BiometricModal hasNoBiometrics />);
          }
        });
      }
    }, 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const callVisibleBalanceFunction = async () => {
    const response = await visibleBalanceSession();
    if (response !== undefined) setBalanceVisible(response);
  };

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

  const onBalanceClick = async () => {
    await dispatch(saveDbAction('visible_balance', { visible: !balanceVisible }));
    setBalanceVisible(!balanceVisible);
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

      {showEnsTooltip && (
        <Tooltip
          isVisible={!user?.username && showENSTooltip}
          body={t('tooltip.registerENS')}
          wrapperStyle={{ zIndex: 9999, top: -10, position: 'relative' }}
          onPress={() => navigation.navigate(REGISTER_ENS)}
        />
      )}
      <Content
        contentContainerStyle={{ paddingBottom: FloatingButtons.SCROLL_VIEW_BOTTOM_INSET }}
        paddingHorizontal={0}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        <Stories />

        <BalanceSection balanceInFiat={totalBalance} showBalance={balanceVisible} onBalanceClick={onBalanceClick} />

        <WalletConnectRequests />

        <Spacing h={13} />

        <GovernanceCallBanner />

        <Banner screenName={screenName} bottomPosition={false} />

        {/* <ChartsSection balancePerCategory={balancePerCategory} balancePerChain={balancePerChain} /> */}

        <AssetsSection
          visibleBalance={balanceVisible}
          accountTotalBalances={accountTotalBalances}
          accountCollectibleCounts={accountCollectibleCounts}
        />

        <Banner screenName={screenName} bottomPosition />

        <AppsButton response={nativeIntegrationResponse} navigation={navigation} isShowLabel />
      </Content>

      <FloatingActions />
    </Container>
  );
}

export default Home;
