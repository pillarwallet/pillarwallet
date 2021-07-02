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
import { Container, Content } from 'components/modern/Layout';
import Button from 'components/modern/Button';
import HeaderBlock from 'components/HeaderBlock';
import Modal from 'components/Modal';
import ReceiveModal from 'screens/Asset/ReceiveModal';
import Text from 'components/modern/Text';
import Spinner from 'components/Spinner';

// Constants
import { CHAIN } from 'constants/chainConstants';
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';

// Selectors
import { useRootSelector, activeAccountAddressSelector } from 'selectors';

// Utils
import { useChainConfig } from 'utils/uiConfig';
import { spacing, fontSizes } from 'utils/variables';
import { mapFromDocumentDataToString } from 'utils/prismic';
import { reportErrorLog } from 'utils/common';

// Types
import type { Chain } from 'models/Chain';

// Services
import * as Prismic from 'services/prismic';
import { firebaseRemoteConfig } from 'services/firebase';

/**
 * Interjection screen used when Etherspot smart wallet is not yet deployed on given chain.
 */
function EtherspotDeploymentInterjection() {
  const { t } = useTranslationWithPrefix('etherspot.deploymentInterjection');
  const navigation = useNavigation();
  const [interjectionPrismicContent, setInterjectionPrismicContent] = React.useState({});
  const [introductionText, setIntroductionText] = React.useState('');
  const [isPrismicContentFetched, setIsPrismicContentFetched] = React.useState(false);

  const chain: Chain = navigation.getParam('chain') ?? CHAIN.ETHEREUM;
  const prismicInterjectionDocumentId = firebaseRemoteConfig.getString(REMOTE_CONFIG.PRISMIC_INTERJECTION_DOCUMENT_ID);

  const address = useRootSelector(activeAccountAddressSelector);
  const { title: chainTitle, color: chainColor, gasSymbol: chainGasSymbol } = useChainConfig(chain);

  React.useEffect(() => {
    async function fetchPrismicData() {
      try {
        const interjectionDocument = await Prismic.queryDocumentsByID(prismicInterjectionDocumentId);
        const introductionContent = interjectionDocument?.introduction?.map(
          (introduction: Prismic.DocumentData) => {
            if (!introduction) return null;
            return introduction.text.replace('{{network}}', chainTitle);
          },
        );
        setIntroductionText(introductionContent);
        const prismicContent = [];
        /* eslint-disable camelcase */
        mapFromDocumentDataToString(interjectionDocument?.point_1, prismicContent);
        mapFromDocumentDataToString(interjectionDocument?.point_2, prismicContent);
        mapFromDocumentDataToString(interjectionDocument?.point_3, prismicContent);
        setInterjectionPrismicContent(prismicContent);
        setIsPrismicContentFetched(true);
      } catch (error) {
        reportErrorLog('Prismic content fetch failed', { error, prismicInterjectionDocumentId });
      }
    }
    fetchPrismicData();
  }, [prismicInterjectionDocumentId, chainTitle]);


  const showReceiveModal = () => {
    Modal.open(() => <ReceiveModal address={address} />);
  };

  return (
    <Container>
      <HeaderBlock centerItems={[{ title: t('title') }]} navigation={navigation} noPaddingTop />
      {!isPrismicContentFetched && (
        <ActivityIndicatorWrapper>
          <Spinner />
        </ActivityIndicatorWrapper>
      )}
      {!!isPrismicContentFetched && (
        <Content showsVerticalScrollIndicator={false}>
          <TopContainer>
            <IntroductionText variant="big">{introductionText}</IntroductionText>
          </TopContainer>
          {interjectionPrismicContent.map((points, index) => (
            <MiddleContainer key={index}>
              <PointView style={{ backgroundColor: chainColor }}>
                <PointNumber>{index + 1}</PointNumber>
              </PointView >
              <TextView>
                <PointText>
                  {points.replace('{{network}}', chainTitle).replace('{{gasToken}}', chainGasSymbol)}
                </PointText>
              </TextView>
            </MiddleContainer>
          ))}
          <ButtonContainer>
            <Button
              title={t('depositFormat', { chain: chainTitle, symbol: chainGasSymbol })}
              onPress={showReceiveModal}
            />
          </ButtonContainer>
          <BottomText>{t('bottomText')}</BottomText>
        </Content>
      )}
    </Container>
  );
}

export default EtherspotDeploymentInterjection;


const TopContainer = styled.View`
  margin: ${spacing.large}px ${spacing.large}px;
  align-items: center;
  background-color: ${({ theme }) => theme.colors.basic050};
  border-radius: 20px;
  shadow-opacity: 0.05;
  shadow-color: #000;
  shadow-offset: 0 8px;
  shadow-radius: 16px;
  elevation: 6;
`;

const IntroductionText = styled(Text)`
  margin: ${spacing.mediumLarge}px ${spacing.largePlus}px;
  color: ${({ theme }) => theme.colors.hazardIconColor};
  text-align: center;
  font-size: ${fontSizes.medium}px;
`;

const MiddleContainer = styled.View`
  flex-direction: row;
  margin: ${spacing.large}px ${spacing.large}px;
`;

const PointView = styled.View`
  width: 48px;
  height: 48px;
  border-radius: 48px;
  justify-content: center;
`;

const PointNumber = styled(Text)`
  text-align: center;
  margin-horizontal: ${spacing.large}px;
  color: ${({ theme }) => theme.colors.basic050};
  font-size: ${fontSizes.medium}px;
`;

const TextView = styled.View`
  justify-content: center;
  margin-horizontal: ${spacing.large}px;
`;

const PointText = styled(Text)`
  padding-right: ${spacing.large}px;
  font-size: ${fontSizes.medium}px;
`;

const ButtonContainer = styled.View`
  margin-top: ${spacing.extraPlusLarge}px;
  margin-horizontal: ${spacing.large}px;
`;

const BottomText = styled(Text)`
  text-align: center;
  color: ${({ theme }) => theme.colors.hazardIconColor};
  margin: ${spacing.large}px;
  font-size: ${fontSizes.medium}px;
`;

const ActivityIndicatorWrapper = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
`;
