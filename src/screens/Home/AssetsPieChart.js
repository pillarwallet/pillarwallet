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

// Constants
import { ASSET_CATEGORIES } from 'constants/assetsConstants';

// Utils
import { BigNumber } from 'utils/common';
import { formatPercentValue } from 'utils/format';
import { useThemeColors } from 'utils/themes';
import { fontSizes } from 'utils/variables';
import { useAssetCategoriesConfig } from 'utils/uiConfig';

// Local
import { useWalletInfo } from './utils';

type Props = {|
  includeSideChains: boolean;
|};

function AssetsPieChart({ includeSideChains }: Props) {
  const { data, colorScale } = useChartProps(includeSideChains);
  const colors = useThemeColors();

  const window = useWindowDimensions();

  // Display label only when there is roughly enough place for it not to colide with neighbouring labels
  // (0.075 value chosen experimentally).
  const getLabelTexts = ({ datum }: { datum: ChartDatum }) => {
    return datum.y >= 0.075
      ? [datum.title, formatPercentValue(BigNumber(datum.value), { stripTrailingZeros: true })]
      : null;
  };

  const lableSvgStyle = {
    fontSize: fontSizes.small,
    fill: colors.basic010,
  };

  return (
    <Container>
      <Svg width={window.width} height={320}>
        <Circle fill={colors.pieChartCenter} r={55} cx={window.width / 2} cy={160} />
        <VictoryPie
          standalone={false}
          data={data}
          colorScale={colorScale}
          animate
          width={window.width}
          height={320}
          radius={92}
          innerRadius={55}
          labelComponent={<VictoryLabel text={getLabelTexts} style={lableSvgStyle} lineHeight={1.5} />}
        />
      </Svg>
    </Container>
  );
}

export default AssetsPieChart;
type ChartDatum = {|
  y: number,
  title: string,
  value: number,
  hidden?: boolean,
|};

const useChartProps = (includeSideChains: boolean) => {
  const { total, ethereum } = useWalletInfo();
  const config = useAssetCategoriesConfig();
  const colors = useThemeColors();

  const balances = includeSideChains ? total : ethereum;
  const data: ChartDatum[] = [];
  const colorScale: string[] = [];

  if (balances.total.balanceInFiat.isZero()) {
    Object.keys(ASSET_CATEGORIES).map(key => ASSET_CATEGORIES[key]).forEach(category => {
      const { title } = config[category];
      if (category === 'collectibles') return;
      data.push({ y: 1 / 6, title, value: 0 });
      colorScale.push(colors.pieChartEmpty);
    });

    return { data, colorScale };
  }

  Object.keys(ASSET_CATEGORIES).map(key => ASSET_CATEGORIES[key]).forEach(category => {
    const { title, chartColor } = config[category];
    if (category === 'collectibles') return;

    const categoryBalance: ?BigNumber = balances[category]?.balanceInFiat;
    const totalBalance = balances.total.balanceInFiat;
    if (!categoryBalance || categoryBalance.isZero() || totalBalance.isZero()) return;

    const value = categoryBalance.dividedBy(totalBalance).toNumber();
    data.push({ y: value, title, value });
    colorScale.push(chartColor);
  });

  return { data, colorScale };
};

const Container = styled.View`
  align-items: center;
`;
