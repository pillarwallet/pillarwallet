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

import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { ScrollWrapper } from 'components/Layout';
import {
  FlatList,
  RefreshControl,
} from 'react-native';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import { fetchDepositPoolAction } from 'actions/lendingActions';

import type { Dispatch } from 'reducers/rootReducer';


type Props = {
  fetchDepositPool: () => void,
};

const DepositPool = ({
  fetchDepositPool,
}: Props) => {
  useEffect(() => {
    fetchDepositPool();
  }, []);

  const renderListItem = () => null;

  const devicesByLatest = orderBy([], ['updatedAt'], ['desc']);
  const emptyStyle = { flex: 1, justifyContent: 'center', alignItems: 'center' };

  return (
    <ContainerWithHeader headerProps={{ centerItems: [{ title: 'Manage devices' }] }}>
      <ScrollWrapper contentContainerStyle={!devicesByLatest.length && emptyStyle}>
        <FlatList
          data={devicesByLatest}
          keyExtractor={({ address }) => `${address}`}
          renderItem={renderListItem}
          initialNumToRender={9}
          contentContainerStyle={!devicesByLatest.length && emptyStyle}
          ListEmptyComponent={<EmptyStateParagraph title="No Connected Devices" />}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => fetchDepositPool()}
            />
          }
        />
      </ScrollWrapper>
    </ContainerWithHeader>
  );
};

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  fetchDepositPool: () => dispatch(fetchDepositPoolAction()),
});

export default connect(null, mapDispatchToProps)(DepositPool);
