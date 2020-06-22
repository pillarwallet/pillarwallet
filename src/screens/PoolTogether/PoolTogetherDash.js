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
import { RefreshControl, Platform, Image } from 'react-native';
import { connect } from 'react-redux';
import styled from 'styled-components/native';
import { createStructuredSelector } from 'reselect';
import type { NavigationScreenProp } from 'react-navigation';

// actions
import { logScreenViewAction } from 'actions/analyticsActions';
import { fetchPoolPrizeInfo } from 'actions/poolTogetherActions';

// constants
import { DAI, USDC } from 'constants/assetsConstants';

// components
import { ScrollWrapper } from 'components/Layout';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Tabs from 'components/Tabs';

// models
import type { Accounts } from 'models/Account';
import type { Balances } from 'models/Asset';
import type { PoolPrizeInfo } from 'models/PoolTogether';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Theme } from 'models/Theme';

// selectors
import { accountHistorySelector } from 'selectors/history';
import { accountBalancesSelector } from 'selectors/balances';

// local screen components
import PoolCard from './PoolCard';
import PoolTickets from './PoolTickets';

const ContentWrapper = styled.View`
  padding-top: ${Platform.select({
    ios: '25px',
    android: '19px',
  })};
`;

const LogoWrapper = styled.View`
  position: relative;
  justify-content: center;
  align-items: center;
  margin: 0px 20px;
`;

const poolTogetherLogo = require('assets/images/pool_together.png');

type Props = {
  name: string,
  navigation: NavigationScreenProp<*>,
  session: Object,
  smartWallet: Object,
  accounts: Accounts,
  balances: Balances,
  poolPrizeInfo: PoolPrizeInfo,
  logScreenView: (view: string, screen: string) => void,
  fetchPoolStats: (symbol: string) => void,
  theme: Theme,
};

type State = {
  activeTab: string,
  ticketsCount: Object,
};

class PoolTogetherDash extends React.Component<Props, State> {
  isComponentMounted: boolean = false;
  scroll: Object;

  state = {
    activeTab: DAI,
    ticketsCount: {
      DAI: 0,
      USDC: 0,
    },
  };

  componentDidMount() {
    const { logScreenView } = this.props;
    this.isComponentMounted = true;
    this.props.fetchPoolStats(DAI);
    logScreenView('View PoolTogether', 'PoolTogether');
  }

  componentWillUnmount() {
    this.isComponentMounted = false;
  }

  setActiveTab = (activeTab: string) => {
    this.setState({
      activeTab,
    }, () => {
      this.props.fetchPoolStats(activeTab);
    });
  };

  onTicketCountChange = (newTicketCount: number) => {
    const {
      ticketsCount,
      activeTab,
    } = this.state;
    this.setState({
      ticketsCount: {
        ...ticketsCount,
        [activeTab]: newTicketCount,
      },
    });
  }

  render() {
    const {
      fetchPoolStats,
      poolPrizeInfo,
      balances,
    } = this.props;

    const {
      activeTab,
      ticketsCount,
    } = this.state;

    const poolCurrencyTabs = [
      {
        id: DAI,
        name: 'DAI Pool',
        onPress: () => this.setActiveTab(DAI),
      },
      {
        id: USDC,
        name: 'USDC Pool',
        onPress: () => this.setActiveTab(USDC),
      },
    ];

    const {
      currentPrize,
      prizeEstimate,
      remainingTimeMs,
      totalPoolTicketsCount,
    } = poolPrizeInfo[activeTab];

    const { balance = '0' } = balances[activeTab] || {};

    const poolTokenBalance = Math.floor(parseFloat(balance)); // get integer closest to balance for ticket enumeration

    const poolTicketsCount = ticketsCount[activeTab];

    return (
      <ContainerWithHeader
        inset={{ bottom: 'never' }}
        headerProps={{ centerItems: [{ title: 'Pool Together' }] }}
      >
        <ScrollWrapper
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => {
                fetchPoolStats(activeTab);
              }}
            />
          }
          innerRef={ref => { this.scroll = ref; }}
        >
          <ContentWrapper>
            <LogoWrapper>
              <Image
                style={{
                  height: 64,
                  width: 64,
                }}
                source={poolTogetherLogo}
                resizeMode="contain"
              />
            </LogoWrapper>
            <Tabs tabs={poolCurrencyTabs} wrapperStyle={{ marginTop: 8 }} activeTab={activeTab} />
            <PoolCard
              currentPrize={currentPrize}
              prizeEstimate={prizeEstimate}
              remainingTimeMs={remainingTimeMs}
              activeTab={activeTab}
            />
            <PoolTickets
              currentCount={poolTicketsCount}
              maxCount={poolTokenBalance}
              totalPoolTicketsCount={totalPoolTicketsCount}
              remainingTimeMs={remainingTimeMs}
              onPressCallback={() => null}
              onTicketCountChange={this.onTicketCountChange}
            />
          </ContentWrapper>
        </ScrollWrapper>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  session: { data: session },
  accounts: { data: accounts },
  poolTogether: { poolStats: poolPrizeInfo },
}: RootReducerState): $Shape<Props> => ({
  session,
  accounts,
  poolPrizeInfo,
});

const structuredSelector = createStructuredSelector({
  history: accountHistorySelector,
  balances: accountBalancesSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  logScreenView: (view: string, screen: string) => dispatch(logScreenViewAction(view, screen)),
  fetchPoolStats: (symbol: string) => dispatch(fetchPoolPrizeInfo(symbol)),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(PoolTogetherDash);
