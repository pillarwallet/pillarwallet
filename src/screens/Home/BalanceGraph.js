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
import * as dateDns from 'date-fns';
import memoize from 'memoize-one';
import styled, { withTheme } from 'styled-components/native';
import LinearGraph from 'components/LinearGraph';
import { LabelBadge } from 'components/LabelBadge';
import { getDeviceWidth, formatUnits, formatFiat } from 'utils/common';
import { defaultFiatCurrency, ETH } from 'constants/assetsConstants';
import { getRate } from 'utils/assets';
import { getThemeColors } from 'utils/themes';
import type { Theme } from 'models/Theme';
import type { RootReducerState } from 'reducers/rootReducer';

type Props = {
  onDragStart?: () => void,
  onDragEnd?: () => void,
  theme: Theme,
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
    tooltipFormat: 'D MMM',
    nextTimeRange: WEEK,
  },
  WEEK: {
    label: '7 days',
    xAxisFormat: 'ddd',
    tooltipFormat: 'D MMM',
    nextTimeRange: DAY,
  },
  DAY: {
    label: '1 day',
    xAxisFormat: 'HH:00',
    tooltipFormat: 'ddd hh:mm',
    nextTimeRange: ALL,
  },
  ALL: {
    label: 'all',
    xAxisFormat: 'MMM \'YY',
    tooltipFormat: 'MMM YYYY',
    nextTimeRange: MONTH,
  },
};

class BalanceGraph extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.now = new Date('2017-02-13T22:14:44.000Z');
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
        return dateDns.subDays(this.now, 30);
      case WEEK:
        return dateDns.subDays(this.now, 7);
      case DAY:
        return dateDns.subDays(this.now, 1);
      default:
        return dateDns.min(
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
      return timestamp && (dateDns.isEqual(date, rangeStart) || dateDns.isAfter(date, rangeStart));
    });

    const sortedHistory = filteredHistory
      .sort((a, b) => dateDns.compareAsc(new Date(a.timestamp), new Date(b.timestamp)));
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

    const rangeStartMs = dateDns.getTime(rangeStart);
    const rangeMs = dateDns.getTime(this.now) - rangeStartMs;

    return filteredHistory
      .map(entry => {
        return { x: (dateDns.getTime(new Date(entry.timestamp)) - rangeStartMs) / rangeMs, y: entry.total_balance };
      });
  })

  getFormattedData = () => {
    const filteredHistory = this.getFilteredHistory();
    return this._getFormattedData(filteredHistory);
  }

  getYAxisValue = (y: number) => {
    const { rates, baseFiatCurrency } = this.props;
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    return formatFiat(formatUnits(y, 18) * getRate(rates, ETH, fiatCurrency), fiatCurrency);
  }

  getXAxisValue = (x: number) => {
    const { timeRange } = this.state;

    const rangeStart = this.getStartRange();

    const date = new Date(dateDns.getTime(rangeStart) + ((dateDns.getTime(this.now) - dateDns.getTime(rangeStart)) * x));

    const dateFormat = RANGES[timeRange].xAxisFormat;
    return dateDns.format(date, dateFormat);
  }

  getTooltipContent = () => {
    const { timeRange, activeDataPoint } = this.state;
    const entry = this.getFilteredHistory()[activeDataPoint];
    const dateFormat = RANGES[timeRange].tooltipFormat;
    return `${dateDns.format(new Date(entry.timestamp), dateFormat)}\n${this.getYAxisValue(entry.total_balance)}`;
  }

  getTimeRangeSwitcherLabel = () => {
    return RANGES[this.state.timeRange].label;
  }

  switchTimeRange = () => {
    const newTimeRange = RANGES[this.state.timeRange].nextTimeRange;
    const { balancesHistory } = this.props;
    const filteredHistory = this._getFilteredHistory(balancesHistory, this._getStartRange(balancesHistory, newTimeRange));
    this.setState({ timeRange: newTimeRange, activeDataPoint: filteredHistory.length - 1 });
  }

  render() {
    const { onDragStart, onDragEnd, theme } = this.props;
    const { activeDataPoint } = this.state;
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
          getYAxisValue={this.getYAxisValue}
          activeDataPoint={Math.min(activeDataPoint, data.length - 1)}
          onActivePointChange={(point) => this.setState({ activeDataPoint: point })}
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
}: RootReducerState): $Shape<Props> => ({
  rates,
  baseFiatCurrency,
});


export default withTheme(connect(mapStateToProps)(BalanceGraph));
