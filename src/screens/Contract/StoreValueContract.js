/* eslint-disable i18next/no-literal-string */
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

import React, { useState } from 'react';
import styled from 'styled-components/native';
import { TouchableOpacity, View, Text, TextInput } from 'react-native';
import { getEnv } from 'configs/envConfig';
import { ethers } from 'ethers';

// utils
import { getEthereumProvider, logBreadcrumb } from 'utils/common';
import { chainFromChainId } from 'utils/chains';

// Selectors
import { useRootSelector } from 'selectors';
import { nativeIntegrationSelector } from 'redux/selectors/native-integration-selector';

// Services
import etherspotService from 'services/etherspot';

// Type
import type { EtherspotContractFetchItem } from 'utils/types/etherspot';

let integrationContract: any;

const StoreValueContract = () => {
  const nativeIntegrationResponse = useRootSelector(nativeIntegrationSelector);
  const [storeValue, setStoreValue] = useState('');
  const [isFetched, setIsFetched] = useState(false);

  const viewFunctions = nativeIntegrationResponse?.abis?.filter((fnSpec) => fnSpec.stateMutability === 'view');
  const inputFuctions = nativeIntegrationResponse?.abis?.filter((fnSpec) => fnSpec.stateMutability !== 'view');

  const FetchData = async () => {
    const chain = chainFromChainId[nativeIntegrationResponse?.chainId];
    if (!chain) null;
    integrationContract = etherspotService.getContract(
      chain,
      nativeIntegrationResponse?.abis,
      nativeIntegrationResponse?.contractAddress,
    );
    if (integrationContract) setIsFetched(true);
  };

  const StoreData = async () => {
    /**
     * Note
     * For perticuar input value using perffix in "encode"
     */
    const provider = getEthereumProvider(getEnv().NETWORK_PROVIDER);
    const privateKey = '';
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(
      nativeIntegrationResponse?.contractAddress,
      nativeIntegrationResponse?.abis,
      provider,
    );
    try {
      const contractWithSigner = contract.connect(wallet);
      const nativeIntegrationContractStore = await contractWithSigner?.store(parseInt(storeValue, 0));
      nativeIntegrationContractStore &&
        logBreadcrumb('nativeIntegrationContractStore', JSON.stringify(nativeIntegrationContractStore));
    } catch (e) {
      logBreadcrumb('Store error!', e);
    }
  };

  const retrieveData = async (res: EtherspotContractFetchItem) => {
    /**
     * Note
     * For perticuar get value using perffix in "call"
     */
    const fnNm = `call${res?.name[0]?.toUpperCase()}${res?.name?.substring(1)}`;
    try {
      const nativeIntegrationContractResponse = await integrationContract[fnNm]();
      nativeIntegrationContractResponse &&
        logBreadcrumb('nativeIntegrationContractResponse', nativeIntegrationContractResponse?.toNumber());
    } catch (e) {
      logBreadcrumb('ERROR!', e);
    }
  };

  return (
    <Container>
      {isFetched && <NormalText style={{ color: 'black' }}>Fetched!</NormalText>}
      <ConnectButton style={{ marginBottom: 100 }} onPress={FetchData}>
        <NormalText>Fetch Contract</NormalText>
      </ConnectButton>
      {inputFuctions?.map((fnRes) => (
        <InputContainer>
          <NormalTextInput value={storeValue} onChangeText={setStoreValue} />
          <ConnectButton onPress={StoreData}>
            <NormalText>{fnRes.name?.toUpperCase()}</NormalText>
          </ConnectButton>
        </InputContainer>
      ))}

      {viewFunctions?.map((fnRes) => (
        <ConnectButton onPress={() => retrieveData(fnRes)}>
          <NormalText>{fnRes.name?.toUpperCase()}</NormalText>
        </ConnectButton>
      ))}
    </Container>
  );
};

export default StoreValueContract;

const Container = styled(View)`
  flex: 1;
  background-color: white;
  align-items: center;
  padding-top: 100px;
`;

const InputContainer = styled(View)`
  align-items: center;
`;

const ConnectButton = styled(TouchableOpacity)`
  padding: 20px;
  background-color: black;
  border-radius: 20px;
  justify-content: center;
  align-items: center;
  margin: 10px;
`;

const NormalText = styled(Text)`
  font-size: 16px;
  font-weight: bold;
  color: white;
`;

const NormalTextInput = styled(TextInput)`
  font-size: 16px;
  font-weight: bold;
  color: black;
  width: 200px;
  height: 60px;
  background-color: pink;
  border-radius: 10px;
  text-align: center;
`;
