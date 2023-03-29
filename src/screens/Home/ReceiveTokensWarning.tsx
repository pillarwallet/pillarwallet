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

import React, { FC, useEffect, useState, useCallback } from 'react';
import { View } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import styled from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';
import { useDispatch } from 'react-redux';

// Constants
import { CHAIN } from 'constants/chainConstants';

// Types
import type { Theme } from 'models/Theme';
import type { Chain } from 'models/Chain';

// Utils
import { images } from 'utils/images';
import { spacing } from 'utils/variables';
import { calculateDeploymentFee } from 'utils/deploymentCost';
import { useChainsConfig } from 'utils/uiConfig';

// Actions
import { fetchGasInfoAction } from 'actions/historyActions';
import { setViewedReceiveTokensWarning } from 'actions/onboardingActions';

// Selectors
import { useFiatCurrency, useRatesPerChain, useGasInfoPerChain } from 'selectors';
import { useSupportedChains } from 'selectors/chains';

// Components
import { Container, Content } from 'components/layout/Layout';
import Button from 'components/core/Button';
import Text from 'components/core/Text';
import Image from 'components/Image';
import Icon from 'components/core/Icon';
import CheckBoxWithText from 'components/core/CheckBoxWithText';

interface IReceiveTokensWarning {
  theme: Theme;
}

const ReceiveTokensWarning: FC<IReceiveTokensWarning> = ({ theme }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { t, tRoot } = useTranslationWithPrefix('home.receiveTokenWarning');
  const { pillarIcon } = images(theme);

  const onContinue: () => void = navigation.getParam('onContinue');

  const [viewed, setViewed] = useState(false);

  const chains = useSupportedChains();
  const chainsConfig = useChainsConfig();

  const fiatCurrency = useFiatCurrency();
  const chainRatesPerChain = useRatesPerChain();
  const gasInfoPerChain = useGasInfoPerChain();

  useEffect(() => {
    if (!chains?.length) return;

    chains.map((chain) => {
      dispatch(fetchGasInfoAction(chain));
    });
  }, [dispatch, chains]);

  const deploymentFee = useCallback(
    (chain: Chain) => {
      const chainRates = chainRatesPerChain[chain];
      const gasInfo = gasInfoPerChain[chain];
      if (!chainRates || !gasInfo?.gasPrice?.fast) return null;
      return calculateDeploymentFee(chain, chainRates, fiatCurrency, gasInfo);
    },
    [chainRatesPerChain, chainRatesPerChain, fiatCurrency],
  );

  const onSubmit = () => {
    dispatch(setViewedReceiveTokensWarning(viewed));
    navigation?.goBack(null);
    onContinue?.();
  };

  return (
    <Container>
      <Content showsVerticalScrollIndicator={false}>
        <PillarIconWrapper>
          <PillarIcon source={pillarIcon} />
        </PillarIconWrapper>

        <InfoWrapper>
          <InfoRow noMargin>
            <EmojiText>🔥</EmojiText>
            <InfoText>{t('pillarDescription')}</InfoText>
          </InfoRow>

          <InfoRow>
            <EmojiText>⛽️</EmojiText>
            <InfoText>{t('stableCoinDetails')}</InfoText>
          </InfoRow>

          <InfoRow>
            <EmojiText>🔐</EmojiText>
            <InfoText>{t('pillarSecure')}</InfoText>
          </InfoRow>

          <InfoRow>
            <EmojiText>💰</EmojiText>
            <InfoText>{t('pillarBenefits')}</InfoText>
          </InfoRow>

          <InfoRow>
            <EmojiText>🤝</EmojiText>
            <InfoText>
              {/* @ts-ignore: Icon.name doesn't recognize joint strings */}
              {t('pillarDeployment1')} <Icon name={CHAIN.XDAI + '16'} /> {t('pillarDeployment2')}
            </InfoText>
          </InfoRow>

          <InfoRow>
            <EmojiText>⚠️</EmojiText>
            <InfoText>{t('checkAddress')}</InfoText>
          </InfoRow>
        </InfoWrapper>

        <DeployCostWrapper>
          {chains.map((chain) => {
            if (!chain || chain === CHAIN.XDAI) return null;

            const { titleShort } = chainsConfig[chain];

            return (
              <DeployRow>
                <ChainIcon name={chain + '16'} style={{ marginRight: spacing.small }} />
                <DeployText>{titleShort}</DeployText>
                <DeployText right>{deploymentFee(chain)?.fiatValue}</DeployText>
              </DeployRow>
            );
          })}
        </DeployCostWrapper>

        <CheckBoxWrapper>
          <CheckBoxWithText onValueChange={setViewed} value={viewed} text={t('understood')} />
        </CheckBoxWrapper>

        <CopyButton>
          <Button disabled={!viewed} title={tRoot('button.continue')} onPress={onSubmit} size="large" />
        </CopyButton>
      </Content>
    </Container>
  );
};

export default ReceiveTokensWarning;

const PillarIconWrapper = styled(View)`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: ${spacing.extraLarge}px;
`;

const PillarIcon = styled(Image)`
  height: 160px;
  width: 160px;
`;

const InfoWrapper = styled.View`
  padding: 0 20px;
`;

const InfoRow = styled.View<{ noMargin?: boolean }>`
  display: flex;
  flex-direction: row;
  ${({ noMargin }) => !noMargin && `margin-top: ${spacing.small}px;`}
`;

const EmojiText = styled(Text)`
  padding-right: ${spacing.small}px;
`;

const InfoText = styled(Text)`
  color: ${({ theme }) => theme.colors.basic000};
`;

const DeployCostWrapper = styled.View`
  margin: ${spacing.small}px ${spacing.largePlus * 2}px 0;
`;

const DeployRow = styled.View`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const DeployText = styled(Text)<{ right?: boolean }>`
  flex: 1;
  color: ${({ theme }) => theme.colors.basic000};
  ${({ right }) => right && `text-align: right;`}
`;

const ChainIcon = styled(Icon)`
  margin-right: ${spacing.small}px;
`;

const CheckBoxWrapper = styled.View`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: ${spacing.extraLarge}px;
`;

const CopyButton = styled.View`
  width: 100%;
  justify-content: space-between;
  margin-top: ${spacing.largePlus}px;
  margin-bottom: ${spacing.small}px;
`;
