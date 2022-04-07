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
import { useTranslation } from 'translations/translate';
import { StyleSheet } from 'react-native';
import styled from 'styled-components/native';

// Utils
import { chainFromChainId } from 'utils/chains';
import { calculateDeploymentFee } from 'utils/deploymentCost';
import { logBreadcrumb } from 'utils/common';

// Components
import { Container } from 'components/layout/Layout';
import HeaderBlock from 'components/HeaderBlock';
import BigNumberInput from 'components/inputs/BigNumberInput';
import SwipeButton from 'components/SwipeButton/SwipeButton';

// Services
import etherspotService from 'services/etherspot';
import { appFont, fontSizes, fontStyles, spacing } from 'utils/variables';

// Selectors
import { useChainGasInfo, useFiatCurrency, useChainRates } from 'selectors/selectors';

// Actions
import { fetchGasInfoAction } from 'actions/historyActions';
import { useDispatch } from 'react-redux';

type inputType = {
  parameterType:
    | 'BigNumberInput'
    | 'TokenValueInput'
    | 'AutoScaleTextInput'
    | 'CollectibleInput'
    | 'FiatValueInput'
    | 'MultilineTextInput'
    | 'TextInput'
    | 'TokenFiatValueInputs'
    | null;
};

function NIInputService() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const action = navigation.getParam('action');
  const contractData = navigation.getParam('contractData');
  const title = action?.['action-name'][0]?.text;
  const description = action?.['action-description'][0]?.text;
  const actionName = action?.['action-contract-call'];
  const chain = chainFromChainId[contractData?.chain_id];
  const gasInfo = useChainGasInfo(chain);
  const fiatCurrency = useFiatCurrency();
  const chainRates = useChainRates(chain);

  const [value, setValue] = React.useState();

  React.useEffect(() => {
    dispatch(fetchGasInfoAction(chain));
  }, [dispatch]);

  const deploymentFee = React.useMemo(() => {
    if (!gasInfo?.gasPrice?.fast) return null;
    return calculateDeploymentFee(chain, chainRates, fiatCurrency, gasInfo);
  }, [gasInfo, chainRates, chain, fiatCurrency]);

  const updateData = async () => {
    if (!chain) null;
    const integrationContract = etherspotService.getContract(chain, contractData?.abi, contractData?.contract_address);

    const fnName = `encode${actionName[0]?.toUpperCase()}${actionName?.substring(1)}`;
    try {
      const contractInputRes = await integrationContract[fnName](JSON.parse(value));
      await etherspotService.setTransactionsBatchAndSend([contractInputRes], chain);
      // navigation.navigate()
      contractInputRes && logBreadcrumb('nativeIntegrationContractResponse', JSON.stringify(contractInputRes));
    } catch (e) {
      logBreadcrumb('contractInput error!', e);
    }
  };

  return (
    <Container>
      <HeaderBlock centerItems={[{ title: title ? title : '' }]} navigation={navigation} />
      <MainContent>
        <Description>{description}</Description>
        <BigNumberInput
          value={value}
          returnType="done"
          onValueChange={setValue}
          editable={true}
          style={[styles.input]}
        />
        <SwipeButton
          confirmTitle={t('button.swipeTo') + ' ' + actionName}
          disabled={value ? false : true}
          onPress={updateData}
        />
        <FeeText>{t('Fee') + ' ' + deploymentFee?.fiatValue}</FeeText>
      </MainContent>
    </Container>
  );
}

export default NIInputService;

const styles = StyleSheet.create({
  input: {
    marginVertical: 20,
  },
});

const MainContent = styled.View`
  padding: 20px;
`;

const Description = styled.Text`
  ${fontStyles.regular};
  font-family: ${appFont.regular};
  color: ${({ theme }) => theme.colors.basic020};
`;

const FeeText = styled.Text`
  text-align: center;
  color: ${({ theme }) => theme.colors.hazardIconColor};
  font-size: ${fontSizes.regular}px;
  margin-top: 20px;
`;
