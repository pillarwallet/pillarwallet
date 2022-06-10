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
import { utils } from 'ethers';
import { BigNumber } from 'bignumber.js';

// Utils
import { getDecimals } from 'utils/nativeIntegration';


// Components
import Toast from 'components/Toast';

// Service
import Storage from 'services/storage';
import etherspotService from 'services/etherspot';

// Utils
import { logBreadcrumb } from 'utils/common';

// ABIs
import ERC20_CONTRACT_ABI from 'abi/erc20.json';

// Type
import type { Chain } from 'models/Chain';


export const nativeIntegrationWarning = async () => {
  const storage = Storage.getInstance('db');
  const visibleWarning = await storage.get('ni_warning');

  return visibleWarning?.visible === 'no' ? true : false;
};

export const catchError = (error: string, returnType?: null | any[]) => {
  Toast.closeAll();
  Toast.show({
    message: error,
    emoji: 'warning',
  });
  logBreadcrumb('Native integration input service error!', error);
  return returnType ? returnType : [];
};

export const getDecimalValue = async (bigNumberValue: BigNumber, position: number, chain: Chain, value: any[]) => {
  const approvalContractInterface =
    position !== undefined ? etherspotService.getContract(chain, ERC20_CONTRACT_ABI, value[position]) : null;

  const decimal = !approvalContractInterface ? 0 : await getDecimals(approvalContractInterface);

  return utils.parseUnits(bigNumberValue.toString(), decimal);
};

export const transactionApprovalsList = async (approvalsList, approvalPosition, contract_address, chain, value) => {
  return await approvalsList.map(async (approvalData, i) => {
    const index = approvalPosition.indexOf(approvalData);

    const approvalContractInterface = etherspotService.getContract(chain, ERC20_CONTRACT_ABI, value[index]);

    const decimalVal = await getDecimals(approvalContractInterface).catch(() =>
      catchError('Address is not valid!', null),
    );
    if (!decimalVal) return null;

    return approvalContractInterface.encodeApprove(
      contract_address,
      utils.parseUnits(value[approvalData?.approveAmountPosition].toString(), decimalVal),
    );
  })
}