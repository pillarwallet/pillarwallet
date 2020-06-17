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
import { SDK_PROVIDER } from 'react-native-dotenv';

// actions
import { fetchAssetsToDepositAction } from 'actions/lendingActions';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { ScrollWrapper } from 'components/Layout';
import { FlatList, RefreshControl } from 'react-native';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import { BaseText } from 'components/Typography';

// utils
import { formatAmount } from 'utils/common';
import { fontSizes } from 'utils/variables';

// types
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { DepositableAsset } from 'models/Asset';


type Props = {
  assetsToDeposit: DepositableAsset[],
  isFetchingAssetsToDeposit: boolean,
  fetchAssetsToDeposit: () => void,
};

const InterestText = styled(BaseText)`
  margin-top: 3px;
  font-size: ${fontSizes.medium};
`;

const ChooseAssetDeposit = ({
  assetsToDeposit,
  isFetchingAssetsToDeposit,
  fetchAssetsToDeposit,
}: Props) => {
  useEffect(() => {
    fetchAssetsToDeposit();
  }, []);

  const renderListItem = ({
    item: {
      symbol,
      name,
      iconUrl,
      earnInterestRate,
    },
  }: DepositableAsset) => (
    <ListItemWithImage
      label={name}
      subtext={`Available: 0.00 ${symbol}`}
      avatarUrl={iconUrl ? `${SDK_PROVIDER}/${iconUrl}?size=3` : ''}
      onPress={() => {}}
      diameter={48}
      rightColumnInnerStyle={{ alignItems: 'flex-end' }}
    >
      <BaseText secondary>Current APY</BaseText>
      <InterestText primary>{formatAmount(earnInterestRate, 2)}%</InterestText>
    </ListItemWithImage>
  );

  const assetsByHighestInterest = orderBy(assetsToDeposit, ['updatedAt'], ['desc']);
  const emptyStyle = { flex: 1, justifyContent: 'center', alignItems: 'center' };

  return (
    <ContainerWithHeader headerProps={{ centerItems: [{ title: 'Choose asset to deposit' }] }}>
      <ScrollWrapper contentContainerStyle={!assetsByHighestInterest.length && emptyStyle}>
        <FlatList
          data={assetsByHighestInterest}
          keyExtractor={({ address }) => address}
          renderItem={renderListItem}
          initialNumToRender={9}
          contentContainerStyle={!assetsByHighestInterest.length && emptyStyle}
          ListEmptyComponent={!isFetchingAssetsToDeposit && <EmptyStateParagraph title="No assets to deposit" />}
          refreshControl={
            <RefreshControl
              refreshing={isFetchingAssetsToDeposit}
              onRefresh={() => fetchAssetsToDeposit()}
            />
          }
        />
      </ScrollWrapper>
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  lending: { assetsToDeposit, isFetchingAssetsToDeposit },
}: RootReducerState): $Shape<Props> => ({
  assetsToDeposit,
  isFetchingAssetsToDeposit,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  fetchAssetsToDeposit: () => dispatch(fetchAssetsToDepositAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(ChooseAssetDeposit);
