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

import React, { useEffect } from 'react';
import styled, { withTheme } from 'styled-components/native';
import { connect } from 'react-redux';
import { CachedImage } from 'react-native-cached-image';
import { RefreshControl } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import t from 'translations/translate';

import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { BaseText } from 'components/Typography';
import { Spacing, ScrollWrapper } from 'components/Layout';
import CircleButton from 'components/CircleButton';
import BalanceView from 'components/PortfolioBalance/BalanceView';

import { getThemeColors, themedColors } from 'utils/themes';
import { formatFiat, formatAmount } from 'utils/common';
import { convertUSDToFiat } from 'utils/assets';

import { defaultFiatCurrency, RSPT } from 'constants/assetsConstants';
import { RARI_INFO } from 'constants/navigationConstants';

import { fetchRariUserDataAction, fetchRariAPYAction } from 'actions/rariActions';

import type { Theme } from 'models/Theme';
import type { RootReducerState, Dispatch } from 'reducers/rootReducer';
import type { Rates } from 'models/Asset';


type Props = {
  theme: Theme,
  baseFiatCurrency: ?string,
  navigation: NavigationScreenProp<*>,
  fetchRariUserData: () => void,
  fetchRariAPY: () => void,
  rariApy: number,
  userDepositInUSD: number,
  userDepositInRSPT: number,
  userInterests: number,
  userInterestsPercentage: number,
  isFetchingRariAPY: boolean,
  isFetchingRariUserData: boolean,
  rates: Rates,
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

const Row = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

const RariDepositScreen = ({
  baseFiatCurrency, theme, navigation, fetchRariUserData, fetchRariAPY,
  rariApy,
  userDepositInUSD,
  userDepositInRSPT,
  userInterests,
  userInterestsPercentage,
  isFetchingRariAPY,
  isFetchingRariUserData,
  rates,
}: Props) => {
  useEffect(() => {
    fetchRariUserData();
    fetchRariAPY();
  }, []);

  const colors = getThemeColors(theme);
  const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
  const interestsInUserCurrency = convertUSDToFiat(Math.abs(userInterests), rates, fiatCurrency);
  const formattedFiatValue = formatFiat(interestsInUserCurrency, fiatCurrency);
  const formattedInterestsPercentage = Math.abs(userInterestsPercentage).toFixed(2);

  let earnedFiatTranslation = formattedFiatValue;
  let earnedPercentTranslation = t('percentValue', { value: formattedInterestsPercentage });
  let earnedPercentColor = colors.text;

  if (userInterests > 0) {
    earnedFiatTranslation = t('positiveValue', { value: formattedFiatValue });
    earnedPercentTranslation = t('positivePercentValue', { value: formattedInterestsPercentage });
    earnedPercentColor = colors.positive;
  } else if (userInterests < 0) {
    earnedFiatTranslation = t('negativeValue', { value: formattedFiatValue });
    earnedPercentTranslation = t('negativePercentValue', { value: formattedInterestsPercentage });
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
      <ScrollWrapper
        refreshControl={
          <RefreshControl
            refreshing={isFetchingRariAPY || isFetchingRariUserData}
            onRefresh={() => {
              fetchRariUserData();
              fetchRariAPY();
            }}
          />
        }
      >
        <MainContainer>
          <Row>
            <BaseText secondary regular center style={{ alignItems: 'center' }}>
              {t('rariContent.label.currentAPY')}
            </BaseText>
            <Spacing w={4} />
            <BaseText regular>{t('percentValue', { value: rariApy.toFixed(2) })}</BaseText>
          </Row>
          <Spacing h={32} />
          <RariLogo source={rariLogo} />
          <Spacing h={32} />
          <BalanceView
            fiatCurrency={baseFiatCurrency || defaultFiatCurrency}
            balance={convertUSDToFiat(userDepositInUSD, rates, fiatCurrency)}
          />
          <BaseText small center>
            {t('tokenValue', { token: RSPT, value: formatAmount(userDepositInRSPT, 2) })}
          </BaseText>
          <Spacing h={50} />
          <EarnedCard>
            <BaseText secondary regular>{t('rariContent.label.earned')}</BaseText>
            <BaseText regular>{earnedFiatTranslation}</BaseText>
            <BaseText color={earnedPercentColor} regular>{earnedPercentTranslation}</BaseText>
          </EarnedCard>
          <Spacing h={60} />
          <ButtonsContainer>
            {userDepositInRSPT > 0 && (
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
            {userDepositInRSPT > 0 && (
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
      </ScrollWrapper>
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  appSettings: { data: { baseFiatCurrency } },
  rari: {
    rariApy,
    rariUserData: {
      userDepositInUSD,
      userDepositInRSPT,
      userInterests,
      userInterestsPercentage,
    },
    isFetchingRariAPY,
    isFetchingRariUserData,
  },
  rates: { data: rates },
}: RootReducerState): $Shape<Props> => ({
  baseFiatCurrency,
  rariApy,
  userDepositInUSD,
  userDepositInRSPT,
  userInterests,
  userInterestsPercentage,
  isFetchingRariAPY,
  isFetchingRariUserData,
  rates,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
  fetchRariUserData: () => dispatch(fetchRariUserDataAction()),
  fetchRariAPY: () => dispatch(fetchRariAPYAction()),
});

export default withTheme(connect(mapStateToProps, mapDispatchToProps)(RariDepositScreen));
