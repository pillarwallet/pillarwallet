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

import React, { FC, useRef } from 'react';
import { Alert } from 'react-native';
import styled from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';
import { useDispatch } from 'react-redux';

// Components
import SlideModal from 'components/Modals/SlideModal';
import Icon from 'components/core/Icon';
import Text from 'components/core/Text';
import Button from 'components/core/Button';

// Constants
import { CHAIN } from 'constants/chainConstants';

// Utils
import { spacing, borderRadiusSizes, fontStyles, appFont } from 'utils/variables';
import { useThemeColors } from 'utils/themes';
import { calculateDeploymentFee } from 'utils/deploymentCost';

// Hooks
import { useDeploymentStatus } from 'hooks/deploymentStatus';

// Selectors
import { useChainGasInfo, useChainRates, useFiatCurrency } from 'selectors/selectors';

// Actions
import { fetchGasInfoAction } from 'actions/historyActions';

interface ISelectNetworkModal {
  networkSelected: () => void,
}

const SelectNetworkModal : FC<ISelectNetworkModal> = ({ networkSelected }) => {
  const modalRef = useRef(null);
  const dispatch = useDispatch();
  const colors = useThemeColors();
  const fiatCurrency = useFiatCurrency();
  const { isDeployedOnChain } = useDeploymentStatus();
  const { t, tRoot } = useTranslationWithPrefix('servicesContent.ramp.addCash.selectNetworkModal');
  const [isSideChains, setIsSideChains] = React.useState(true);
  const [isEthereumChain, setIsEthereumChain] = React.useState(false);
  const isDeployedOnEthereum = isDeployedOnChain[CHAIN.ETHEREUM];
  const chainRates = useChainRates(CHAIN.ETHEREUM);
  const gasInfo = useChainGasInfo(CHAIN.ETHEREUM);

  React.useEffect(() => {
    dispatch(fetchGasInfoAction(CHAIN.ETHEREUM));
  }, [dispatch]);

  const deploymentFee = React.useMemo(() => {
    if (!gasInfo?.gasPrice?.fast) return null;
    return calculateDeploymentFee(CHAIN.ETHEREUM, chainRates, fiatCurrency, gasInfo);
  }, [gasInfo, chainRates, fiatCurrency]);

  const selectSideChains = () => {
    setIsSideChains(true);
    setIsEthereumChain(false);
  };

  const selectEthereumChain = () => {
    setIsEthereumChain(true);
    setIsSideChains(false);
  };

  const close = React.useCallback(() => {
    if (modalRef.current) modalRef.current.close();
  }, []);

  const onSubmit = () => {
    if (isSideChains) {
      networkSelected();
    } else {
      if (!isDeployedOnEthereum) {
        close();
        Alert.alert(
          tRoot('servicesContent.alert.title'),
          tRoot('servicesContent.alert.subtitle', deploymentFee && { deploymentCost: deploymentFee?.fiatValue }),
          [
            {
              text: tRoot('servicesContent.alert.buttons.cancel'),
            },
            {
              text: tRoot('servicesContent.alert.buttons.confirm'),
              onPress: () => {
                networkSelected();
              },
              style: 'destructive',
            },
          ],
        );
      } else {
        networkSelected();
      }
    }
  };

  return (
    <SlideModal noSwipeToDismiss ref={modalRef} hideHeader noClose>
      <Content>
        <ModalTitle>{t('title')}</ModalTitle>
        <ModalSubtitle color={colors.tertiaryText}>{t('subtitle')}</ModalSubtitle>
        <Container onPress={selectSideChains}>
          <ContainerView isSelected={isSideChains}>
            <RowContainer>
              {isSideChains && <RadioIcon name="checked-radio" />}
              {!isSideChains && <RadioIcon name="unchecked-radio" />}
              <ContentView>
                <Text variant="big" style={isSideChains && styles.titleStyle}>
                  {t('options.sidechains')}
                </Text>
                <Text color={colors.tertiaryText}>{t('options.chainName')}</Text>
              </ContentView>
              <Text>{t('options.recommended')}</Text>
            </RowContainer>
          </ContainerView>
        </Container>
        <Container onPress={selectEthereumChain}>
          <ContainerView isSelected={isEthereumChain}>
            <RowContainer>
              {isEthereumChain && <RadioIcon name="checked-radio" />}
              {!isEthereumChain && <RadioIcon name="unchecked-radio" />}
              <ContentView>
                <Text variant="big" style={isEthereumChain && styles.titleStyle}>
                  {t('options.ethereum')}
                </Text>
              </ContentView>
              <Text color={colors.negative}>{t('options.highGasPrice')}</Text>
            </RowContainer>
          </ContainerView>
        </Container>
        <Button
          title={tRoot('button.continue')}
          onPress={onSubmit}
          size="large"
          style={[styles.buttonStyle, isEthereumChain && { backgroundColor: colors.negative }]}
        />
        {isEthereumChain && !isDeployedOnEthereum && (
          <WarningMessage color={colors.negative}>
            {t('warningMessage', deploymentFee && { deploymentCost: deploymentFee?.fiatValue })}
          </WarningMessage>
        )}
      </Content>
    </SlideModal>
  );
};

export default SelectNetworkModal;

const styles = {
  buttonStyle: {
    marginBottom: spacing.large,
    marginTop: spacing.mediumLarge,
  },
  titleStyle: {
    fontFamily: appFont.medium,
  },
};

const Content = styled.View`
  margin-bottom: ${spacing.large}px;
`;

const ModalTitle = styled(Text)`
  ${fontStyles.big};
  text-align: center;
  margin: ${spacing.large}px 0px;
  font-family: '${appFont.medium}';
`;

const ModalSubtitle = styled(Text)`
  ${fontStyles.medium};
  margin-bottom: ${spacing.large}px;
`;

const TouchableContainer = styled.TouchableOpacity`
  align-items: center;
  justify-content: center;
`;

const Container = styled(TouchableContainer)`
  background-color: ${({ theme }) => theme.colors.basic050};
  flex-direction: row;
  border-radius: ${borderRadiusSizes.defaultContainer}px;
  margin-bottom: ${spacing.small}px;
`;

const ContainerView = styled.View`
  background-color: ${({ theme, isSelected }) => (isSelected ? theme.colors.basic080 : theme.colors.basic050)};
  padding: ${spacing.large}px;
  border-radius: ${borderRadiusSizes.medium}px;
  flex-direction: column;
  flex: 1;
`;

const RowContainer = styled.View`
  align-items: center;
  justify-content: center;
  flex-direction: row;
`;

const ContentView = styled.View`
  flex: 1;
  padding: 0 ${spacing.medium}px 0 ${spacing.medium}px;
`;

const RadioIcon = styled(Icon)`
  height: 24px;
  width: 24px;
  background-color: ${({ theme }) => theme.colors.basic050};
  border-radius: ${borderRadiusSizes.medium}px;
  padding-right: ${spacing.medium}px;
  margin-right: ${spacing.medium}px;
`;

const WarningMessage = styled(Text)`
  ${fontStyles.small};
  text-align: center;
  margin-bottom: ${spacing.large}px;
`;
