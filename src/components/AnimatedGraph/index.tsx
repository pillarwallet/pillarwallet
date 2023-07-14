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
import React, { useMemo } from 'react';
import { Dimensions, View, StyleSheet, Animated, Easing } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import moment from 'moment';
import { isEmpty } from 'lodash';
import styled from 'styled-components/native';
import LinearGradient from 'react-native-linear-gradient';

// Utils
import { useThemeColors } from 'utils/themes';
import { getPriceChangePercentage } from 'utils/assets';
import { wrapBigNumberOrNil } from 'utils/bigNumber';

// Constants
import { ONE_DAY } from 'constants/assetsConstants';

// Components
import Icon from 'components/core/Icon';

// Types
import type { HistoricalTokenPrices, MarketDetails, TokenDetails } from 'models/Asset';
import PointerLevel from './PointerLevel';

export const { width: SIZE } = Dimensions.get('window');

interface Props {
  period: string;
  marketData: MarketDetails;
  historicData: HistoricProps;
  tokenDetailsData: TokenDetails;
  onChangePointer: (items: any, isActive: boolean) => void;
}

interface HistoricProps {
  data: HistoricalTokenPrices;
  status: string;
  isLoading: boolean;
}

const AnimatedGraph = ({ period, marketData, historicData, onChangePointer, tokenDetailsData }: Props) => {
  const colors = useThemeColors();

  const { data, status, isLoading } = historicData;

  const filterList = useMemo(() => {
    const list = [];
    data?.items?.forEach((perticularItem) => {
      if (perticularItem.timestamp && perticularItem.usdPrice) {
        list.push({
          value: perticularItem.usdPrice,
          date: moment(perticularItem.timestamp * 1000).format(period === ONE_DAY ? 'MMM DD hh:mm' : 'MMM DD'),
        });
      }
    });
    return list;
  }, [data, isLoading, status]);

  const currentPricePercentage = useMemo(() => {
    if (isEmpty(marketData)) return 0;
    const pricePercentage = getPriceChangePercentage(period, marketData, tokenDetailsData);
    return pricePercentage;
  }, [marketData, period]);

  const isPositive = currentPricePercentage === 0 || wrapBigNumberOrNil(currentPricePercentage).gt(0);

  const GRADIENT_COLORS = [colors.metallicViolet, colors.metallicVioletLight];

  if (isLoading || isEmpty(data?.items)) {
    const spinValue = new Animated.Value(0);

    Animated.timing(spinValue, {
      toValue: 3 * 60,
      duration: 3000 * 60,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();

    const spin = spinValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <View style={styles.loaderContent}>
        <Animated.View
          style={[
            styles.animatedView,
            {
              transform: [{ rotate: spin }],
            },
          ]}
        >
          <BackgroundGradient colors={GRADIENT_COLORS} useAngle></BackgroundGradient>
        </Animated.View>
        <IconContainer>
          <Icon name="plr-transparent" />
        </IconContainer>
      </View>
    );
  }

  const maxValue = filterList?.reduce((a, b) => Math.max(a, b.value), 0) || null;

  return (
    <View style={{ width: '100%' }}>
      <LineChart
        areaChart
        isAnimated
        curved
        hideAxesAndRules
        hideDataPoints
        yAxisSide={'right'}
        animationDuration={1500}
        data={filterList}
        width={SIZE}
        spacing={SIZE / filterList?.length}
        color={isPositive ? colors.positive : colors.negative}
        thickness={2.1}
        startFillColor={isPositive ? colors.positive : colors.negative}
        endFillColor={isPositive ? colors.positive : colors.negative}
        startOpacity={0.3}
        endOpacity={0.01}
        stepHeight={0}
        disableScroll
        height={155}
        maxValue={maxValue * 1.1}
        initialSpacing={0}
        pointerConfig={{
          pointerStripHeight: 150,
          pointerStripColor: colors.secondaryText,
          pointerStripWidth: 1,
          pointerColor: isPositive ? colors.positive : colors.negative,
          radius: 6,
          pointerLabelHeight: 50,
          pointerLabelWidth: 100,
          strokeDashArray: [5, 5],
          stripOverPointer: true,
          shiftPointerLabelX: -15,
          pointerVanishDelay: 0,
          activatePointersDelay: 0,
          autoAdjustPointerLabelPosition: false,
          pointerLabelComponent: (items, isActive) => (
            <PointerLevel items={items} isActive={isActive} onChangePointer={onChangePointer} />
          ),
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  loaderContent: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textStyle: {
    position: 'absolute',
    top: 190,
  },
  animatedView: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
});

const IconContainer = styled.View`
  background-color: ${({ theme }) => theme.colors.basic070};
  border-radius: 24px;
  shadow-color: ${({ theme }) => theme.colors.metallicViolet};
  shadow-opacity: 0.58;
  shadow-radius: 24;
  elevation: 56;
  width: 48px;
  height: 48px;
`;

const BackgroundGradient = styled(LinearGradient)`
  border-radius: 26px;
  height: 52px;
  width: 52px;
`;

export default AnimatedGraph;
