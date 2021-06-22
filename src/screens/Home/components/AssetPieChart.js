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
import { useWindowDimensions } from 'react-native';
import styled from 'styled-components/native';
import Svg, { Circle } from 'react-native-svg';
import { VictoryPie, VictoryLabel } from 'victory-native';
import { BigNumber } from 'bignumber.js';

// Utils
import { formatPercentValue } from 'utils/format';
import { useThemeColors } from 'utils/themes';
import { fontSizes } from 'utils/variables';
import { useAssetCategoriesConfig } from 'utils/uiConfig';
import { sumRecord } from 'utils/bigNumber';

// Types
import type { AssetCategoryRecord } from 'models/AssetCategory';

type Props = {|
  balancePerCategory: AssetCategoryRecord<BigNumber>,
|};

function AssetPieChart({ balancePerCategory }: Props) {
  const { data, colorScale } = useChartProps(balancePerCategory);
  const colors = useThemeColors();

  const window = useWindowDimensions();

  // Display label only when there is roughly enough place for it not to colide with neighbouring labels
  // (0.075 value chosen experimentally).
  const getLabelTexts = ({ datum }: { datum: ChartDatum }) => {
    return datum.y >= 0.075
      ? [datum.title, formatPercentValue(BigNumber(datum.value), { stripTrailingZeros: true })]
      : null;
  };

  const titleSvgStyle = {
    fontSize: fontSizes.small,
    fill: colors.text,
  };

  const valueSvgStyle = {
    fontSize: fontSizes.small,
    fill: colors.secondaryText,
  };

  return (
    <Container>
      <Svg width={window.width} height={300}>
        <Circle fill={colors.pieChartCenter} r={55} cx={window.width / 2} cy={150} />
        <VictoryPie
          standalone={false}
          data={data}
          colorScale={colorScale}
          animate
          width={window.width}
          height={300}
          radius={92}
          innerRadius={55}
          labelComponent={<VictoryLabel text={getLabelTexts} style={[titleSvgStyle, valueSvgStyle]} lineHeight={1.5} />}
        />
      </Svg>
    </Container>
  );
}

export default AssetPieChart;

type ChartDatum = {|
  y: number,
  title: string,
  value: number,
|};

const useChartProps = (balances: AssetCategoryRecord<BigNumber>) => {
  const config = useAssetCategoriesConfig();
  const colors = useThemeColors();

  const data: ChartDatum[] = [];
  const colorScale: string[] = [];

  const total = sumRecord(balances);

  // Zero balance case
  if (total.isZero()) {
    Object.keys(balances).forEach((category, index, array) => {
      const { titleShort } = config[category];
      data.push({ y: 1 / array.length, title: titleShort, value: 0 });
      colorScale.push(colors.pieChartEmpty);
    });

    return { data, colorScale };
  }

  Object.keys(balances).forEach((category) => {
    const categoryBalance = balances[category];
    const totalBalance = total;
    if (!categoryBalance || categoryBalance.isZero() || totalBalance.isZero()) return;

    const value = categoryBalance.dividedBy(totalBalance).toNumber();
    const { titleShort, chartColor } = config[category];
    data.push({ y: value, title: titleShort, value });
    colorScale.push(chartColor);
  });

  return { data, colorScale };
};

const Container = styled.View`
  align-items: center;
`;
