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
import styled from 'styled-components/native';
import { debounce } from 'lodash';
import { utils } from 'ethers';

// Utils
import { chainFromChainId } from 'utils/chains';
import { logBreadcrumb, getCurrencySymbol } from 'utils/common';
import { getTxFeeInFiat } from 'utils/transactions';
import { fontSizes, spacing } from 'utils/variables';
import { getDecimals } from 'utils/nativeIntegration';

// Components
import { Container } from 'components/layout/Layout';
import HeaderBlock from 'components/HeaderBlock';
import SwipeButton from 'components/SwipeButton/SwipeButton';
import { ScrollWrapper } from 'components/legacy/Layout';
import { Spacing } from 'components/legacy/Layout';
import Toast from 'components/Toast';
import Spinner from 'components/Spinner';

// Services
import etherspotService from 'services/etherspot';

// Selectors
import { useRootSelector, useFiatCurrency, useChainRates } from 'selectors/selectors';

// Actions
import { fetchGasInfoAction } from 'actions/historyActions';
import { estimateTransactionsAction } from 'actions/transactionEstimateActions';
import { useDispatch } from 'react-redux';
import NIInputField from './components/NIInputField';

// Constant
import { NI_TRANSACTION_COMPLETED } from 'constants/navigationConstants';

// ABIs
import ERC20_CONTRACT_ABI from 'abi/erc20.json';

function NIInputService() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const action = navigation.getParam('action');
  const contractData = navigation.getParam('contractData');
  const contractType = navigation.getParam('contractType');
  const title = action?.['action-name'][0]?.text;
  const actionName = action?.['action-contract-call'];
  const chain = chainFromChainId[contractData?.chain_id];
  const fiatCurrency = useFiatCurrency();
  const chainRates = useChainRates(chain);
  const currencySymbol = getCurrencySymbol(fiatCurrency);
  const feeInfo = useRootSelector((root) => root.transactionEstimate.feeInfo);
  const contractFunction = JSON.parse(contractData?.abi)?.find((fnRes) => fnRes.name === actionName);
  const blueprint = action?.blueprint;
  const sequence = blueprint ? JSON.parse(blueprint).sequence : null;
  const blankArr = new Array(contractFunction?.inputs.length).fill(null);
  const isPayable = contractType === 'payable' ? true : false;

  const feeInFiat = getTxFeeInFiat(chain, feeInfo?.fee, feeInfo?.gasToken, chainRates, fiatCurrency);
  const feeInFiatDisplayValue = `${currencySymbol}${feeInFiat.toFixed(5)}`;

  const [value, setValue] = React.useState(blankArr);
  const [contractRes, setContractRes] = React.useState([]);
  const [integrationContract, setIntegrationContract]: any = React.useState();
  const [isSendTransaction, setIsSendTransaction] = React.useState(false);
  const [amount, setAmount] = React.useState(null);

  React.useEffect(() => {
    dispatch(fetchGasInfoAction(chain));
    const integrationCon = etherspotService.getContract(chain, contractData?.abi, contractData?.contract_address);
    setIntegrationContract(integrationCon);
  }, [dispatch]);

  const updateTxFee = async () => {
    if (!value) return;
    if (contractType === 'payable' ? (amount === null ? true : false) : false) return;
    const findNull = value?.find((res) => res === null || res === '');
    if (findNull !== undefined) {
      setContractRes(undefined);
      return;
    }
    await contractInterface();
  };

  const updateTxFeeDebounced = React.useCallback(debounce(updateTxFee, 100), [value, amount]);

  React.useEffect(() => {
    updateTxFeeDebounced();
    return updateTxFeeDebounced.cancel;
  }, [updateTxFeeDebounced]);

  const contractInterface = async () => {
    const fnName = `encode${actionName[0]?.toUpperCase()}${actionName?.substring(1)}`;
    const updatedArr = value?.map(async (specificVal, i) =>
      specificVal?.c ? getDecimalValue(specificVal, i) : specificVal,
    );

    try {
      setIsSendTransaction(true);
      const valueWithBigNumber = await Promise.all(updatedArr);

      const list = await approvalList();
      const approveTxList = list ? await Promise.all(list) : [];

      const contractInterface = await integrationContract[fnName](...valueWithBigNumber);

      setContractRes([
        ...approveTxList,
        { ...contractInterface, value: isPayable ? utils.parseUnits(amount.toString(), 18) : 0 },
      ]);

      const approveListWithValue = approveTxList?.map((response) => {
        return { ...response, value: 0 };
      });

      dispatch(
        estimateTransactionsAction(
          [...approveListWithValue, { ...contractInterface, value: isPayable ? amount?.toString() : 0 }],
          chain,
        ),
      );
      setIsSendTransaction(false);
      logBreadcrumb('nativeIntegrationContractResponse', JSON.stringify(contractInterface));
    } catch (e) {
      setIsSendTransaction(false);
      setContractRes(undefined);
      Toast.show({
        message: e,
        emoji: 'warning',
      });
      logBreadcrumb('contractInput error!', e);
    }
  };

  const approvalList = async () => {
    const approvalFilter = sequence?.filter((res) => res?.isApprovalNeeded);

    const listOfApproval = approvalFilter
      ? await approvalFilter.map(async (approvalData, i) => {
          const index = sequence.indexOf(approvalData);

          const approvalContractInterface = etherspotService.getContract(chain, ERC20_CONTRACT_ABI, value[index]);
          try {
            const decimalVal = await getDecimals(approvalContractInterface);
            return approvalContractInterface.encodeApprove(
              contractData?.contract_address,
              utils.parseUnits(value[approvalData?.approveAmountPosition].toString(), decimalVal),
            );
          } catch (e) {
            Toast.show({
              message: 'Please enter valid address',
              emoji: 'warning',
            });
            return null;
          }
        })
      : null;

    return listOfApproval;
  };

  const getDecimalValue = async (bigNumberValue, index) => {
    const position = sequence?.[index]?.decimalAddressPosition;
    const approvalContractInterface =
      position !== undefined ? etherspotService.getContract(chain, ERC20_CONTRACT_ABI, value[position]) : null;

    const decimal = !approvalContractInterface ? 0 : await getDecimals(approvalContractInterface);

    return utils.parseUnits(bigNumberValue.toString(), decimal);
  };

  const nativeIntegrationTransaction = async () => {
    try {
      setIsSendTransaction(true);
      const res = await etherspotService.setTransactionsBatchAndSend(contractRes, chain);
      setIsSendTransaction(false);
      navigation.navigate(NI_TRANSACTION_COMPLETED, { transactionInfo: { chain: chain, ...res } });
    } catch (error) {
      setIsSendTransaction(false);
      Toast.show({
        message: error.toString(),
        emoji: 'warning',
      });
    }
  };

  const onChangeValue = (val, index) => {
    const arr = [...value];
    arr[index] = val;
    setValue(arr);
  };

  return (
    <Container>
      <ScrollWrapper>
        <HeaderBlock centerItems={[{ title: title ? title : '' }]} navigation={navigation} />
        <MainContent>
          {contractType === 'payable' && (
            <NIInputField
              itemInfo={{ name: 'Value', type: 'nativeTokenInput', internalType: 'nativeTokenInput' }}
              value={amount}
              onChangeValue={setAmount}
              txFeeInfo={feeInfo}
              chain={chain}
              disableAssetSelectorModal
            />
          )}
          {contractFunction?.inputs?.map((fnRes, index) => (
            <NIInputField
              itemInfo={fnRes}
              value={value[index]}
              onChangeValue={(val) => onChangeValue(val, index)}
              chain={chain}
            />
          ))}
          <Spacing h={10} />

          {contractRes && chain && (contractType === 'payable' ? (amount !== null ? true : false) : true) && (
            <FooterContent>
              <FeeText>{t('Fee') + ' ' + feeInFiatDisplayValue}</FeeText>
              <SwipeButton
                confirmTitle={t('button.swipeTo') + ' ' + actionName}
                onPress={nativeIntegrationTransaction}
              />
              {isSendTransaction && <LoadingSpinner size={35} />}
            </FooterContent>
          )}

          <Spacing h={30} />
        </MainContent>
      </ScrollWrapper>
    </Container>
  );
}

export default NIInputService;

const MainContent = styled.View`
  padding: 20px;
`;

const FooterContent = styled.View``;

const FeeText = styled.Text`
  text-align: center;
  color: ${({ theme }) => theme.colors.hazardIconColor};
  font-size: ${fontSizes.regular}px;
  margin: 20px;
`;

const LoadingSpinner = styled(Spinner)`
  margin-top: ${spacing.large}px;
  align-items: center;
  justify-content: center;
`;
