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
import { useDispatch } from 'react-redux';
import { TouchableOpacity } from 'react-native';

// Components
import { Container, Content } from 'components/modern/Layout';
import Button from 'components/modern/Button';
import HeaderBlock from 'components/HeaderBlock';
import Modal from 'components/Modal';
import ReceiveModal from 'screens/Asset/ReceiveModal';
import Text from 'components/modern/Text';
import Spinner from 'components/Spinner';
import Tooltip from 'components/Tooltip';

// Constants
import { CHAIN } from 'constants/chainConstants';
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';
import { ETHERSPOT_WALLET_DEPLOYMENT_GAS_AMOUNT } from 'constants/etherspotConstants';

// Actions
import { fetchGasInfoAction } from 'actions/historyActions';

// Selectors
import {
  useRootSelector,
  activeAccountAddressSelector,
  useFiatCurrency,
  useChainRates,
} from 'selectors';

// Utils
import { useChainConfig } from 'utils/uiConfig';
import { spacing, fontSizes } from 'utils/variables';
import { mapFromDocumentDataToString } from 'utils/prismic';
import {
  formatAmount,
  formatFiat,
  formatUnits,
  hitSlop10,
  reportErrorLog,
  wrapBigNumber,
} from 'utils/common';
import { getAssetRateInFiat } from 'utils/rates';
import { nativeAssetPerChain } from 'utils/chains';

// Types
import type { Chain } from 'models/Chain';

// Services
import * as Prismic from 'services/prismic';
import { firebaseRemoteConfig } from 'services/firebase';

/**
 * Interjection screen used when Etherspot smart wallet is not yet deployed on given chain.
 */
function EtherspotDeploymentInterjection() {
  const { t, tRoot } = useTranslationWithPrefix('etherspot.deploymentInterjection');
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const fiatCurrency = useFiatCurrency();
  const [interjectionPrismicContent, setInterjectionPrismicContent] = React.useState({});
  const [introductionText, setIntroductionText] = React.useState('');
  const [isPrismicContentFetched, setIsPrismicContentFetched] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [showDeploymentFeeInToken, setShowDeploymentFeeInToken] = React.useState(false);
  const gasInfo = useRootSelector((root) => root.history.gasInfo);

  const chain: Chain = navigation.getParam('chain') ?? CHAIN.ETHEREUM;

  const chainRates = useChainRates(chain);

  React.useEffect(() => {
    dispatch(fetchGasInfoAction(chain));
  }, [dispatch, chain]);

  const prismicInterjectionDocumentId = firebaseRemoteConfig.getString(REMOTE_CONFIG.PRISMIC_INTERJECTION_DOCUMENT_ID);

  const deploymentFee = React.useMemo(() => {
    if (!gasInfo.gasPrice?.fast) return null; // fast used by Etherspot

    const { address, symbol, decimals } = nativeAssetPerChain[chain];

    const deploymentFeeWei = gasInfo.gasPrice.fast
      .times(1.1) // 10% to price is added on Etherspot back-end (ref – Jegor)
      .times(ETHERSPOT_WALLET_DEPLOYMENT_GAS_AMOUNT);

    const deploymentFeeBN = wrapBigNumber(formatUnits(deploymentFeeWei, decimals));
    const assetRate = getAssetRateInFiat(chainRates, address, fiatCurrency);
    const fiatValue = formatFiat(deploymentFeeBN.times(assetRate).toNumber(), fiatCurrency);
    const formattedAmount = formatAmount(deploymentFeeBN);

    const tokenValue = tRoot('tokenValue', { value: formattedAmount, token: symbol });

    return { tokenValue, fiatValue };
  }, [gasInfo, chainRates, chain, fiatCurrency, tRoot]);

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
        setErrorMessage(t('error'));
      }
    }
    fetchPrismicData();
  }, [prismicInterjectionDocumentId, chainTitle, t]);


  const showReceiveModal = () => {
    Modal.open(() => <ReceiveModal address={address} />);
  };

  return (
    <Container>
      <HeaderBlock centerItems={[{ title: t('title') }]} navigation={navigation} noPaddingTop />
      {!isPrismicContentFetched && <ErrorMessage>{errorMessage}</ErrorMessage>}
      {!!isPrismicContentFetched && (
        <Content showsVerticalScrollIndicator={false}>
          <TopContainer>
            <IntroductionText variant="big">{introductionText}</IntroductionText>
          </TopContainer>
          {interjectionPrismicContent?.map((points, index) => (
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
              btnTextStyle={styles.btnTextStyle}
            />
          </ButtonContainer>
          {!gasInfo.isFetched && <SpinnerWrapper><Spinner size={20} trackWidth={2} /></SpinnerWrapper>}
          {!!deploymentFee && (
            <Tooltip
              body={deploymentFee.tokenValue}
              isVisible={showDeploymentFeeInToken}
              positionOnBottom={false}
            >
              <TouchableOpacity
                hitSlop={hitSlop10}
                activeOpacity={1}
                onPress={() => setShowDeploymentFeeInToken(!showDeploymentFeeInToken)}
              >
                <FeeText>{t('cost', { cost: deploymentFee.fiatValue })}</FeeText>
              </TouchableOpacity>
            </Tooltip>
          )}
          <BottomText>{t('bottomText')}</BottomText>
        </Content>
      )}
    </Container>
  );
}

export default EtherspotDeploymentInterjection;

const styles = {
  btnTextStyle: {
    textAlign: 'center',
  },
};

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

const ErrorMessage = styled(Text)`
  margin: ${spacing.large}px;
  text-align: center;
  color: ${({ theme }) => theme.colors.negative};
`;

const FeeText = styled(Text)`
  text-align: center;
  color: ${({ theme }) => theme.colors.hazardIconColor};
  font-size: ${fontSizes.medium}px;
  margin: ${spacing.large}px ${spacing.large}px 0;
`;

const SpinnerWrapper = styled.View`
  margin-top: 25px;
`;
