// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

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

// Constants
import { ETHERSPOT_WALLET_DEPLOYMENT_GAS_AMOUNT } from 'constants/etherspotConstants';

// Utils
import { nativeAssetPerChain } from 'utils/chains';
import { formatFiatValue, formatTokenValue } from 'utils/format';
import { getAssetValueInFiat } from 'utils/rates';
import { fromBaseUnit } from 'utils/bigNumber';

// Types
import type { Chain } from 'models/Chain';
import type { RatesByAssetAddress, Currency } from 'models/Rates';
import type { GasInfo } from 'models/GasInfo';

export function calculateDeploymentFee(
  chain: Chain,
  chainRates: RatesByAssetAddress,
  fiatCurrency: Currency,
  gasInfo: GasInfo,
) {
  if (!gasInfo?.gasPrice?.fast) return null;
  const { address: assetAddress, symbol, decimals } = nativeAssetPerChain[chain];

  const deploymentFeeWei = gasInfo.gasPrice.fast // fast is strategy on Etherspot back-end (ref – Jegor)
    .times(1.1) // 10% to price is added on Etherspot back-end (ref – Jegor)
    .times(ETHERSPOT_WALLET_DEPLOYMENT_GAS_AMOUNT);

  const deploymentFeeBN = fromBaseUnit(deploymentFeeWei, decimals);
  const fiatValue = getAssetValueInFiat(deploymentFeeBN, assetAddress, chainRates, fiatCurrency);

  // covers scenario per Dmitry's request show <0.01 in case it's lower than that
  const isInvisibleFiatValue = fiatValue && fiatValue < 0.01;
  let formattedFiatValue = formatFiatValue(isInvisibleFiatValue ? 0.01 : fiatValue, fiatCurrency);
  if (isInvisibleFiatValue && formattedFiatValue) formattedFiatValue = `<${formattedFiatValue}`;

  const tokenValue = formatTokenValue(deploymentFeeBN, symbol);

  return { tokenValue, fiatValue: formattedFiatValue };
}
