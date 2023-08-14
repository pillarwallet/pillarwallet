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
import { BackHandler } from 'react-native';
import { useNavigation, useFocusEffect } from 'react-navigation-hooks';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'translations/translate';
import { ENSNodeStates } from 'etherspot';
import Swiper from 'react-native-swiper';

// Actions
import { fetchAllAccountsAssetsBalancesAction } from 'actions/assetsActions';
import { refreshEtherspotAccountsAction } from 'actions/etherspotActions';
import { fetchAppsHoldingsAction } from 'actions/appsHoldingsActions';

// Components
import { Container, Content } from 'components/layout/Layout';
import FloatingButtons from 'components/FloatingButtons';
import HeaderBlock from 'components/HeaderBlock';
import RefreshControl from 'components/RefreshControl';
import UserNameAndImage from 'components/UserNameAndImage';
import WalletConnectRequests from 'screens/WalletConnect/Requests';
import Tooltip from 'components/Tooltip';
import Banner from 'components/Banner/Banner';
import { Spacing } from 'components/legacy/Layout';
import WalletConnectCamera from 'components/QRCodeScanner/WalletConnectCamera';

// Constants
import { MENU, HOME_HISTORY, REGISTER_ENS, CONNECT_FLOW } from 'constants/navigationConstants';
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';

// Selectors
import { useRootSelector, useAccounts, activeAccountAddressSelector, useOnboardingFetchingSelector } from 'selectors';
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
import { getEnsNodeState, getActiveAccount, findKeyBasedAccount } from 'utils/accounts';
import { getActiveScreenName } from 'utils/navigation';

// Hooks
import useWalletConnect from 'hooks/useWalletConnect';

// Local
import BalanceSection from './BalanceSection';
import AssetsSection from './AssetsSection';
import FloatingActions from './FloatingActions';
import InvestmentsSection from './InvestmentsSection';
import { useAccountCollectibleCounts } from './utils';
import AppsButton from './AppsButton';
import TransactionNotification from './components/TransactionNotification';
import OnboardingLoader from './components/OnboardingLoader';

// Redux
import { fetchNativeIntegration } from '../../redux/actions/native-integration-actions';

// Services
import visibleBalanceSession from '../../services/visibleBalance';

// Actions
import { saveDbAction } from '../../actions/dbActions';
import Assets from '../Assets/Assets';

function Home() {
  const navigation = useNavigation();
  const colors = useThemeColors();
  const { t } = useTranslation();
  const swiperRef = React.useRef(null);
  const isFetching = useOnboardingFetchingSelector();

  const accountTotalBalances = useRootSelector(accountTotalBalancesSelector);
  const accountCollectibleCounts = useAccountCollectibleCounts();
  const user = useUser();
  const dispatch = useDispatch();
  const etherspotAccount = useRootSelector(etherspotAccountSelector);
  const accountAddress = useRootSelector(activeAccountAddressSelector);
  const { switchAccountTooltipDismissed } = useRootSelector(({ appSettings }) => appSettings.data);

  const { connectToConnector } = useWalletConnect();

  const [showENSTooltip, setShowENSSwitchTooltip] = React.useState(false);
  const [balanceVisible, setBalanceVisible] = React.useState(true);
  const [currentSwiperIndex, setCurrentSwiperIndex] = React.useState(1);

  const accounts = useAccounts();
  const keyBasedAccount: any = findKeyBasedAccount(accounts);
  const activeAccount: any = getActiveAccount(accounts);

  const isKeyBasedAccount = activeAccount === keyBasedAccount;

  const canSwitchAccount = useAccounts().length > 1;
  const ensNodeState = getEnsNodeState(etherspotAccount);
  const isEnsNodeCliamed = ensNodeState === ENSNodeStates.Claimed;
  const featureOnboardingENS = firebaseRemoteConfig.getBoolean(REMOTE_CONFIG.FEATURE_ONBOARDING_ENS);
  const showEnsTooltip = featureOnboardingENS && !isEnsNodeCliamed;
  const nativeIntegrationResponse = useRootSelector(nativeIntegrationSelector);

  const balancePerCategory = calculateTotalBalancePerCategory(accountTotalBalances);
  const totalBalance = sumRecord(balancePerCategory);
  const screenName = getActiveScreenName(navigation);

  const isRefreshing = useRootSelector(({ assetsBalances }) => !!assetsBalances.isFetching);

  React.useEffect(() => {
    dispatch(fetchNativeIntegration());
    callVisibleBalanceFunction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (currentSwiperIndex === 0) {
          swiperRef.current?.scrollBy(1);
        }
        if (currentSwiperIndex === 1) {
          return false;
        }
        if (currentSwiperIndex === 2) {
          swiperRef.current?.scrollBy(-1);
        }
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [currentSwiperIndex]),
  );

  const callVisibleBalanceFunction = async () => {
    const response = await visibleBalanceSession();
    if (response !== undefined) setBalanceVisible(response);
  };

  React.useEffect(() => {
    if (canSwitchAccount) {
      setTimeout(() => {
        setShowENSSwitchTooltip(true);
      }, 4000);
    }
  }, [canSwitchAccount]);

  const onRefresh = () => {
    dispatch(fetchAllAccountsAssetsBalancesAction());
    dispatch(refreshEtherspotAccountsAction());
    dispatch(fetchAppsHoldingsAction());
  };

  const onBalanceClick = async () => {
    await dispatch(saveDbAction('visible_balance', { visible: !balanceVisible }));
    setBalanceVisible(!balanceVisible);
  };

  const validateUri = (uri: string): boolean => {
    return uri.startsWith('wc:');
  };

  const handleUri = (uri: string) => {
    if (!uri.startsWith('wc:')) return;
    connectToConnector(uri);
  };

  const onNavigateWallet = () => {
    navigation.navigate(CONNECT_FLOW);
  };

  return (
    <Swiper
      scrollEnabled={!isFetching}
      ref={swiperRef}
      loop={false}
      showsPagination={false}
      index={1}
      onIndexChanged={(newIndex) => {
        setTimeout(() => {
          setCurrentSwiperIndex(newIndex);
        }, 1);
      }}
    >
      {/* Left Scanner Content */}
      <WalletConnectCamera
        visibleCamera={currentSwiperIndex === 0}
        validator={validateUri}
        onRead={handleUri}
        onClose={() => swiperRef.current?.scrollBy(1)}
        onNavigateWallet={onNavigateWallet}
      />

      {/* Center Home Content */}
      <>
        <Container>
          <HeaderBlock
            leftItems={[
              {
                svgIcon: 'menu',
                color: colors.basic020,
                onPress: () => navigation.navigate(MENU),
                testID: `${TAG}-button-header_menu`, // eslint-disable-line i18next/no-literal-string
                accessibilityLabel: `${TAG}-button-header_menu`, // eslint-disable-line i18next/no-literal-string
              },
            ]}
            centerItems={[
              {
                custom: <UserNameAndImage user={user?.username} address={accountAddress} />,
              },
            ]}
            rightItems={[
              {
                svgIcon: 'history',
                color: colors.basic020,
                onPress: () => navigation.navigate(HOME_HISTORY),
                testID: `${TAG}-button-header_history`, // eslint-disable-line i18next/no-literal-string
                accessibilityLabel: `${TAG}-button-header_history`, // eslint-disable-line i18next/no-literal-string
              },
            ]}
            navigation={navigation}
            noPaddingTop
            testIdTag={TAG}
          />

          <Tooltip
            isVisible={!switchAccountTooltipDismissed && isKeyBasedAccount}
            body={t('tooltip.switch_account')}
            wrapperStyle={{ zIndex: 9999, top: -10, position: 'relative' }}
          />

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
            <BalanceSection balanceInFiat={totalBalance} showBalance={balanceVisible} onBalanceClick={onBalanceClick} />

            <WalletConnectRequests />

            <Spacing h={13} />

            <GovernanceCallBanner />

            <TransactionNotification />

            <Banner screenName={screenName} bottomPosition={false} />

            {/* <ChartsSection balancePerCategory={balancePerCategory} balancePerChain={balancePerChain} /> */}

            <AssetsSection
              visibleBalance={balanceVisible}
              accountTotalBalances={accountTotalBalances}
              accountCollectibleCounts={accountCollectibleCounts}
            />

            <InvestmentsSection />

            <Banner screenName={screenName} bottomPosition />

            <AppsButton response={nativeIntegrationResponse} navigation={navigation} isShowLabel />
          </Content>

          <FloatingActions />
          {isFetching && <OnboardingLoader />}
        </Container>
      </>

      {/* Right Side Assets content */}
      <Assets onBackPress={() => swiperRef.current?.scrollBy(-1)} />
    </Swiper>
  );
}

export default Home;

const TAG = 'Home';
