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

import { utils, Wallet } from 'ethers';
import { BigNumber } from 'bignumber.js';
import { Migrator } from '@etherspot/archanova-migrator';
import t from 'translations/translate';

// Constants
import { CHAIN } from 'constants/chainConstants';

// Services
import archanovaService from 'services/archanova';

// Utils
import { findFirstArchanovaAccount, findFirstEtherspotAccount, getAccountAddress } from 'utils/accounts';
import { estimateArchanovaRawTransactions } from 'utils/archanova';
import { addressesEqual } from 'utils/assets';
import { nativeAssetPerChain, mapChainToChainId } from 'utils/chains';
import { valueForAddress, reportErrorLog, logBreadcrumb } from 'utils/common';
import { recordValues } from 'utils/object';

// Types
import type { Account } from 'models/Account';
import type { WalletAssetsBalances, WalletAssetBalance } from 'models/Balances';
import type { CollectibleId } from 'models/Collectible';
import type { TokensToMigrateByAddress } from 'models/WalletMigrationArchanova';


/**
 * High-level function responsible for submitting migration transaction by calcullating & taking into account
 * necessary ETH fee.
 */
export async function submitMigrationTransactions(
  wallet: Wallet,
  accounts: Account[],
  walletBalances: ?WalletAssetsBalances,
  tokensToMigrate: TokensToMigrateByAddress,
  collectiblesToMigrate: CollectibleId[],
): Promise<string> {
  logBreadcrumb('walletMigrationArchanova', 'estimating migration transactions');
  const fee = await estimateMigrationTransactions(wallet, accounts, tokensToMigrate, collectiblesToMigrate);
  if (!fee) {
    reportErrorLog('submitMigrationTransactions: estimateMigrationTransactions returned falsy fee');
    throw new Error(t('error.failedToSubmitTransaction'));
  }

  const tokensToMigrateAfterFee = getTokensToMigrateAfterFee(tokensToMigrate, walletBalances, fee);

  logBreadcrumb('walletMigrationArchanova', 'build transaction to submit', {
    tokensToMigrateAfterFee,
    collectiblesToMigrate,
  });
  const transactionsToSubmit = await buildAssetMigrationRawTransactions(
    wallet,
    accounts,
    tokensToMigrateAfterFee,
    collectiblesToMigrate,
  );
  if (!transactionsToSubmit?.length) {
    reportErrorLog('submitMigrationTransactions: transactionsToSumbmit is empty');
    throw new Error(t('error.failedToSubmitTransaction'));
  }

  let hash;
  try {
    logBreadcrumb('walletMigrationArchanova', 'send raw transaction');
    hash = await archanovaService.sendRawTransactions(transactionsToSubmit);
  } catch (error) {
    reportErrorLog('submitMigrationTransactions: sendRawTransactions error', { error });
    throw new Error(t('error.failedToSubmitTransaction'));
  }

  if (!hash) {
    reportErrorLog('submitMigrationTransactions: sendRawTransactions returned falsy hash');
    throw new Error(t('error.failedToSubmitTransaction'));
  }

  logBreadcrumb('walletMigrationArchanova', 'transaction submitted', { hash });
  return hash;
}

/**
 * High-level function responsible for estimating gas fee for migration transactions.
 */
export async function estimateMigrationTransactions(
  wallet: Wallet,
  accounts: Account[],
  tokensToMigrate: TokensToMigrateByAddress,
  collectiblesToMigrate: CollectibleId[],
): Promise<BigNumber> {
  logBreadcrumb('walletMigrationArchanova', 'building asset migration raw transactions', {
    accounts,
    tokensToMigrate,
    collectiblesToMigrate,
  });
  const transactionsToEstimate = await buildAssetMigrationRawTransactions(
    wallet,
    accounts,
    tokensToMigrate,
    collectiblesToMigrate,
  );
  if (!transactionsToEstimate?.length) {
    reportErrorLog('submitMigrationTransactions: transactionsToEstimate is empty');
    throw new Error(t('error.failedToEstimateTransaction'));
  }

  logBreadcrumb('walletMigrationArchanova', 'estimate archanova raw transaction');
  const fee = await estimateArchanovaRawTransactions(transactionsToEstimate);

  logBreadcrumb('walletMigrationArchanova', 'estimated archanova raw transaction', { fee: fee.toFixed() });
  return fee;
}

export function hasNonNegligileWalletBalances(balances: ?WalletAssetsBalances) {
  if (!balances) return false;

  return Object.keys(balances).some((symbol) => isNonNegligibleBalance(balances[symbol]));
}

export function isNonNegligibleBalance(balance: WalletAssetBalance) {
  // TODO: improve this check
  return BigNumber(balance.balance).gte(1e-12);
}

/**
 * Returns tokens to migrate redux key, after reserving sufficient ETH to cover transaction fees.
 */
export function getTokensToMigrateAfterFee(
  tokensToMigrate: TokensToMigrateByAddress,
  walletBalances: ?WalletAssetsBalances,
  feeInEth: ?BigNumber,
): TokensToMigrateByAddress {
  // Fee is not yet known
  if (!feeInEth) return tokensToMigrate;

  const eth = nativeAssetPerChain.ethereum;
  const ethWalletBalance = BigNumber(valueForAddress(walletBalances, eth.address)?.balance ?? 0);
  const ethToMigrate = BigNumber(valueForAddress(tokensToMigrate, eth.address)?.balance ?? 0);

  // User has too little ETH even for fee
  if (feeInEth.gt(ethWalletBalance)) return tokensToMigrate;

  // Add a little bit of buffor
  const maxEthToMigrate = ethWalletBalance.minus(feeInEth).minus(0.000001);
  if (maxEthToMigrate.gte(ethToMigrate)) return tokensToMigrate;

  return {
    ...tokensToMigrate,
    [eth.address]: {
      address: eth.address,
      // truncate to avoid call reversed errors
      balance: maxEthToMigrate.toFixed(6, BigNumber.ROUND_DOWN),
      decimals: eth.decimals,
    },
  };
}

const buildAssetMigrationRawTransactions = async (
  wallet: Wallet,
  accounts: Account[],
  tokensToMigrate: TokensToMigrateByAddress,
  collectiblesToMigrate: CollectibleId[],
): Promise<string[]> => {
  const etherspotAccount = findFirstEtherspotAccount(accounts);
  if (!etherspotAccount) {
    reportErrorLog('buildAssetMigrationRawTransactions: no etherspot account found');
    throw new Error(t('error.failedToBuildTransaction'));
  }

  const archanovaAccount = findFirstArchanovaAccount(accounts);
  if (!archanovaAccount) {
    reportErrorLog('buildAssetMigrationRawTransactions: no etherspot account found');
    throw new Error(t('error.failedToBuildTransaction'));
  }

  const migratorParams = {
    chainId: mapChainToChainId(CHAIN.ETHEREUM),
    archanovaAccount: getAccountAddress(archanovaAccount),
    etherspotAccount: getAccountAddress(etherspotAccount),
  };
  logBreadcrumb('walletMigrationArchanova', 'building migrator', migratorParams);
  const migrator = new Migrator(migratorParams);

  logBreadcrumb('walletMigrationArchanova', 'apply add migrator device if needed');
  await applyAddMigratorDeviceTransactionIfNeeded(migrator);

  logBreadcrumb('walletMigrationArchanova', 'apply transfer transactions');
  await applyAssetTransferTransaction(migrator, tokensToMigrate, collectiblesToMigrate);

  // Sign migration message
  logBreadcrumb('walletMigrationArchanova', 'sign message');
  const archanovaAccountDeviceSignature = await wallet.signMessage(migrator.migrationMessage);
  if (!archanovaAccountDeviceSignature) {
    reportErrorLog('buildAssetMigrationRawTransactions: signMessage returned null');
    throw new Error(t('error.failedToSignMessage'));
  }

  logBreadcrumb('walletMigrationArchanova', 'encode transaction request');
  return migrator.encodeTransactionRequests(archanovaAccountDeviceSignature).map(({ data, to }) => {
    if (addressesEqual(to, migrator.migratorAddress)) {
      try {
        const { account } = archanovaService.getSdk().contract;
        return account.encodeMethodInput('executeTransaction', to, 0, data);
      } catch (error) {
        reportErrorLog('buildAssetMigrationRawTransactions: encodeMethodInput failed', {
          error,
          encodedTransactionRequest: { to, data },
          migratorAddress: migrator.migratorAddress,
          archanovaAccount: archanovaAccount.id,
          etherspotAccount: etherspotAccount.id,
        });
        throw new Error(t('error.failedToBuildTransaction'));
      }
    }

    return data;
  });
};

async function applyAddMigratorDeviceTransactionIfNeeded(migrator: Migrator): Migrator {
  const migratorDevice = await archanovaService.getConnectedAccountDevice(migrator.migratorAddress);
  const isMigratorDeviceDeployed = migratorDevice?.state === 'Deployed';
  logBreadcrumb('walletMigrationArchanova', 'connected migrator device', {
    migratorAddress: migrator.migratorAddress,
    migratorDevice,
  });

  if (!migratorDevice) {
    logBreadcrumb('walletMigrationArchanova', 'archanova add account device', { address: migrator.migratorAddress });
    await archanovaService.addAccountDevice(migrator.migratorAddress);
  }

  if (!isMigratorDeviceDeployed) {
    logBreadcrumb('walletMigrationArchanova', 'migrator add account device transaction');
    migrator = migrator.addAccountDevice();
  }
}

async function applyAssetTransferTransaction(
  migrator: Migrator,
  tokensToMigrate: TokensToMigrateByAddress,
  collectiblesToMigrate: CollectibleId[],
) {
  // Migrate ETH
  const nativeAsset = nativeAssetPerChain[CHAIN.ETHEREUM];
  const nativeAssetToMigrate = valueForAddress(tokensToMigrate, nativeAsset.address);
  if (nativeAssetToMigrate) {
    logBreadcrumb('walletMigrationArchanova', 'add ETH balance', { balance: nativeAssetToMigrate.balance });
    migrator = migrator.transferBalance(utils.parseEther(nativeAssetToMigrate.balance));
  }

  // Migrate tokens (except ETH)
  const tokenMigrations = recordValues(tokensToMigrate)
    .filter(({ address }) => !addressesEqual(address, nativeAsset.address))
    .map(({ address, balance, decimals }) => ({
      token: address,
      amount: utils.parseUnits(balance, decimals),
    }));
  if (tokenMigrations.length > 0) {
    logBreadcrumb('walletMigrationArchanova', 'add tokens', { tokenMigrations });
    migrator.transferERC20Tokens(tokenMigrations);
  }

  // Migrate NFTs
  const collectibleMigrations = collectiblesToMigrate.map(({ contractAddress, id }) => ({
    token: contractAddress,
    id,
  }));
  if (collectibleMigrations.length > 0) {
    logBreadcrumb('walletMigrationArchanova', 'add collectibles', { collectibleMigrations });
    migrator.transferERC721Tokens(collectibleMigrations);
  }
}