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
import { View } from 'react-native';
import styled, { withTheme } from 'styled-components/native';
import { subWeeks, subMonths, subYears, subDays, isBefore, format, getTime } from 'date-fns';
import t from 'translations/translate';
import { BaseText } from 'components/legacy/Typography';
import { Spacing } from 'components/legacy/Layout';
import {
  formatFiat,
  getDeviceWidth,
} from 'utils/common';
import { getThemeColors, getColorByThemeOutsideStyled, getThemeType } from 'utils/themes';
import type { Theme } from 'models/Theme';
import Graph from './Graph';


type DataPoint = {
  date: Date,
  value: number,
};

type DataPoints = DataPoint[];

type Props = {
  data: DataPoints,
  theme: Theme,
  fiatCurrency: string,
  onGestureStart: () => void,
  onGestureEnd: () => void,
  showXAxisValues?: boolean,
  showYAxisValues?: boolean,
};

const DateButton = styled.TouchableOpacity`
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
`;

const ButtonsContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
  padding: 0 20px;
`;

const screenWidth = getDeviceWidth();

const MONTH = 'MONTH';
const WEEK = 'WEEK';
const DAY = 'DAY';
const HALF_YEAR = 'HALF_YEAR';
const YEAR = 'YEAR';
const ALL = 'ALL';

const ValueOverTimeGraph = ({
  data,
  fiatCurrency,
  theme,
  onGestureStart,
  onGestureEnd,
  showXAxisValues = true,
  showYAxisValues = true,
}: Props) => {
  const [activeTimeRange, setActiveTimeRange] = useState(WEEK);

  const timeRangeEnd = data[data.length - 1].date;
  const colors = getThemeColors(theme);

  const timeRanges = {
    [DAY]: {
      label: t('graph.timeRangeButtons.day'),
      getTimeRangeStart: () => subDays(timeRangeEnd, 1),
      xAxisDateFormat: 'HH:mm',
      xAxisValuesCount: 6,
      tooltipDateFormat: 'EEE HH:mm',
    },
    [WEEK]: {
      label: t('graph.timeRangeButtons.week'),
      getTimeRangeStart: () => subWeeks(timeRangeEnd, 1),
      xAxisValuesCount: 8,
      xAxisDateFormat: 'EEE',
      tooltipDateFormat: 'd MMM',
    },
    [MONTH]: {
      label: t('graph.timeRangeButtons.month'),
      getTimeRangeStart: () => subDays(timeRangeEnd, 30),
      xAxisValuesCount: 6,
      xAxisDateFormat: 'd MMM',
      tooltipDateFormat: 'd MMM',
    },
    [HALF_YEAR]: {
      label: t('graph.timeRangeButtons.halfYear'),
      getTimeRangeStart: () => subMonths(timeRangeEnd, 6),
      xAxisValuesCount: 6,
      xAxisDateFormat: 'd MMM',
      tooltipDateFormat: 'd MMM',
    },
    [YEAR]: {
      label: t('graph.timeRangeButtons.year'),
      getTimeRangeStart: () => subYears(timeRangeEnd, 1),
      xAxisValuesCount: 6,
      xAxisDateFormat: 'd MMM',
      tooltipDateFormat: 'd MMM',
    },
    [ALL]: {
      label: t('graph.timeRangeButtons.all'),
      getTimeRangeStart: () => data[0].date,
      xAxisValuesCount: 6,
      xAxisDateFormat: 'MMM yyyy',
      tooltipDateFormat: 'MMM yyyy',
    },
  };

  const timeRangeStart = timeRanges[activeTimeRange].getTimeRangeStart();

  const filteredData = data
    .filter(({ date }) => !isBefore(date, timeRangeStart));

  const values = filteredData.map(p => p.value);
  let maxY = Math.max(...values);
  const minY = Math.min(...values);
  if (maxY === minY) maxY = minY + 1;
  const maxX = timeRangeEnd;
  const minX = timeRangeStart.getTime();

  const processedData = filteredData.map(
    ({ value, date }) => ({ x: (date.getTime() - minX) / (maxX - minX), y: (value - minY) / (maxY - minY) }),
  );

  const getTooltipContents = (activeDataPoint: number) => {
    const { date, value } = filteredData[activeDataPoint];
    // eslint-disable-next-line i18next/no-literal-string
    return `${format(date, timeRanges[activeTimeRange].tooltipDateFormat)}\n${formatFiat(value, fiatCurrency)}`;
  };

  const getYAxisValue = (y: number) => {
    if (!showYAxisValues) return undefined;

    const amountInFiat = ((maxY - minY) * y) + minY;
    return (+amountInFiat.toPrecision(2)).toFixed(2);
  };

  const getXAxisValue = (x: number) => {
    if (!showXAxisValues) return undefined;

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

  const themeType = getThemeType(theme);
  const inactiveTimeRangeColor = getColorByThemeOutsideStyled(themeType, { lightKey: 'basic030', darkKey: 'basic000' });

  return (
    <View>
      <Graph
        width={screenWidth}
        height={200}
        data={processedData}
        getTooltipContents={getTooltipContents}
        getYAxisValue={getYAxisValue}
        getXAxisValue={getXAxisValue}
        xAxisValuesCount={timeRanges[activeTimeRange].xAxisValuesCount}
        extra={activeTimeRange}
        onGestureStart={onGestureStart}
        onGestureEnd={onGestureEnd}
      />
      <Spacing h={24} />
      <ButtonsContainer>
        {Object.keys(timeRanges).map(range => (
          <DateButton onPress={() => setActiveTimeRange(range)} key={range}>
            <BaseText
              small
              color={range === activeTimeRange ? colors.graphPrimaryColor : inactiveTimeRangeColor}
            >
              {timeRanges[range].label}
            </BaseText>
          </DateButton>
        ))}
      </ButtonsContainer>
    </View>
  );
};

export default withTheme(ValueOverTimeGraph);
