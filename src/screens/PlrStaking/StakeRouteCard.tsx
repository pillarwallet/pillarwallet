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

import React, { FC } from 'react';
import styled from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';
import { BigNumber, ethers } from 'ethers';

// Constants
import { CHAIN } from 'constants/chainConstantsTs';
import { ADDRESS_ZERO } from 'constants/assetsConstants';

// Utils
import { fontStyles } from 'utils/variables';
import { useChainsConfig } from 'utils/uiConfig';
import { formatTokenValue } from 'utils/format';
import { formatFiatValue } from 'utils/format';
import { getBalanceInFiat } from 'utils/assets';

// Selectors
import { useFiatCurrency, useChainRates } from 'selectors';

// Types
import type { Asset, AssetOption } from 'models/Asset';

// Components
import TokenIcon from 'components/display/TokenIcon';
import Text from 'components/core/Text';
import FeeCard from './FeeCard';
import { ISendData, IStakingSteps } from './RouteCard';

interface IStakeRouteCard {
  plrToken?: AssetOption;
  value?: string;
  chain?: string;
  formattedFromAmount?: string;
  stakeFeeInfo: any;
  stakeGasFeeAsset: Asset | AssetOption;
  stakingSteps?: IStakingSteps;
  sendData?: ISendData;
}

const StakeRouteCard: FC<IStakeRouteCard> = ({
  plrToken,
  value,
  chain,
  formattedFromAmount,
  stakeFeeInfo,
  stakeGasFeeAsset,
  stakingSteps,
  sendData,
}) => {
  const { t } = useTranslationWithPrefix('plrStaking.validator');
  const { t: tMain } = useTranslationWithPrefix('plrStaking');

  const chainsConfig = useChainsConfig();
  const { titleShort: networkName } = chainsConfig[chain];
  const currency = useFiatCurrency();
  const chainRates = useChainRates(chain);
  const ethRates = useChainRates(CHAIN.ETHEREUM);

  const formattedToAmount = formatTokenValue(value, plrToken.symbol, { decimalPlaces: 0 }) ?? '';
  const stakeFeeEtherValueBn = stakeFeeInfo ? BigNumber.from(stakeFeeInfo.toString()) : null;

  const getFiatValue = (value: BigNumber, address: string, isEthereum?: boolean) => {
    if (!value) return null;

    const etherValue = ethers.utils.formatEther(value.toString());
    const valueInFiat = getBalanceInFiat(currency, etherValue, !!isEthereum ? ethRates : chainRates, address);
    return valueInFiat;
  };

  return (
    <>
      <RouteWrapper>
        {/* Included empty tags as Route card UI breaks when keypad is unfocused - your guess is as good as mine */}
        <RouteBreakdownWrapper></RouteBreakdownWrapper>

        {!!sendData && (
          <RouteBreakdownWrapper>
            <Circle active={stakingSteps?.isSent} />

            <RouteBreakdownContainer processing={stakingSteps?.processing} active={stakingSteps?.isSending}>
              <IconWrapper>
                {sendData.asset && <TokenIcon url={sendData.asset.iconUrl} size={32} chain={chain} />}
              </IconWrapper>

              <RouteInfoContainer>
                <RouteInfoRow>
                  <MainText>
                    {t('sendFrom', {
                      formattedValue: formattedFromAmount,
                      receiverWallet: tMain('etherspot'),
                    })}
                  </MainText>
                </RouteInfoRow>

                <RouteInfoRow>
                  <SubText>
                    <HighlightText>{`${t('estFee')} `}</HighlightText>
                  </SubText>
                </RouteInfoRow>
              </RouteInfoContainer>
            </RouteBreakdownContainer>
          </RouteBreakdownWrapper>
        )}

        <RouteBreakdownWrapper>
          <Circle active={stakingSteps?.isStaked} />

          <RouteBreakdownContainer processing={stakingSteps?.processing} active={stakingSteps?.isStaking}>
            <IconWrapper>
              {plrToken && <TokenIcon url={plrToken?.iconUrl} size={32} chain={plrToken?.chain} />}
            </IconWrapper>

            <RouteInfoContainer>
              <RouteInfoRow>
                <MainText>{t('stakeOn', { formattedAmount: formattedToAmount, networkName })}</MainText>
              </RouteInfoRow>
              <RouteInfoRow>
                <GasPriceWrapper>
                  <SubText>
                    <HighlightText>{`${t('estFee')} `}</HighlightText>
                    {formatFiatValue(getFiatValue(stakeFeeEtherValueBn, ADDRESS_ZERO, true), currency)}
                  </SubText>
                </GasPriceWrapper>
              </RouteInfoRow>
            </RouteInfoContainer>
          </RouteBreakdownContainer>
        </RouteBreakdownWrapper>
      </RouteWrapper>
    </>
  );
};

export default StakeRouteCard;
// Routes
const RouteWrapper = styled.View`
  flex-direction: column;
`;

const RouteBreakdownWrapper = styled.View`
  display: flex;
  flex: 1;
  flex-direction: row;
  align-items: center;
  margin: 0 0 8px;
`;

const Circle = styled.View<{ active?: boolean }>`
  height: 10px;
  width: 10px;
  margin-right: 8px;
  background-color: ${({ theme, active }) => (active ? theme.colors.positive : 'rgba(0,0,0,0)')};
  border: 1px ${({ theme }) => theme.colors.basic080} solid;
  border-radius: 10px;
`;

const RouteBreakdownContainer = styled.View`
  padding: 10px;
  border-radius: 20px;
  background-color: ${({ theme }) => theme.colors.basic050};

  flex: 1;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

const IconWrapper = styled.View`
  align-items: center;
  justify-content: center;
`;

const RouteInfoContainer = styled.View`
  display: flex;
  flex: 1;
  flex-direction: column;
  padding-left: 16px;
  justify-content: center;
`;

const RouteInfoRow = styled.View`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const MainText = styled(Text).attrs((props: { highlighted?: boolean }) => props)`
  ${fontStyles.medium};

  color: ${({ theme, highlighted }) => (highlighted ? theme.colors.plrStakingHighlight : theme.colors.basic000)};
`;

const SubText = styled(Text).attrs((props: { highlighted?: boolean }) => props)`
  ${fontStyles.regular};
  color: ${({ theme, highlighted }) => (highlighted ? theme.colors.plrStakingHighlight : theme.colors.basic000)};
`;

const GasPriceWrapper = styled.View`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const HighlightText = styled(Text)`
  color: ${({ theme }) => theme.colors.plrStakingHighlight};
`;
