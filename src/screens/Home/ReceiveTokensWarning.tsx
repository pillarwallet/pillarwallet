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
import Lottie from 'lottie-react-native';

// Constants
import { CHAIN } from 'constants/chainConstants';

// Types
import type { Theme } from 'models/Theme';
import type { Chain } from 'models/Chain';

// Utils
import { images } from 'utils/images';
import { fontSizes, spacing } from 'utils/variables';
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

// Hooks
import { useDeploymentStatus } from 'hooks/deploymentStatus';

const loader = require('assets/loaders/loader.json');

interface IReceiveTokensWarning {
  theme: Theme;
}

const ReceiveTokensWarning: FC<IReceiveTokensWarning> = ({ theme }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { t, tRoot } = useTranslationWithPrefix('home.receiveTokenWarning');
  const { pillarIcon } = images(theme);

  const orderedChains = [CHAIN.POLYGON, CHAIN.BINANCE, CHAIN.OPTIMISM, CHAIN.ARBITRUM, CHAIN.ETHEREUM];

  const onContinue: () => void = navigation.getParam('onContinue');

  const [viewed, setViewed] = useState(false);

  const chains = useSupportedChains();
  const chainsConfig = useChainsConfig();

  const fiatCurrency = useFiatCurrency();
  const chainRatesPerChain = useRatesPerChain();
  const gasInfoPerChain = useGasInfoPerChain();
  const { isDeployedOnChain } = useDeploymentStatus();

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
    [chainRatesPerChain, chainRatesPerChain, fiatCurrency, gasInfoPerChain],
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
            <EmojiWrapper>
              <EmojiText>🔥</EmojiText>
            </EmojiWrapper>
            <InfoText>{t('pillarDescription')}</InfoText>
          </InfoRow>

          <InfoRow>
            <EmojiWrapper>
              <EmojiText>⛽️</EmojiText>
            </EmojiWrapper>
            <InfoText>{t('stableCoinDetails')}</InfoText>
          </InfoRow>

          <InfoRow>
            <EmojiWrapper>
              <EmojiText>🔐</EmojiText>
            </EmojiWrapper>
            <InfoText>{t('pillarSecure')}</InfoText>
          </InfoRow>

          <InfoRow>
            <EmojiWrapper>
              <EmojiText>💰</EmojiText>
            </EmojiWrapper>
            <InfoText>{t('pillarBenefits')}</InfoText>
          </InfoRow>

          <InfoRow>
            <EmojiWrapper>
              <EmojiText>🤝</EmojiText>
            </EmojiWrapper>
            <InfoText>
              {/* @ts-ignore: Icon.name doesn't recognize joint strings */}
              {t('pillarDeployment1')} <Icon name={CHAIN.XDAI + '16'} /> {t('pillarDeployment2')}
            </InfoText>
          </InfoRow>

          <InfoRow>
            <EmojiWrapper>
              <EmojiText>⚠️</EmojiText>
            </EmojiWrapper>
            <InfoText>{t('checkAddress')}</InfoText>
          </InfoRow>
        </InfoWrapper>

        <DeployCostWrapper>
          {orderedChains.map((chain) => {
            const { titleShort } = chainsConfig[chain];

            return (
              <DeployRow key={titleShort}>
                <ChainIcon name={chain + '16'} style={{ marginRight: spacing.small }} />
                <DeployText>{titleShort}</DeployText>
                {!isDeployedOnChain?.[chain] && !deploymentFee(chain)?.fiatValue ? (
                  <LottieWrapper>
                    {/* @ts-ignore: Lottie not recognized as JSX element by typescript */}
                    <Lottie source={loader} autoPlay loop style={{ height: fontSizes.medium }} />
                  </LottieWrapper>
                ) : (
                  <DeployText right>
                    {isDeployedOnChain?.[chain] ? 'Deployed!' : deploymentFee(chain)?.fiatValue}
                  </DeployText>
                )}
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
  padding: 0px 20px 0px 0px;
`;

const InfoRow = styled.View<{ noMargin?: boolean }>`
  display: flex;
  flex-direction: row;
  ${({ noMargin }) => !noMargin && `margin-top: ${spacing.small}px;`}
`;

const EmojiWrapper = styled.View`
  display: flex;
  flex-direction: column;
`;

const EmojiText = styled(Text)`
  padding-right: ${spacing.small}px;
`;

const InfoText = styled(Text)`
  color: ${({ theme }) => theme.colors.basic000};
`;

const DeployCostWrapper = styled.View`
  margin: ${spacing.small}px ${spacing.largePlus}px 0;
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
  margin-top: ${spacing.extraLarge}px;
`;

const CopyButton = styled.View`
  width: 100%;
  justify-content: space-between;
  margin-top: ${spacing.largePlus}px;
  margin-bottom: ${spacing.small}px;
`;

const LottieWrapper = styled.View`
  width: 100%;
  height: 100%;
  flex: 1;
  flex-direction: row;
  display: flex;
  justify-content: flex-end;
  align-items: center;
`;
