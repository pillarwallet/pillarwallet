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
import { View } from 'react-native';
import PagerView from 'react-native-pager-view';
import styled from 'styled-components/native';
import { BigNumber } from 'bignumber.js';
import { clamp } from 'lodash';

// Components
import PagerControl from 'components/layout/PagerControl';

// Types
import type { AssetCategoryRecord } from 'models/AssetCategory';
import type { ChainRecord } from 'models/Chain';

// Local
import AssetPieChart from './components/AssetPieChart';
import ChainPieChart from './components/ChainPieChart';

type Props = {|
  balancePerCategory: AssetCategoryRecord<BigNumber>,
  balancePerChain: ChainRecord<BigNumber>,
|};

function ChartsSection({ balancePerCategory, balancePerChain }: Props) {
  const pagerRef = React.useRef<any>();

  const [currentPage, setCurrentPage] = React.useState(0);

  const handleChangePage = (page: number) => {
    setCurrentPage(page);
    pagerRef.current.setPage(page);
  };

  const handlePageScroll = (event: any) => {
    const page = Math.round(event.nativeEvent.position + event.nativeEvent.offset);
    setCurrentPage(clamp(page, 0, 1));
  };

  return (
    <Container>
      <PagerView ref={pagerRef} onPageScroll={handlePageScroll} style={styles.pageView}>
        <View key="assets" collapsable={false}>
          <AssetPieChart balancePerCategory={balancePerCategory} />
        </View>
        <View key="chains" collapsable={false}>
          <ChainPieChart balancePerChain={balancePerChain} />
        </View>
      </PagerView>
      <PagerControl pageCount={2} currentPage={currentPage} onChangePage={handleChangePage} />
    </Container>
  );
}

export default ChartsSection;

const styles = {
  pageView: {
    height: 300,
  },
};

const Container = styled.View``;
