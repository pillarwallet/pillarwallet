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
import { connect } from 'react-redux';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { getEnv } from 'configs/envConfig';

// actions
import { fetchDepositedAssetsAction } from 'actions/lendingActions';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { FlatList, RefreshControl } from 'react-native';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import { BaseText } from 'components/Typography';

// utils
import { formatAmountDisplay } from 'utils/common';
import { fontSizes } from 'utils/variables';

// types
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { DepositedAsset } from 'models/Asset';
import { LENDING_VIEW_DEPOSITED_ASSET } from 'constants/navigationConstants';


type Props = {
  depositedAssets: DepositedAsset[],
  isFetchingDepositedAssets: boolean,
  fetchDepositedAssets: () => void,
  navigation: NavigationScreenProp<*>,
};

const DepositedAssetGain = styled(BaseText)`
  margin-bottom: 5px;
  font-size: ${fontSizes.big};
`;

const emptyStyle = { flex: 1, justifyContent: 'center', alignItems: 'center' };

const DepositedAssetsList = ({
  depositedAssets,
  isFetchingDepositedAssets,
  fetchDepositedAssets,
  navigation,
}: Props) => {
  const renderListItem = ({ item: depositedAsset }: { item: DepositedAsset }) => {
    const {
      symbol,
      earnInterestRate,
      currentBalance,
      earnedAmount,
      earningsPercentageGain,
      iconUrl,
    } = depositedAsset;

    return (
      <ListItemWithImage
        label={`${formatAmountDisplay(currentBalance)} ${symbol}`}
        subtext={`Current APY ${formatAmountDisplay(earnInterestRate)}%`}
        itemImageUrl={iconUrl ? `${getEnv().SDK_PROVIDER}/${iconUrl}?size=3` : ''}
        onPress={() => navigation.navigate(LENDING_VIEW_DEPOSITED_ASSET, { depositedAsset })}
        diameter={48}
        rightColumnInnerStyle={{ alignItems: 'flex-end' }}
      >
        <DepositedAssetGain positive>+ {formatAmountDisplay(earnedAmount)} {symbol}</DepositedAssetGain>
        <BaseText secondary>+{formatAmountDisplay(earningsPercentageGain)}%</BaseText>
      </ListItemWithImage>
    );
  };

  return (
    <ContainerWithHeader headerProps={{ centerItems: [{ title: 'Your deposits' }] }}>
      <FlatList
        data={depositedAssets}
        keyExtractor={({ address }) => address}
        renderItem={renderListItem}
        initialNumToRender={9}
        contentContainerStyle={!depositedAssets.length && emptyStyle}
        ListEmptyComponent={!isFetchingDepositedAssets && <EmptyStateParagraph title="No deposited assets" />}
        refreshControl={
          <RefreshControl
            refreshing={isFetchingDepositedAssets}
            onRefresh={() => fetchDepositedAssets()}
          />
        }
      />
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  lending: { depositedAssets, isFetchingDepositedAssets },
}: RootReducerState): $Shape<Props> => ({
  depositedAssets,
  isFetchingDepositedAssets,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  fetchDepositedAssets: () => dispatch(fetchDepositedAssetsAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(DepositedAssetsList);
