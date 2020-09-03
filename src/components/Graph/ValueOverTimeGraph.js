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
import React, { useState } from 'react';
import { connect } from 'react-redux';
import { View } from 'react-native';
import styled, { withTheme } from 'styled-components/native';
import { subWeeks, subMonths, subYears, subDays, isBefore, format, getTime } from 'date-fns';
import t from 'translations/translate';
import { BaseText } from 'components/Typography';
import { Spacing } from 'components/Layout';
import { defaultFiatCurrency } from 'constants/assetsConstants';
import {
  formatFiat,
} from 'utils/common';
import { getThemeColors } from 'utils/themes';
import type { RootReducerState } from 'reducers/rootReducer';
import type { Theme } from 'models/Theme';
import Graph from './Graph';


type DataPoint = {
  date: Date,
  value: number,
};

type DataPoints = DataPoint[];

type Props = {
  data: DataPoints,
  baseFiatCurrency: ?string,
  theme: Theme,
};

const DateButton = styled.TouchableOpacity`
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background-color: ${({ active, theme: { colors } }) => active ? colors.graphPrimaryColor : colors.inactiveTabBarIcon};
`;

const ButtonsContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
  padding: 0 20px;
`;


const MONTH = 'MONTH';
const WEEK = 'WEEK';
const DAY = 'DAY';
const HALF_YEAR = 'HALF_YEAR';
const YEAR = 'YEAR';
const ALL = 'ALL';

const ValueOverTimeGraph = ({ data, baseFiatCurrency, theme }: Props) => {
  const [activeTimeRange, setActiveTimeRange] = useState(WEEK);

  const timeRangeEnd = new Date();

  const colors = getThemeColors(theme);

  const timeRanges = {
    [DAY]: {
      label: t('graph.timeRangeButtons.day'),
      getTimeRangeStart: () => subDays(timeRangeEnd, 1),
      xAxisDateFormat: 'HH:mm',
      xAxisValuesCount: 6,
      tooltipDateFormat: 'ddd HH:mm',
    },
    [WEEK]: {
      label: t('graph.timeRangeButtons.week'),
      getTimeRangeStart: () => subWeeks(timeRangeEnd, 1),
      xAxisValuesCount: 7,
      xAxisDateFormat: 'ddd',
      tooltipDateFormat: 'D MMM',
    },
    [MONTH]: {
      label: t('graph.timeRangeButtons.month'),
      getTimeRangeStart: () => subDays(timeRangeEnd, 30),
      xAxisValuesCount: 6,
      xAxisDateFormat: 'D MMM',
      tooltipDateFormat: 'D MMM',
    },
    [HALF_YEAR]: {
      label: t('graph.timeRangeButtons.halfYear'),
      getTimeRangeStart: () => subMonths(timeRangeEnd, 6),
      xAxisValuesCount: 6,
      xAxisDateFormat: 'D MMM',
      tooltipDateFormat: 'D MMM',
    },
    [YEAR]: {
      label: t('graph.timeRangeButtons.year'),
      getTimeRangeStart: () => subYears(timeRangeEnd, 1),
      xAxisValuesCount: 6,
      xAxisDateFormat: 'D MMM',
      tooltipDateFormat: 'D MMM',
    },
    [ALL]: {
      label: t('graph.timeRangeButtons.all'),
      getTimeRangeStart: () => data[0].date,
      xAxisValuesCount: 6,
      xAxisDateFormat: 'MMM YYYY',
      tooltipDateFormat: 'MMM YYYY',
    },
  };

  const timeRangeStart = timeRanges[activeTimeRange].getTimeRangeStart();

  const filteredData = data
    .filter(({ date }) => !isBefore(date, timeRangeStart));

  const maxY = Math.max(...filteredData.map(p => p.value));
  const maxX = Date.now();
  const minX = timeRangeStart.getTime();

  const processedData =
    filteredData.map(({ value, date }) => ({ x: (date.getTime() - minX) / (maxX - minX), y: value / maxY }));

  const getTooltipContents = (activeDataPoint: number) => {
    const { date, value } = filteredData[activeDataPoint];
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    return `${format(date, timeRanges[activeTimeRange].tooltipDateFormat)}\n${formatFiat(value, fiatCurrency)}`;
  };

  const getYAxisValue = (y: number) => {
    const amountInFiat = maxY * y;
    return (+amountInFiat.toPrecision(2)).toFixed(2);
  };

  const getXAxisValue = (x: number) => {
    const rangeStartMs = getTime(timeRangeStart);
    const nowMs = getTime(timeRangeEnd);
    let date = new Date(rangeStartMs + ((nowMs - rangeStartMs) * x));
    if (activeTimeRange === DAY) {
      const msInHour = 60 * 60 * 1000;
      date = new Date(Math.round(getTime(date) / msInHour) * msInHour);
    }
    const dateFormat = timeRanges[activeTimeRange].xAxisDateFormat;
    return format(date, dateFormat);
  };

  return (
    <View>
      <Graph
        width={400}
        height={200}
        data={processedData}
        getTooltipContents={getTooltipContents}
        getYAxisValue={getYAxisValue}
        getXAxisValue={getXAxisValue}
        xAxisValuesCount={timeRanges[activeTimeRange].xAxisValuesCount}
        extra={activeTimeRange}
      />
      <Spacing h={24} />
      <ButtonsContainer>
        {Object.keys(timeRanges).map(range => (
          <DateButton active={range === activeTimeRange} onPress={() => setActiveTimeRange(range)} key={range}>
            <BaseText small color={colors.card}>{timeRanges[range].label}</BaseText>
          </DateButton>
        ))}
      </ButtonsContainer>
    </View>
  );
};

const mapStateToProps = ({
  appSettings: { data: { baseFiatCurrency } },
}: RootReducerState): $Shape<Props> => ({
  baseFiatCurrency,
});

export default withTheme(connect(mapStateToProps)(ValueOverTimeGraph));
