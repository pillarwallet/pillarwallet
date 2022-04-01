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

// utils
import { logBreadcrumb, errorLog } from 'utils/common';
import { chainFromChainId } from 'utils/chains';

// Selectors
import { useRootSelector } from 'selectors';
import { nativeIntegrationSelector } from 'redux/selectors/native-integration-selector';

// Services
import etherspotService from 'services/etherspot';

const StoreValueContract = () => {
  const nativeIntegrationResponse = useRootSelector(nativeIntegrationSelector);
  const [storeValue, setStoreValue] = useState('');

  const FetchData = async () => {};

  const StoreData = async () => {};

  const retrieveData = async () => {
    const chain = chainFromChainId[nativeIntegrationResponse?.chainId];
    if (!chain) null;
    try {
      const testIntegrationContract = etherspotService.getContract(
        chain,
        nativeIntegrationResponse?.abis,
        nativeIntegrationResponse?.contractAddress,
      );

      const abiSpecForFunction = nativeIntegrationResponse?.abis.filter((fnSpec) => fnSpec.stateMutability === 'view');
      logBreadcrumb('abiSpecForFunction', JSON.stringify(abiSpecForFunction));
      /**
       * And call* - where * is, is the Contract function name.
       * This could also be dynamic.
       */
      const nativeIntegrationContractResponse = await testIntegrationContract?.callRetrieve();
      nativeIntegrationContractResponse &&
        logBreadcrumb('nativeIntegrationContractResponse', nativeIntegrationContractResponse?.toNumber());
    } catch (e) {
      errorLog('ERROR!', e);
    }
  };

  return (
    <Container>
      <ConnectButton style={{ marginBottom: 100 }} onPress={FetchData}>
        <NormalText>Fetch data from wallet/Connect wallet</NormalText>
      </ConnectButton>
      <NormalTextInput value={storeValue} onChangeText={setStoreValue} />
      <ConnectButton onPress={StoreData}>
        <NormalText>Store</NormalText>
      </ConnectButton>
      <ConnectButton onPress={retrieveData}>
        <NormalText>Retrive</NormalText>
      </ConnectButton>
    </Container>
  );
};

export default StoreValueContract;

const Container = styled(View)`
  flex: 1;
  background-color: white;
  justify-content: center;
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
