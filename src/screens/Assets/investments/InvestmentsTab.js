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
import { FlatList } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import BalanceView from 'components/BalanceView';
import FloatingButtons from 'components/FloatingButtons';
import Banner from 'components/Banner/Banner';
import InvestmentListItem from 'components/lists/InvestmentListItem';

// Constants
import { WALLETCONNECT } from 'constants/navigationConstants';

// Utils
import { spacing } from 'utils/variables';

// Types
import type { AppHoldings } from 'models/Investment';

// Hooks
import { useAppHoldings } from 'hooks/apps';

function InvestmentsTab() {
  const { t } = useTranslationWithPrefix('assets.investments');
  const navigation = useNavigation();
  const safeArea = useSafeAreaInsets();
  const { totalBalanceOfHoldings, appHoldings } = useAppHoldings();

  const navigateToWalletConnect = () => navigation.navigate(WALLETCONNECT);

  const buttons = [{ title: t('invest'), iconName: 'plus', onPress: navigateToWalletConnect }];

  const renderListHeader = () => {
    return (
      <ListHeader>
        <BalanceView balance={totalBalanceOfHoldings} style={styles.balanceView} />

        <BannerContent>
          <Banner screenName="HOME_APPS" bottomPosition={false} />
        </BannerContent>
      </ListHeader>
    );
  };

  const renderItem = (appsHolding: AppHoldings) => {
    const { name, network } = appsHolding;
    return <InvestmentListItem key={`${name}-${network}`} {...appsHolding} onPress={() => { }} />;
  };

  return (
    <Container>
      <FlatList
        data={appHoldings}
        renderItem={({ item }) => renderItem(item)}
        ListHeaderComponent={renderListHeader()}
        contentContainerStyle={{
          paddingBottom: safeArea.bottom + FloatingButtons.SCROLL_VIEW_BOTTOM_INSET,
        }}
      />

      <FloatingButtons items={buttons} />
    </Container>
  );
}

export default InvestmentsTab;

const styles = {
  balanceView: {
    marginBottom: spacing.extraSmall,
  },
};

const Container = styled.View`
  flex: 1;
`;

const ListHeader = styled.View`
  align-items: center;
  margin-top: ${spacing.largePlus}px;
  margin-bottom: 32px;
`;

const BannerContent = styled.View`
  width: 100%;
`;
