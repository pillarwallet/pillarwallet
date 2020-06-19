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
import { View } from 'react-native';
import { connect } from 'react-redux';
import * as dateFns from 'date-fns';
import memoize from 'memoize-one';
import styled, { withTheme } from 'styled-components/native';
import LinearGraph from 'components/LinearGraph';
import { LabelBadge } from 'components/LabelBadge';
import { getDeviceWidth, formatUnits, formatFiat } from 'utils/common';
import { getRate } from 'utils/assets';
import { defaultFiatCurrency, ETH } from 'constants/assetsConstants';

import { getThemeColors } from 'utils/themes';
import type { Theme } from 'models/Theme';
import type { RootReducerState } from 'reducers/rootReducer';
import type { BalancesHistory } from 'models/BalancesHistory';
import type { Rates } from 'models/Asset';


type Props = {
  onDragStart?: () => void,
  onDragEnd?: () => void,
  theme: Theme,
  balancesHistory: BalancesHistory,
  rates: Rates,
  baseFiatCurrency: ?string,
};

type State = {
  timeRange: string,
  activeDataPoint: number,
};

const TimeRangeSwitcher = styled.TouchableOpacity`
  position: absolute;
  top: 10px;
  left: 40px;
`;

const MONTH = 'MONTH';
const WEEK = 'WEEK';
const DAY = 'DAY';
const ALL = 'ALL';

const RANGES = {
  MONTH: {
    label: '30 days',
    xAxisFormat: 'D',
    xAxisValuesCount: 6,
    tooltipFormat: 'D MMM',
    nextTimeRange: WEEK,
  },
  WEEK: {
    label: '7 days',
    xAxisValuesCount: 7,
    xAxisFormat: 'ddd',
    tooltipFormat: 'D MMM',
    nextTimeRange: DAY,
  },
  DAY: {
    label: '1 day',
    xAxisFormat: 'HH:00',
    xAxisValuesCount: 6,
    tooltipFormat: 'ddd HH:mm',
    nextTimeRange: ALL,
  },
  ALL: {
    label: 'all',
    xAxisFormat: 'MMM \'YY',
    xAxisValuesCount: 6,
    tooltipFormat: 'MMM YYYY',
    nextTimeRange: MONTH,
  },
};

const randomBalancesHistory = [...Array(1000).keys()].map(() => ({
  total_balance: Math.random() * 10000000000000000000,
  timestamp: (new Date(dateFns.getTime(new Date()) - Math.random() * (3 * 30 * 24 * 60 * 60 * 1000))).toString(),
}));


class BalanceGraph extends React.Component<Props, State> {
  now: Date;

  constructor(props: Props) {
    super(props);
    this.now = new Date();
    const { balancesHistory } = this.props;
    const filteredHistory = this._getFilteredHistory(balancesHistory, this._getStartRange(balancesHistory, MONTH));
    this.state = {
      timeRange: MONTH,
      activeDataPoint: filteredHistory.length - 1,
    };
  }

  _getStartRange = memoize((balancesHistory, timeRange) => {
    switch (timeRange) {
      case MONTH:
        return dateFns.subDays(this.now, 30);
      case WEEK:
        return dateFns.subDays(this.now, 7);
      case DAY:
        return dateFns.subDays(this.now, 1);
      default:
        return dateFns.min(
          ...balancesHistory
            .filter(({ timestamp }) => !!timestamp)
            .map(({ timestamp }) => new Date(timestamp)),
        );
    }
  })

  getStartRange = () => {
    const { balancesHistory } = this.props;
    const { timeRange } = this.state;
    return this._getStartRange(balancesHistory, timeRange);
  }

  _getFilteredHistory = memoize((balancesHistory, rangeStart) => {
    const filteredHistory = balancesHistory.filter(({ timestamp }) => {
      const date = new Date(timestamp);
      return timestamp && (dateFns.isEqual(date, rangeStart) || dateFns.isAfter(date, rangeStart));
    });

    const sortedHistory = filteredHistory
      .sort((a, b) => dateFns.compareAsc(new Date(a.timestamp), new Date(b.timestamp)));
    return [
      { timestamp: rangeStart.toString(), total_balance: sortedHistory[0].total_balance },
      ...sortedHistory,
      { timestamp: this.now.toString(), total_balance: sortedHistory[sortedHistory.length - 1].total_balance },
    ];
  })

  getFilteredHistory = () => {
    return this._getFilteredHistory(this.props.balancesHistory, this.getStartRange());
  }

  _getFormattedData = memoize((filteredHistory) => {
    const rangeStart = this.getStartRange();

    const rangeStartMs = dateFns.getTime(rangeStart);
    const rangeMs = dateFns.getTime(this.now) - rangeStartMs;

    return filteredHistory
      .map(entry => {
        return { x: (dateFns.getTime(new Date(entry.timestamp)) - rangeStartMs) / rangeMs, y: +entry.total_balance };
      });
  })

  getFormattedData = () => {
    const filteredHistory = this.getFilteredHistory();
    return this._getFormattedData(filteredHistory);
  }

  getFiatCurrency = () => {
    const { baseFiatCurrency } = this.props;
    return baseFiatCurrency || defaultFiatCurrency;
  }

  getAmountInFiat = (amount: number) => {
    const { rates } = this.props;
    const fiatCurrency = this.getFiatCurrency();
    const formattedAmount = parseFloat(formatUnits(amount.toString(), 18));
    return formattedAmount * getRate(rates, ETH, fiatCurrency);
  }

  getYAxisValue = (y: number) => {
    const fiatCurrency = this.getFiatCurrency();
    const amountInFiat = this.getAmountInFiat(y);
    const roundedAmountInFiat = (+amountInFiat.toPrecision(2)).toString();
    return formatFiat(roundedAmountInFiat, fiatCurrency);
  }

  getXAxisValue = (x: number) => {
    const { timeRange } = this.state;

    const rangeStart = this.getStartRange();

    const rangeStartMs = dateFns.getTime(rangeStart);
    const nowMs = dateFns.getTime(this.now);
    const date = new Date(rangeStartMs + ((nowMs - rangeStartMs) * x));

    const dateFormat = RANGES[timeRange].xAxisFormat;
    return dateFns.format(date, dateFormat);
  }

  getTooltipContent = () => {
    const { timeRange, activeDataPoint } = this.state;
    const entry = this.getFilteredHistory()[activeDataPoint];
    const dateFormat = RANGES[timeRange].tooltipFormat;
    const fiatCurrency = this.getFiatCurrency();
    const formattedBalance = formatFiat(this.getAmountInFiat(+entry.total_balance), fiatCurrency);
    return `${dateFns.format(new Date(entry.timestamp), dateFormat)}\n${formattedBalance}`;
  }

  getTimeRangeSwitcherLabel = () => {
    return RANGES[this.state.timeRange].label;
  }

  switchTimeRange = () => {
    const newTimeRange = RANGES[this.state.timeRange].nextTimeRange;
    const { balancesHistory } = this.props;
    const startRange = this._getStartRange(balancesHistory, newTimeRange);
    const filteredHistory = this._getFilteredHistory(balancesHistory, startRange);
    this.setState({ timeRange: newTimeRange, activeDataPoint: filteredHistory.length - 1 });
  }

  render() {
    const { onDragStart, onDragEnd, theme } = this.props;
    const { activeDataPoint, timeRange } = this.state;
    const data = this.getFormattedData();

    if (data.length < 2) return null;

    const colors = getThemeColors(theme);

    return (
      <View>
        <LinearGraph
          data={data}
          width={getDeviceWidth()}
          height={140}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          getTooltipContent={this.getTooltipContent}
          getXAxisValue={this.getXAxisValue}
          xAxisValuesCount={RANGES[timeRange].xAxisValuesCount}
          getYAxisValue={this.getYAxisValue}
          activeDataPoint={Math.min(activeDataPoint, data.length - 1)}
          onActivePointChange={(point) => this.setState({ activeDataPoint: point })}
          extra={timeRange}
        />
        <TimeRangeSwitcher onPress={this.switchTimeRange}>
          <LabelBadge
            label={this.getTimeRangeSwitcherLabel()}
            color={colors.labelTertiary}
          />
        </TimeRangeSwitcher>
      </View>
    );
  }
}

const mapStateToProps = ({
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency } },
  balancesHistory: { data: balancesHistory },
}: RootReducerState): $Shape<Props> => ({
  rates,
  baseFiatCurrency,
  balancesHistory: randomBalancesHistory,
});


export default withTheme(connect(mapStateToProps)(BalanceGraph));
