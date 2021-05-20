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
import { useNavigation } from 'react-navigation-hooks';
import styled from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import { Container } from 'components/modern/Layout';
import Button from 'components/modern/Button';
import HeaderBlock from 'components/HeaderBlock';
import Text from 'components/modern/Text';

// Constants
import { SERVICES } from 'constants/navigationConstants';

// Utils
import { useChainsConfig } from 'utils/uiConfig';
import { spacing } from 'utils/variables';

// Types
import { type Chain, CHAIN } from 'models/Chain';

/**
 * Interjection screen used when Etherspot smart wallet is not yet deployed on given chain.
 */
function EtherspotDeploymentInterjection() {
  const { t } = useTranslationWithPrefix('etherspot.deploymentInterjection');
  const navigation = useNavigation();

  const chain: Chain = navigation.getParam('chain') ?? CHAIN.ETHEREUM;

  const chainConfig = useChainsConfig()[chain];

  const navigateToBuy = () => {
    // TODO: implement proper navigation when available
    navigation.navigate(SERVICES);
  };

  return (
    <Container>
      <HeaderBlock centerItems={[{ title: t('title') }]} navigation={navigation} noPaddingTop />

      <BodyTop variant="big">{t('bodyTopFormat', { chain: chainConfig.title })}</BodyTop>

      <BodyBottom variant="medium">{t('bodyBottomFormat1', { chain: chainConfig.titleShort })}</BodyBottom>
      <BodyBottom variant="medium">{t('bodyBottomFormat2', { symbol: chainConfig.gasSymbol })}</BodyBottom>

      <ButtonContainer>
        <Button
          title={t('buyFormat', { chain: chainConfig.titleShort, symbol: chainConfig.gasSymbol })}
          onPress={navigateToBuy}
        />
      </ButtonContainer>
    </Container>
  );
}

export default EtherspotDeploymentInterjection;

const BodyTop = styled(Text)`
  margin: ${spacing.large}px 30px;
  text-align: center;
`;

const BodyBottom = styled(Text)`
  margin: ${spacing.medium}px ${spacing.large}px;
  text-align: center;
  color: ${({ theme }) => theme.colors.secondaryText};
`;

const ButtonContainer = styled.View`
  margin: ${spacing.large}px ${spacing.large}px;
`;
