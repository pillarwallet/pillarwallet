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

import React, { FC, ReactElement } from 'react';
import { FlatList, StyleSheet, View, Dimensions, Platform } from 'react-native';
import t from 'translations/translate';

// Components
import Text from 'components/core/Text';
import { Spacing } from 'components/legacy/Layout';
import DropDown from 'components/Modals/ConnectedAppsModal/DropDown';
import HorizontalProgressBar from 'components/Progress/HorizontalProgressBar';
import IconButton from 'components/IconButton';

// Utils
import { useThemeColors } from 'utils/themes';
import { appFont, fontSizes } from 'utils/variables';
import { getPortfolioRiskList, getRiskType, getRiskColor } from 'utils/portfolioRiskiness';
import { hitSlop20 } from 'utils/common';

// Hooks
import { useNonStableAssets, useStableAssets } from 'hooks/assets';

// Type
import type { Chain } from 'models/Chain';

interface Props {
  visible: boolean;
  onHide: (val: boolean) => void;
  chain?: Chain;
}

const { width } = Dimensions.get('screen');
const isiOS = Platform.OS === 'ios' ? true : false;

const PortfolioRiskinessModal: FC<Props> = ({ visible, onHide, chain }) => {
  const colors = useThemeColors();
  const { percentage } = useNonStableAssets(chain);
  const { percentage: stablePercentage } = useStableAssets(chain);

  const stableRiskType = getRiskType(stablePercentage?.toString());
  const riskColor = getRiskColor(stablePercentage?.toString());
  const stableRiskList = getPortfolioRiskList();

  const renderItem = ({ item }): ReactElement<any, any> => (
    <View style={styles.itmContainer}>
      <View style={[styles.dot, { backgroundColor: item.color }]} />
      <Spacing w={10} />
      <Text variant="regular" color={colors.basic000}>
        {t('label.of_stable', { percentage: item.percentageLabel, type: item.name })}
      </Text>
    </View>
  );

  const NormalText = ({ title }) => (
    <Text variant="small" color={colors.basic010} style={{ maxWidth: '50%' }} numberOfLines={2}>
      {title}
    </Text>
  );

  return (
    <DropDown
      visible={visible}
      onHide={onHide}
      showOnlyBottomSide
      dropDownStyle={[styles.dropDown, { backgroundColor: colors.basic050 }]}
      modalContent={
        <View style={{ width: '100%', alignItems: 'center' }}>
          <View style={styles.row}>
            <Text />
            <Text variant="medium" color={colors.basic030} style={{ fontFamily: appFont.bold }}>
              {t('title.portfolio_riskiness')}
            </Text>
            <IconButton
              icon="close"
              color={colors.basic030}
              onPress={() => onHide(false)}
              fontSize={fontSizes.small}
              hitSlop={hitSlop20}
            />
          </View>

          <Spacing h={15} />

          <Text variant="regular" color={colors.basic000}>
            {t('paragraph.riskWithType', { type: stableRiskType })}
          </Text>

          <Spacing h={21} />

          <View style={styles.row}>
            <NormalText title={t('label.risk_assets', { percentage })} />
            <NormalText title={t('label.risk_stable', { percentage: stablePercentage })} />
          </View>
          <Spacing h={3} />
          <HorizontalProgressBar
            hidePercentage
            selectedName=""
            progress={percentage}
            forgroundColor={colors.primaryAccent250}
            backgroundColor={riskColor ?? colors.synthetic180}
          />

          <Spacing h={20} />

          <Text variant="regular" color={colors.basic000} style={{ textAlign: 'center' }}>
            {t('paragraph.portfolio_riskiness')}
          </Text>

          <Spacing h={20} />

          <FlatList
            style={{ width: '98%' }}
            bounces={false}
            data={stableRiskList}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
          />
        </View>
      }
    />
  );
};

export default PortfolioRiskinessModal;

const styles = StyleSheet.create({
  line: {
    width: '100%',
    height: 1,
  },
  row: {
    width: '97%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itmContainer: {
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropDown: {
    width: width - 40,
    padding: 16,
    marginTop: isiOS ? 14 : -10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
