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
import { useNavigation } from 'react-navigation-hooks';
import { useDispatch } from 'react-redux';
import t from 'translations/translate';

// Components
import { Container } from 'components/Layout';
import { BaseText } from 'components/Typography';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Spinner from 'components/Spinner';
import Button from 'components/Button';

// Selectors
import { useRootSelector, activeAccountSelector } from 'selectors';
import { accountAssetsSelector } from 'selectors/assets';
import { availableStakeSelector, PPNIncomingTransactionsSelector } from 'selectors/paymentNetwork';

// Actions
import { fetchInitialAssetsAction } from 'actions/assetsActions';
import { fetchAllCollectiblesDataAction } from 'actions/collectiblesActions';

// Constants
import { FETCH_INITIAL_FAILED, FETCHED } from 'constants/assetsConstants';
import { PAYMENT_COMPLETED, SMART_WALLET_UPGRADE_STATUSES } from 'constants/smartWalletConstants';
import { BLOCKCHAIN_NETWORK_TYPES } from 'constants/blockchainNetworkConstants';
import { ACCOUNTS } from 'constants/navigationConstants';

// Utils
import { getAccountName } from 'utils/accounts';
import { getSmartWalletStatus, isDeployingSmartWallet, getDeploymentHash } from 'utils/smartWallet';
import { useTheme, useThemeColors, getColorByThemeOutsideStyled } from 'utils/themes';

// Local
import PPNView from 'screens/Assets/PPNView';
import WalletView from 'screens/Assets/WalletView';
import WalletActivation from 'screens/Assets/WalletActivation';

const VIEWS = {
  SMART_WALLET_VIEW: 'SMART_WALLET_VIEW',
  PPN_VIEW: 'PPN_VIEW',
};

function AssetsScreen() {
  const navigation = useNavigation();

  const accounts = useRootSelector((root) => root.accounts.data);
  const assets = useRootSelector(accountAssetsSelector);
  const assetsState = useRootSelector((root) => root.assets.assetsState);
  const smartWalletState = useRootSelector(root => root.smartWallet);
  const blockchainNetworks = useRootSelector((root) => root.blockchainNetwork.data);
  const activeAccount = useRootSelector(activeAccountSelector);
  const availableStake = useRootSelector(availableStakeSelector);
  const PPNTransactions = useRootSelector(PPNIncomingTransactionsSelector);

  const dispatch = useDispatch();

  const theme = useTheme();
  const colors = useThemeColors();

  React.useEffect(() => {
    if (!Object.keys(assets).length) {
      dispatch(fetchInitialAssetsAction());
    }

    dispatch(fetchAllCollectiblesDataAction());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  // shouldComponentUpdate(nextProps: Props, nextState: State) {
  //   const { navigation } = this.props;
  //   const isEq = isEqual(this.props, nextProps) && isEqual(this.state, nextState);
  //   const isFocused = navigation.isFocused();

  //   if (!isFocused) {
  //     if (!isEq) this.forceRender = true;
  //     return false;
  //   }

  //   if (this.forceRender) {
  //     this.forceRender = false;
  //     return true;
  //   }

  //   return !isEq;
  // }

  const getScreenInfo = () => {
    const { type: walletType } = activeAccount || {};
    const activeBNetwork = blockchainNetworks.find((network) => network.isActive) || { id: '', translationKey: '' };
    const { id: activeBNetworkId, translationKey } = activeBNetwork;
    const activeBNetworkTitle = t(translationKey);

    switch (activeBNetworkId) {
      case BLOCKCHAIN_NETWORK_TYPES.ETHEREUM:
        return {
          label: getAccountName(walletType),
          action: () => navigation.navigate(ACCOUNTS),
          screenView: VIEWS.SMART_WALLET_VIEW,
          customHeaderButtonProps: {
            backgroundColor: colors.primaryAccent130,
          },
        };

      default:
        const hasUnsettledTx = PPNTransactions.some(({ stateInPPN }) => stateInPPN === PAYMENT_COMPLETED);
        return {
          label: activeBNetworkTitle,
          action: () => navigation.navigate(ACCOUNTS),
          screenView: VIEWS.PPN_VIEW,
          customHeaderButtonProps: {
            isActive: availableStake > 0 || hasUnsettledTx,
            backgroundColor: getColorByThemeOutsideStyled(theme.current, {
              lightCustom: 'transparent',
              darkKey: 'synthetic140',
            }),
            color: getColorByThemeOutsideStyled(theme.current, {
              lightKey: 'basic010',
              darkKey: 'basic090',
            }),
            style: {
              borderWidth: 1,
              borderColor: getColorByThemeOutsideStyled(theme.current, {
                lightKey: 'basic005',
                darkKey: 'synthetic140',
              }),
            },
          },
        };
    }
  };

  const renderView = (viewType: string, onScroll: (Object) => void) => {
    const smartWalletStatus = getSmartWalletStatus(accounts, smartWalletState);
    const isDeploying = isDeployingSmartWallet(smartWalletState, accounts);

    if (!Object.keys(assets).length && assetsState === FETCHED) {
      return (
        <Container center inset={{ bottom: 0 }}>
          <BaseText style={{ marginBottom: 20 }}>{t('label.loadingDefaultAssets')}</BaseText>
          {assetsState !== FETCH_INITIAL_FAILED && <Spinner />}
          {assetsState === FETCH_INITIAL_FAILED && (
            <Button title={t('button.tryAgain')} onPress={() => dispatch(fetchInitialAssetsAction())} />
          )}
        </Container>
      );
    }

    if (isDeploying && viewType === VIEWS.SMART_WALLET_VIEW) {
      const deploymentHash = getDeploymentHash(smartWalletState);

      if (deploymentHash) {
        return <WalletActivation deploymentHash={deploymentHash} />;
      }
    }

    switch (viewType) {
      case VIEWS.SMART_WALLET_VIEW:
        return (
          <WalletView
            showDeploySmartWallet={smartWalletStatus.status === SMART_WALLET_UPGRADE_STATUSES.ACCOUNT_CREATED}
            onScroll={onScroll}
          />
        );
      case VIEWS.PPN_VIEW:
        return <PPNView onScroll={onScroll} />;
      default:
        return null;
    }
  };

  const {
    label: headerButtonLabel,
    action: headerButtonAction,
    screenView,
    customHeaderButtonProps,
  } = getScreenInfo();

  return (
    <ContainerWithHeader
      headerProps={{
        rightItems: !!activeAccount ? [
          {
            actionButton: {
              key: 'manageAccounts',
              label: headerButtonLabel,
              hasChevron: true,
              onPress: headerButtonAction,
              ...customHeaderButtonProps,
            },
          }
        ] : null,
        centerItems: [
          {
            title: t('title.assets'),
          },
        ],
        sideFlex: 5,
      }}
      inset={{ bottom: 0 }}
      tab
    >
      {(onScroll) => renderView(screenView, onScroll)}
    </ContainerWithHeader>
  );
}

export default AssetsScreen;
