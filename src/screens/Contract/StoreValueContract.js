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
import { firebaseRemoteConfig } from 'services/firebase';

// Constants
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';

const StoreValueContract = () => {
  // const { activeConnectors } = useWalletConnect();
  const nativeIntigrationResponse = useRootSelector(nativeIntegrationSelector);
  const infuraProjectId = firebaseRemoteConfig.getString(REMOTE_CONFIG.INFURA_PROJECT_ID) || getEnv().INFURA_PROJECT_ID;

  logBreadcrumb('nativeIntigrationResponse!!', infuraProjectId, JSON.stringify(nativeIntigrationResponse));
  const [storeValue, setStoreValue] = useState('');

  const FetchData = async () => {};

  const StoreData = async () => {
    // Connect to the network
    // const provider = ethers.providers.InfuraProvider('573da487c709458483a788caecb10df7');
    const provider = getEthereumProvider(getEnv().NETWORK_PROVIDER);
    const contractAddress = '0x09f72Cc951a7c84f1718d732d26f3013B979039f';
    const privateKey = '0x0123456789012345678901234567890123456789012345678901234567890123';

    const contract = new ethers.Contract(contractAddress, abi, provider);
    logBreadcrumb('contract', contract);

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

  const RetrieveData = async () => {
    const provider = getEthereumProvider(getEnv().NETWORK_PROVIDER);
    logBreadcrumb('Provider', JSON.stringify(provider));
    const contractAddress = '0x09f72Cc951a7c84f1718d732d26f3013B979039f';
    const contract = new ethers.Contract(contractAddress, abi, provider);
    try {
      await contract.deployTransaction.wait();
    } catch (error) {
      logBreadcrumb('contract!!!!', error);
    }

    logBreadcrumb('Provider+contract', provider, contract);
    try {
      const currentValue = await contract.retrieve();
      logBreadcrumb('Retrieve value', currentValue);
    } catch (error) {
      logBreadcrumb('Retrieve error!', error);
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
      <ConnectButton onPress={RetrieveData}>
        <NormalText>Retrive</NormalText>
      </ConnectButton>
    </Container>
  );
};

export default StoreValueContract;

const abi = [
  {
    inputs: [],
    name: 'retrieve',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'num',
        type: 'uint256',
      },
    ],
    name: 'store',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

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
