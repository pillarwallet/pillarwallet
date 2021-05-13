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
import { useRootSelector } from 'selectors';
import { accountAssetsSelector } from 'selectors/assets';
import { availableStakeSelector, PPNIncomingTransactionsSelector } from 'selectors/paymentNetwork';

// Actions
import { fetchInitialAssetsAction } from 'actions/assetsActions';
import { fetchAllCollectiblesDataAction } from 'actions/collectiblesActions';

// Constants
import { FETCH_INITIAL_FAILED, FETCHED } from 'constants/assetsConstants';
import { ARCHANOVA_PPN_PAYMENT_COMPLETED } from 'constants/archanovaConstants';
import { ACCOUNTS } from 'constants/navigationConstants';

// Utils
import { useTheme, getColorByThemeOutsideStyled } from 'utils/themes';

// Local
import PPNView from './PPNView';

const VIEWS = {
  PPN_VIEW: 'PPN_VIEW',
};

/**
 * This is legacy PPN Home screen extracted from legacy Assets screen.
 */
function PPNHome() {
  const navigation = useNavigation();

  const assets = useRootSelector(accountAssetsSelector);
  const assetsState = useRootSelector((root) => root.assets.assetsState);
  const blockchainNetworks = useRootSelector((root) => root.blockchainNetwork.data);
  const availableStake = useRootSelector(availableStakeSelector);
  const PPNTransactions = useRootSelector(PPNIncomingTransactionsSelector);

  const dispatch = useDispatch();

  const theme = useTheme();

  React.useEffect(() => {
    if (!Object.keys(assets).length) {
      dispatch(fetchInitialAssetsAction());
    }

    dispatch(fetchAllCollectiblesDataAction());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const getScreenInfo = () => {
    const activeBNetwork = blockchainNetworks.find((network) => network.isActive) || { id: '', translationKey: '' };
    const { translationKey } = activeBNetwork;
    const activeBNetworkTitle = t(translationKey);

    const hasUnsettledTx = PPNTransactions.some(({ stateInPPN }) => stateInPPN === ARCHANOVA_PPN_PAYMENT_COMPLETED);
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
  };

  const renderView = (viewType: string, onScroll: (Object) => void) => {
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

    return <PPNView onScroll={onScroll} />;
  };

  const { screenView } = getScreenInfo();

  return (
    <ContainerWithHeader
      headerProps={{
        centerItems: [
          {
            title: t('ppnContent.title.home'),
          },
        ],
      }}
      inset={{ bottom: 0 }}
      tab
    >
      {(onScroll) => renderView(screenView, onScroll)}
    </ContainerWithHeader>
  );
}

export default PPNHome;
