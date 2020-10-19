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

import React from 'react';
import styled, { withTheme } from 'styled-components/native';
import { connect } from 'react-redux';
import { CachedImage } from 'react-native-cached-image';
import type { NavigationScreenProp } from 'react-navigation';
import t from 'translations/translate';

import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { BaseText } from 'components/Typography';
import { Spacing } from 'components/Layout';
import CircleButton from 'components/CircleButton';
import BalanceView from 'components/PortfolioBalance/BalanceView';

import { getThemeColors, themedColors } from 'utils/themes';
import { formatFiat } from 'utils/common';
import { defaultFiatCurrency, RSPT } from 'constants/assetsConstants';
import { RARI_INFO } from 'constants/navigationConstants';

import type { Theme } from 'models/Theme';
import type { RootReducerState } from 'reducers/rootReducer';

type Props = {
  theme: Theme,
  baseFiatCurrency: ?string,
  navigation: NavigationScreenProp<*>,
};

const rariLogo = require('assets/images/rari_logo.png');

const MainContainer = styled.View`
  padding: 16px 20px;
`;

const EarnedCard = styled.View`
  background-color: ${themedColors.card};
  padding: 20px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  border-radius: 4px;
`;

const ButtonsContainer = styled.View`
  flex-direction: row;
  justify-content: center;
  width: 100%;
`;

const RariLogo = styled(CachedImage)`
  width: 64px;
  height: 64px;
  align-self: center;
`;

const Spacer = styled.View`
  flex: 1;
`;

const RariDepositScreen = ({ baseFiatCurrency, theme, navigation }: Props) => {
  const colors = getThemeColors(theme);

  const rsptBalance = 1;
  const earnedFiat = 25.6;
  const formattedFiatValue = formatFiat(earnedFiat, baseFiatCurrency || defaultFiatCurrency);
  const earnedPercent = 3.45;

  let earnedFiatTranslation = formattedFiatValue;
  let earnedPercentTranslation = t('percentValue', { value: earnedPercent });
  let earnedPercentColor = colors.text;

  if (earnedPercent > 0) {
    earnedFiatTranslation = t('positiveValue', { value: formattedFiatValue });
    earnedPercentTranslation = t('positivePercentValue', { value: earnedPercent });
    earnedPercentColor = colors.positive;
  } else if (earnedPercent < 0) {
    earnedFiatTranslation = t('negativeValue', { value: formattedFiatValue });
    earnedPercentTranslation = t('negativePercentValue', { value: earnedPercent });
    earnedPercentColor = colors.negative;
  }

  return (
    <ContainerWithHeader
      inset={{ bottom: 'never' }}
      headerProps={{
        centerItems: [{ title: t('rariContent.title.depositScreen') }],
        rightItems: [
          {
            icon: 'info-circle-inverse',
            color: colors.labelTertiary,
            onPress: () => navigation.navigate(RARI_INFO),
          },
        ],
      }}
    >
      <MainContainer>
        <BaseText secondary regular center>{t('rariContent.label.currentAPY')}{' '}
          <BaseText regular>{t('percentValue', { value: 12.76 })}</BaseText>
        </BaseText>
        <Spacing h={32} />
        <RariLogo source={rariLogo} />
        <Spacing h={32} />
        <BalanceView
          fiatCurrency={baseFiatCurrency || defaultFiatCurrency}
          balance={12.50}
        />
        <BaseText small center>{t('tokenValue', { token: RSPT, value: rsptBalance })}</BaseText>
        <Spacing h={50} />
        <EarnedCard>
          <BaseText secondary regular>{t('rariContent.label.earned')}</BaseText>
          <BaseText regular>{earnedFiatTranslation}</BaseText>
          <BaseText color={earnedPercentColor} regular>{earnedPercentTranslation}</BaseText>
        </EarnedCard>
        <Spacing h={60} />
        <ButtonsContainer>
          {rsptBalance > 0 && (
            <>
              <CircleButton
                label={t('rariContent.button.withdraw')}
                fontIcon="back"
                fontIconStyle={{ transform: [{ rotate: '90deg' }] }}
                onPress={() => {}}
              />
              <Spacer />
            </>
          )}
          <CircleButton
            label={t('rariContent.button.deposit')}
            fontIcon="plus"
            onPress={() => {}}
          />
          {rsptBalance > 0 && (
            <>
              <Spacer />
              <CircleButton
                label={t('rariContent.button.transfer')}
                fontIcon="back"
                fontIconStyle={{ transform: [{ rotate: '180deg' }] }}
                onPress={() => {}}
              />
            </>
          )}
        </ButtonsContainer>
      </MainContainer>
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  appSettings: { data: { baseFiatCurrency } },
}: RootReducerState): $Shape<Props> => ({
  baseFiatCurrency,
});

export default withTheme(connect(mapStateToProps)(RariDepositScreen));
