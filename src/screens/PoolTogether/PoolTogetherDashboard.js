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
import { RefreshControl, Image } from 'react-native';
import { connect } from 'react-redux';
import styled from 'styled-components/native';
import { createStructuredSelector } from 'reselect';
import type { NavigationScreenProp } from 'react-navigation';
import t from 'translations/translate';

// actions
import { logScreenViewAction } from 'actions/analyticsActions';
import { fetchPoolPrizeInfo, fetchPoolAllowanceStatusAction } from 'actions/poolTogetherActions';

// constants
import { DAI, USDC } from 'constants/assetsConstants';
import { POOLTOGETHER_PURCHASE, POOLTOGETHER_WITHDRAW } from 'constants/navigationConstants';
import { TRANSACTION_EVENT } from 'constants/historyConstants';

// components
import { ScrollWrapper, Spacing } from 'components/Layout';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Tabs from 'components/Tabs';
import CircleButton from 'components/CircleButton';
import ActivityFeed from 'components/ActivityFeed';
import RetryGraphQueryBox from 'components/RetryGraphQueryBox';

// models
import type { Accounts } from 'models/Account';
import type { Balances } from 'models/Asset';
import type { PoolPrizeInfo } from 'models/PoolTogether';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Theme } from 'models/Theme';

// selectors
import { accountHistorySelector } from 'selectors/history';
import { accountBalancesSelector } from 'selectors/balances';

// utils
import { fontSizes } from 'utils/variables';
import { isPoolTogetherTag } from 'utils/poolTogether';
import { mapTransactionsHistory } from 'utils/feedData';

// local screen components
import PoolCard from './PoolCard';
import PoolTickets from './PoolTickets';

const ContentWrapper = styled.View`
  padding-top: 24px;
`;

const LogoWrapper = styled.View`
  position: relative;
  justify-content: center;
  align-items: center;
  margin: 0px 20px;
`;

const TicketButtonsWrapper = styled.View`
  padding: 0 85px;
  flex-direction: row;
  justify-content: space-between;
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
  fetchPoolAllowanceStatus: (symbol: string) => void,
  isFetchingPoolStats: boolean,
  theme: Theme,
  history: Object[],
  poolStatsGraphQueryFailed: { [symbol: string]: boolean },
};

type State = {
  activeTab: string,
  ticketsCount: Object,
};

class PoolTogetherDashboard extends React.Component<Props, State> {
  scroll: Object;

  constructor(props) {
    super(props);
    const {
      navigation,
    } = this.props;
    const symbol = navigation.getParam('symbol', DAI);
    this.state = {
      activeTab: symbol || DAI,
      ticketsCount: {
        DAI: 0,
        USDC: 0,
      },
    };
  }

  componentDidMount() {
    const {
      logScreenView,
      fetchPoolStats,
      fetchPoolAllowanceStatus,
    } = this.props;
    fetchPoolStats(DAI);
    fetchPoolAllowanceStatus(DAI);
    logScreenView('View PoolTogether', 'PoolTogether');
  }

  setActiveTab = (activeTab: string) => {
    this.setState({
      activeTab,
    }, () => {
      this.props.fetchPoolStats(activeTab);
      this.props.fetchPoolAllowanceStatus(activeTab);
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

  retryGraphQuery = () => {
    const { activeTab } = this.state;
    const { fetchPoolStats } = this.props;
    fetchPoolStats(activeTab);
  }

  render() {
    const {
      navigation,
      fetchPoolStats,
      poolPrizeInfo,
      balances,
      history,
      accounts,
      isFetchingPoolStats,
      poolStatsGraphQueryFailed,
    } = this.props;

    const {
      activeTab,
      ticketsCount,
    } = this.state;

    const poolCurrencyTabs = [
      {
        id: DAI,
        name: t('poolTogetherContent.label.daiPool'),
        onPress: () => this.setActiveTab(DAI),
      },
      {
        id: USDC,
        name: t('poolTogetherContent.label.usdcPool'),
        onPress: () => this.setActiveTab(USDC),
      },
    ];

    const {
      currentPrize,
      prizeEstimate,
      remainingTimeMs,
      totalPoolTicketsCount,
      userInfo = null,
    } = poolPrizeInfo[activeTab];

    const { balance = '0' } = balances[activeTab] || {};

    const poolTokenBalance = Math.floor(parseFloat(balance)); // get integer closest to balance for ticket enumeration

    const poolTicketsCount = ticketsCount[activeTab];

    let userTickets = 0;
    if (userInfo) {
      userTickets = Math.floor(parseFloat(userInfo.ticketBalance));
    }

    const transactionsOnMainnet = mapTransactionsHistory(
      history,
      accounts,
      TRANSACTION_EVENT,
    );

    const relatedHistory = transactionsOnMainnet
      .filter(ev => isPoolTogetherTag(ev.tag) && ev.extra.symbol === activeTab);

    return (
      <ContainerWithHeader
        inset={{ bottom: 'never' }}
        headerProps={{ centerItems: [{ title: t('poolTogetherContent.title.mainScreen') }] }}
      >
        <ScrollWrapper
          refreshControl={
            <RefreshControl
              refreshing={isFetchingPoolStats}
              onRefresh={() => fetchPoolStats(activeTab)}
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
            <Spacing h={22} />
            <Tabs tabs={poolCurrencyTabs} activeTab={activeTab} />
            <Spacing h={16} />
            <PoolCard
              currentPrize={currentPrize}
              prizeEstimate={prizeEstimate}
              remainingTimeMs={remainingTimeMs}
              totalPoolTicketsCount={totalPoolTicketsCount}
              activeTab={activeTab}
              userTickets={userTickets}
            />
            <Spacing h={16} />
            {!!userInfo &&
              <TicketButtonsWrapper>
                <CircleButton
                  label={t('button.purchase')}
                  onPress={() => {
                    navigation.navigate(POOLTOGETHER_PURCHASE, {
                      poolToken: activeTab,
                      poolTicketsCount,
                      poolTokenBalance,
                      totalPoolTicketsCount,
                      userTickets,
                    });
                  }}
                  fontIcon="plus"
                  fontIconStyle={{ fontSize: fontSizes.big }}
                  disabled={poolTokenBalance <= 0}
                />
                <CircleButton
                  label={t('button.withdraw')}
                  fontIcon="up-arrow"
                  fontIconStyle={{ fontSize: fontSizes.big }}
                  onPress={() => {
                    navigation.navigate(POOLTOGETHER_WITHDRAW, {
                      poolToken: activeTab,
                      poolTicketsCount,
                      poolTokenBalance,
                      totalPoolTicketsCount,
                      userTickets,
                    });
                  }}
                  disabled={userTickets <= 0}
                />
              </TicketButtonsWrapper>
            }
            {!userInfo &&
              <>
                <Spacing h={30} />
                <PoolTickets
                  currentCount={poolTicketsCount}
                  maxCount={poolTokenBalance}
                  totalPoolTicketsCount={totalPoolTicketsCount}
                  userTickets={userTickets}
                  remainingTimeMs={remainingTimeMs}
                  onPressCallback={() => {
                    navigation.navigate(POOLTOGETHER_PURCHASE, {
                      poolToken: activeTab,
                      poolTicketsCount,
                      poolTokenBalance,
                      totalPoolTicketsCount,
                      userTickets,
                    });
                  }}
                  onTicketCountChange={this.onTicketCountChange}
                />
              </>
            }
            <Spacing h={40} />
            {!!relatedHistory.length && (
              <>
                <ActivityFeed
                  feedTitle={t('poolTogetherContent.title.activityFeed')}
                  navigation={navigation}
                  feedData={relatedHistory}
                />
                <Spacing h={50} />
              </>
            )}
          </ContentWrapper>
        </ScrollWrapper>
        <RetryGraphQueryBox
          message={t('error.theGraphQueryFailed.poolTogetherStats')}
          hasFailed={!!poolStatsGraphQueryFailed[activeTab]}
          isFetching={isFetchingPoolStats}
          onRetry={this.retryGraphQuery}
        />
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  session: { data: session },
  accounts: { data: accounts },
  poolTogether: {
    poolStats: poolPrizeInfo,
    isFetchingPoolStats,
    poolStatsGraphQueryFailed,
  },
}: RootReducerState): $Shape<Props> => ({
  session,
  accounts,
  poolPrizeInfo,
  isFetchingPoolStats,
  poolStatsGraphQueryFailed,
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
  fetchPoolAllowanceStatus: (symbol: string) => dispatch(fetchPoolAllowanceStatusAction(symbol)),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(PoolTogetherDashboard);
