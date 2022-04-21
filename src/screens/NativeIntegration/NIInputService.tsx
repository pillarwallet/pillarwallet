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
import BigNumber from 'bignumber.js';

// Utils
import { chainFromChainId } from 'utils/chains';
import { logBreadcrumb, getCurrencySymbol } from 'utils/common';
import { getTxFeeInFiat } from 'utils/transactions';

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
import { fontSizes, spacing } from 'utils/variables';

// Selectors
import { useRootSelector, useFiatCurrency, useChainRates, useActiveAccount } from 'selectors/selectors';

// Actions
import { fetchGasInfoAction } from 'actions/historyActions';
import { estimateTransactionAction } from 'actions/transactionEstimateActions';
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
  const title = action?.['action-name'][0]?.text;
  const actionName = action?.['action-contract-call'];
  const chain = chainFromChainId[contractData?.chain_id];
  const activeAccount = useActiveAccount();
  const fiatCurrency = useFiatCurrency();
  const chainRates = useChainRates(chain);
  const currencySymbol = getCurrencySymbol(fiatCurrency);
  const feeInfo = useRootSelector((root) => root.transactionEstimate.feeInfo);
  const contractFunction = JSON.parse(contractData?.abi)?.find((fnRes) => fnRes.name === actionName);
  const blueprint = action?.blueprint;
  const sequence = blueprint ? JSON.parse(blueprint).sequence : null;
  const approvalsData = blueprint ? JSON.parse(blueprint).approvals : null;
  const blankArr = new Array(contractFunction?.inputs.length).fill(null);

  const [value, setValue] = React.useState(blankArr);
  const [contractRes, setContractRes] = React.useState();
  const [integrationContract, setIntegrationContract]: any = React.useState();
  const [isSendTransaction, setIsSendTransaction] = React.useState(false);

  // const highFee = isHighGasFee(chain, feeInfo?.fee, feeInfo?.gasToken, chainRates, fiatCurrency, gasThresholds);

  React.useEffect(() => {
    dispatch(fetchGasInfoAction(chain));
    const integrationCon = etherspotService.getContract(chain, contractData?.abi, contractData?.contract_address);
    setIntegrationContract(integrationCon);
  }, [dispatch]);

  const updateTxFee = async () => {
    if (!value) return;
    if (value.length < contractFunction?.inputs.length) return;
    const findNull = value?.find((res) => res === null || res === '');
    if (findNull !== undefined) {
      setContractRes(undefined);
      return;
    }

    const fnName = `encode${actionName[0]?.toUpperCase()}${actionName?.substring(1)}`;
    const updatedArr = value?.map((specificVal) =>
      specificVal?.c ? utils.parseUnits(specificVal?.toString(), 0) : specificVal,
    );

    try {
      setIsSendTransaction(true);
      const response = await integrationContract[fnName](...updatedArr);
      setContractRes(response);
      dispatch(estimateTransactionAction({ ...response, value: 0 }, chain));
      setIsSendTransaction(false);
      contractRes && logBreadcrumb('nativeIntegrationContractResponse', JSON.stringify(response));
    } catch (e) {
      setIsSendTransaction(false);
      setContractRes(undefined);
      logBreadcrumb('contractInput error!', e);
    }
  };
  const updateTxFeeDebounced = React.useCallback(debounce(updateTxFee, 100), [value]);

  React.useEffect(() => {
    updateTxFeeDebounced();
    return updateTxFeeDebounced.cancel;
  }, [updateTxFeeDebounced]);

  const updateData = async () => {
    /**
     * Before we continue here, we need to be sure that
     * we check approvals. Approvals allow smart contracts
     * to "spend" our money on our behalf.
     * 
     * The first thing we need to do is to build an array of
     * approval promises. An approval check requires two bits
     * of information:
     * - the owner
     * - the spender (the contract that wants to spend your money)
     */

    console.log('Blueprint for Approvals:', approvalsData);
    console.log('Number of approvals to check:', approvalsData.length);

    /**
     * If approvalsData.length is 0 - we can skip the approvals check
     */

    /**
     * Next, let's build our approval calls. Cycle through the
     * approvalsData array and build the Promises array
     */
    const approvalCheckPromises = [];
    approvalsData.forEach(approvalData => {
      /**
       * We need to know in advance at which position in the
       * input array from the user the token address lives at.
       * This is delivered via the CMS from here:
       * `approvalData.abiInputsArrayPosition.token`
       */
      const approvalContractInterface = etherspotService
        .getContract(chain, ERC20_CONTRACT_ABI, value[approvalData.abiInputsArrayPosition.token]);
      
      // ... and add this check to the `approvalCheckPromises` array.
      approvalCheckPromises.push(
        approvalContractInterface.callAllowance(activeAccount.id, contractData?.contract_address)
      );
    });

    console.log(`Built ${approvalCheckPromises.length} approval checks.`);

    /**
     * Now we can execute the approvals check array
     */

    const approvalsResult = await Promise.all(approvalCheckPromises);

    console.log('Approvals result was:', approvalsResult);
    // And a more clear view:
    approvalsResult.forEach((r) => console.log(r));

    /**
     * A BigNumber is returned here of the amount that the
     * smart contract wanting to spend the accounts money has
     * left to spend. This value needs to be checked against
     * what is in the array position here:
     * `approvalsData.abiInputsArrayPosition.amount` which, again,
     * is a value that we need to know ahead of time from the CMS.
     */

    approvalsResult.forEach((bnResult, i) => {
      const bnUserInput = new BigNumber(value[approvalsData[i].abiInputsArrayPosition.amount]);
      const bnResultAsBigNumber = new BigNumber(bnResult);
      console.log(`Was the amount approved less than the user entered amount? ${bnResultAsBigNumber.lt(bnUserInput)}`);

      if (bnResultAsBigNumber.lt(bnUserInput)) {
        console.log('Approval transaction needed!');
        /**
         * If we end up here, we're going to need to make a transaction
         * to run an approval transaction to allow a smart contract to
         * spend the funds in the account.
         * https://docs.openzeppelin.com/contracts/2.x/api/token/erc20#IERC20-approve-address-uint256-
         * 
         * These approval transactions will need to be added to the batch.
         * There's no need to perform these first, just add them to the
         * transacion batch before the actual contract call.
         */
      } else {
        console.log('No approvals needed, continue to perform contract call...');
      }
    });

    /**
     * Continue as usual.
     */
    try {
      setIsSendTransaction(true);
      const res = await etherspotService.setTransactionsBatchAndSend([contractRes], chain);
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

  const feeInFiat = getTxFeeInFiat(chain, feeInfo?.fee, feeInfo?.gasToken, chainRates, fiatCurrency);
  const feeInFiatDisplayValue = `${currencySymbol}${feeInFiat.toFixed(5)}`;

  return (
    <Container>
      <ScrollWrapper>
        <HeaderBlock centerItems={[{ title: title ? title : '' }]} navigation={navigation} />
        <MainContent>
          {contractFunction?.inputs?.map((fnRes, index) => (
            <NIInputField
              blueprint={sequence[index]}
              itemInfo={fnRes}
              value={value[index]}
              onChangeValue={(val) => onChangeValue(val, index)}
            />
          ))}

          <Spacing h={10} />

          {contractRes && chain && (
            <FooterContent>
              <FeeText>{t('Fee') + ' ' + feeInFiatDisplayValue}</FeeText>
              <SwipeButton confirmTitle={t('button.swipeTo') + ' ' + actionName} onPress={updateData} />
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
