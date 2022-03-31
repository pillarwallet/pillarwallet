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
import { ethers } from 'ethers';
import { TouchableOpacity, View, Text, TextInput } from 'react-native';

// utils
import { logBreadcrumb, getEthereumProvider } from 'utils/common';

// Selectors
import { useRootSelector } from 'selectors';
import { nativeIntegrationSelector } from 'redux/selectors/native-integration-selector';
import { getEnv } from 'configs/envConfig';

// Services
import etherspotService from 'services/etherspot';

// constants
import { CHAIN } from 'constants/chainConstants';

const StoreValueContract = () => {
  const nativeIntegrationResponse = useRootSelector(nativeIntegrationSelector);
  const nativeIntigrationAbi = nativeIntegrationResponse?.abis;
  const contractAddress = nativeIntegrationResponse?.contractAddress;
  const [storeValue, setStoreValue] = useState('');

  const FetchData = async () => {};

  const StoreData = async () => {
    const provider = getEthereumProvider(getEnv().NETWORK_PROVIDER);
    // Testing key
    const privateKey = '0x067D674A5D8D0DEBC0B02D4E5DB5166B3FA08384DCE50A574A0D0E370B4534F9';

    const contract = new ethers.Contract(contractAddress, nativeIntigrationAbi, provider);
    logBreadcrumb('contract', JSON.stringify(contract));

    const wallet = new ethers.Wallet(privateKey, provider);
    logBreadcrumb('wallet', JSON.stringify(wallet));
    try {
      const contractWithSigner = contract.connect(wallet);
      const tx = await contractWithSigner.store(parseInt(storeValue, 0));
      logBreadcrumb('tx', JSON.stringify(tx));
    } catch (error) {
      logBreadcrumb('Error!!!1', error);
    }
  };

  const retrieveData = async () => {
    try {
      /**
       * We need to fetch the instance of Etherspot,
       * this can be done dynamically
       */
      const mumbaiSdkInstance = etherspotService.instances.mumbai;

      /**
       * Next, register the contract we're dealing with
       */
      const testIntegrationContract =
        mumbaiSdkInstance
          .registerContract(
            `${CHAIN}-${nativeIntegrationResponse.address}`,
            nativeIntigrationAbi,
            contractAddress,
          );

      /**
       * And call* - where * is, is the Contract function name.
       * This could also be dynamic.
       */
      const nativeIntegrationContractResponse = await testIntegrationContract.callRetrieve();

      // eslint-disable-next-line no-console
      const abiSpecForFunction = nativeIntegrationResponse.abis.filter((fnSpec) => (fnSpec.name === 'retrieve'));
      // eslint-disable-next-line no-console
      console.log(abiSpecForFunction);
      // eslint-disable-next-line no-console
      console.log('testIntegrationContract!', nativeIntegrationContractResponse.toNumber());
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
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
