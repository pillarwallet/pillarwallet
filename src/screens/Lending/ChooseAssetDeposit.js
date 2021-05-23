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
import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import orderBy from 'lodash.orderby';
import styled from 'styled-components/native';
import { createStructuredSelector } from 'reselect';
import type { NavigationScreenProp } from 'react-navigation';
import { getEnv } from 'configs/envConfig';
import t from 'translations/translate';

// actions
import { fetchAssetsToDepositAction } from 'actions/lendingActions';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { FlatList, RefreshControl } from 'react-native';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import { BaseText } from 'components/Typography';

// constants
import { LENDING_ENTER_DEPOSIT_AMOUNT } from 'constants/navigationConstants';

// utils
import { formatAmountDisplay } from 'utils/common';
import { fontSizes } from 'utils/variables';
import { getBalance } from 'utils/assets';

// selectors
import { accountEthereumWalletAssetsBalancesSelector } from 'selectors/balances';

// types
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { AssetToDeposit } from 'models/Asset';
import type { WalletAssetsBalances } from 'models/Balances';


type Props = {
  assetsToDeposit: AssetToDeposit[],
  isFetchingAssetsToDeposit: boolean,
  fetchAssetsToDeposit: () => void,
  balances: WalletAssetsBalances,
  navigation: NavigationScreenProp<*>,
};

const InterestText = styled(BaseText)`
  font-size: ${fontSizes.medium}px;
`;

const ChooseAssetDeposit = ({
  assetsToDeposit,
  isFetchingAssetsToDeposit,
  fetchAssetsToDeposit,
  balances,
  navigation,
}: Props) => {
  useEffect(() => {
    fetchAssetsToDeposit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderListItem = ({
    item: {
      symbol,
      name,
      iconUrl,
      earnInterestRate,
    },
  }: { item: AssetToDeposit }) => (
    <ListItemWithImage
      label={name}
      subtext={t('availableValue', {
        value: t('tokenValue', {
          value: formatAmountDisplay(getBalance(balances, symbol)),
          token: symbol,
        }),
      })}
      itemImageUrl={iconUrl ? `${getEnv().SDK_PROVIDER}/${iconUrl}?size=3` : ''}
      onPress={() => navigation.navigate(LENDING_ENTER_DEPOSIT_AMOUNT, { symbol })}
      diameter={48}
      rightColumnInnerStyle={{ alignItems: 'flex-end' }}
    >
      <BaseText secondary>{t('aaveContent.label.currentAPY')}</BaseText>
      <InterestText primary>
        &nbsp;{t('percentValue', { value: formatAmountDisplay(earnInterestRate) })}
      </InterestText>
    </ListItemWithImage>
  );

  const assetsByHighestInterest = orderBy(assetsToDeposit, ['earnInterestRate'], ['desc']);
  const emptyStyle = { flex: 1, justifyContent: 'center', alignItems: 'center' };

  return (
    <ContainerWithHeader headerProps={{ centerItems: [{ title: t('aaveContent.title.assetsToDepositScreen') }] }}>
      <FlatList
        data={assetsByHighestInterest}
        keyExtractor={({ address }) => address}
        renderItem={renderListItem}
        initialNumToRender={9}
        contentContainerStyle={!assetsByHighestInterest.length && emptyStyle}
        ListEmptyComponent={
          !isFetchingAssetsToDeposit ? (
            <EmptyStateParagraph title={t('aaveContent.title.noAssetsToDeposit')} />
          ) : undefined
        }
        refreshControl={
          <RefreshControl
            refreshing={isFetchingAssetsToDeposit}
            onRefresh={() => fetchAssetsToDeposit()}
          />
        }
      />
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  lending: { assetsToDeposit, isFetchingAssetsToDeposit },
}: RootReducerState): $Shape<Props> => ({
  assetsToDeposit,
  isFetchingAssetsToDeposit,
});

const structuredSelector = createStructuredSelector({
  balances: accountEthereumWalletAssetsBalancesSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  fetchAssetsToDeposit: () => dispatch(fetchAssetsToDepositAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(ChooseAssetDeposit);
