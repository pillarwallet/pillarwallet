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
import { debounce } from 'lodash';

// Utils
import { chainFromChainId } from 'utils/chains';
import { calculateDeploymentFee } from 'utils/deploymentCost';
import { logBreadcrumb, getCurrencySymbol } from 'utils/common';
import { getTxFeeInFiat, isHighGasFee } from 'utils/transactions';

// Components
import { Container } from 'components/layout/Layout';
import HeaderBlock from 'components/HeaderBlock';
import BigNumberInput from 'components/inputs/BigNumberInput';
import SwipeButton from 'components/SwipeButton/SwipeButton';
import Toast from 'components/Toast';

// Services
import etherspotService from 'services/etherspot';
import { appFont, fontSizes, fontStyles } from 'utils/variables';

// Selectors
import { useRootSelector, useFiatCurrency, useChainRates } from 'selectors/selectors';
import { gasThresholdsSelector } from 'redux/selectors/gas-threshold-selector';

// Actions
import { fetchGasInfoAction } from 'actions/historyActions';
import { estimateTransactionAction } from 'actions/transactionEstimateActions';
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

let integrationContract: any;
let contractRes: any;
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
  const fiatCurrency = useFiatCurrency();
  const chainRates = useChainRates(chain);
  const currencySymbol = getCurrencySymbol(fiatCurrency);
  const feeInfo = useRootSelector((root) => root.transactionEstimate.feeInfo);
  const [value, setValue] = React.useState();

  // const highFee = isHighGasFee(chain, feeInfo?.fee, feeInfo?.gasToken, chainRates, fiatCurrency, gasThresholds);

  React.useEffect(() => {
    dispatch(fetchGasInfoAction(chain));
    integrationContract = etherspotService.getContract(chain, contractData?.abi, contractData?.contract_address);
  }, [dispatch]);

  const updateTxFee = async () => {
    if (!value) return;
    const fnName = `encode${actionName[0]?.toUpperCase()}${actionName?.substring(1)}`;
    try {
      contractRes = await integrationContract[fnName](JSON.parse(value));
      dispatch(estimateTransactionAction({ ...contractRes, value: 0 }, chain));
      contractRes && logBreadcrumb('nativeIntegrationContractResponse', JSON.stringify(contractRes));
    } catch (e) {
      contractRes = undefined;
      logBreadcrumb('contractInput error!', e);
      Toast.show({
        message: JSON.stringify(e),
        emoji: 'warning',
      });
    }
  };
  const updateTxFeeDebounced = React.useCallback(debounce(updateTxFee, 100), [value]);

  React.useEffect(() => {
    updateTxFeeDebounced();
    return updateTxFeeDebounced.cancel;
  }, [updateTxFeeDebounced]);

  const updateData = async () => {
    if (chain && contractRes) {
      try {
        const res = await etherspotService.setTransactionsBatchAndSend([contractRes], chain);
        console.log('resss', res);
      } catch (error) {
        logBreadcrumb('contract update error!', error);
      }
    }
  };

  const feeInFiat = getTxFeeInFiat(chain, feeInfo?.fee, feeInfo?.gasToken, chainRates, fiatCurrency);
  const feeInFiatDisplayValue = `${currencySymbol}${feeInFiat.toFixed(5)}`;

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
        {value && (
          <FooterContent>
            <FeeText>{t('Fee') + ' ' + feeInFiatDisplayValue}</FeeText>
            <SwipeButton confirmTitle={t('button.swipeTo') + ' ' + actionName} onPress={updateData} />
          </FooterContent>
        )}
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

const FooterContent = styled.View``;

const Description = styled.Text`
  ${fontStyles.regular};
  font-family: ${appFont.regular};
  color: ${({ theme }) => theme.colors.basic020};
`;

const FeeText = styled.Text`
  text-align: center;
  color: ${({ theme }) => theme.colors.hazardIconColor};
  font-size: ${fontSizes.regular}px;
  margin: 20px;
`;
