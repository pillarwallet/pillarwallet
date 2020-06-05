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
import { connect } from 'react-redux';
import { subDays, isAfter, min, isEqual, getTime, compareAsc, getDate, format } from 'date-fns';
import { utils } from 'ethers';
import memoize from 'memoize-one';
import LinearGraph from 'components/LinearGraph';
import { getDeviceWidth, formatUnits, formatFiat } from 'utils/common';
import { defaultFiatCurrency, TOKENS, ETH, PLR } from 'constants/assetsConstants';
import { getRate } from 'utils/assets';

type Props = {
  onDragStart?: () => void,
  onDragEnd?: () => void,
}

const RANGES = {
  MONTH: 'MONTH',
  WEEK: 'WEEK',
  DAY: 'DAY',
  ALL: 'ALL',
};

class BalanceGraph extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      timeRange: RANGES.MONTH,
    };
    this.now = new Date('2017-02-13T22:14:44.000Z');
  }

  _getStartRange = memoize((balancesHistory, timeRange) => {
    switch (timeRange) {
      case RANGES.MONTH:
        return subDays(this.now, 30);
      case RANGES.WEEK:
        return subDays(this.now, 7);
      case RANGES.DAY:
        return subDays(this.now, 1);
      default:
        return min(...balancesHistory.map(({ timestamp }) => new Date(timestamp)));
    }
  })

  getStartRange = () => {
    const { balancesHistory } = this.props;
    const { timeRange } = this.state;
    return this._getStartRange(balancesHistory, timeRange);
  }

  _getFilteredHistory = memoize((balancesHistory) => {
    const rangeStart = this.getStartRange();

    const filteredHistory = balancesHistory.filter(({ timestamp }) => {
      const date = new Date(timestamp);
      return timestamp && (isEqual(date, rangeStart) || isAfter(date, rangeStart));
    });

    return filteredHistory
      .sort((a, b) => compareAsc(new Date(a.timestamp), new Date(b.timestamp)));
  })

  getFilteredHistory = () => {
    return this._getFilteredHistory(this.props.balancesHistory);
  }

  _getFormattedData = memoize((filteredHistory) => {
    const rangeStart = this.getStartRange();

    const rangeStartMs = getTime(rangeStart);
    const rangeMs = getTime(this.now) - rangeStartMs;

    return filteredHistory
      .map(entry => {
        return { x: (getTime(new Date(entry.timestamp)) - rangeStartMs) / rangeMs, y: entry.total_balance };
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

    switch (timeRange) {
      case RANGES.MONTH:
        const rangeStart = subDays(this.now, 30);
        return getDate(new Date(getTime(rangeStart) + ((getTime(this.now) - getTime(rangeStart)) * x)));
      default:
        return x;
    }
  }

  getTooltipContent = (index: number) => {
    const { timeRange } = this.state;
    const entry = this.getFilteredHistory()[index];
    let dateFormat;
    switch (timeRange) {
      case RANGES.MONTH:
      case RANGES.WEEK:
        dateFormat = 'D MMM';
        break;
      case RANGES.DAY:
        dateFormat = 'ddd hh:mm';
        break;
      default:
        dateFormat = 'MMM YYYY';
    }
    return `${format(entry.timestamp, dateFormat)}\n${this.getYAxisValue(entry.total_balance)}`;
  }

  render() {
    const { onDragStart, onDragEnd } = this.props;
    const data = this.getFormattedData();

    if (data.length < 2) return null;

    return (
      <LinearGraph
        data={data}
        width={getDeviceWidth()}
        height={140}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        getTooltipContent={this.getTooltipContent}
        getXAxisValue={this.getXAxisValue}
        getYAxisValue={this.getYAxisValue}
      />
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


export default connect(mapStateToProps)(BalanceGraph);
