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

import React, { FC, useMemo } from 'react';
import styled from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';
import { BigNumber, ethers } from 'ethers';
import { Route } from '@lifi/sdk';

// Constants
import { OFFERS } from 'constants/exchangeConstants';
import { CHAIN } from 'constants/chainConstantsTs';
import { WalletType, stkPlrToken } from 'constants/plrStakingConstants';
import { ADDRESS_ZERO } from 'constants/assetsConstants';

// Utils
import { fontStyles, spacing } from 'utils/variables';
import { useProviderConfig } from 'utils/exchange';
import { getBalanceInFiat } from 'utils/assets';
import { formatFiatValue, formatAmountDisplay } from 'utils/format';
import { useChainsConfig } from 'utils/uiConfig';
import { chainFromChainId } from 'utils/chains';

// Selectors
import { useFiatCurrency, useChainRates } from 'selectors';

// Types
import type { Asset, AssetOption } from 'models/Asset';
import type { Chain } from 'models/Chain';
import type { TransactionFeeInfo } from 'models/Transaction';

// Hooks
import { useTransactionsEstimate } from 'hooks/transactions';

// Components
import TokenIcon from 'components/display/TokenIcon';
import RadioButton from 'components/RadioButton';
import Text from 'components/core/Text';
import { Spacing } from 'components/legacy/Layout';
import Spinner from 'components/Spinner';

export interface IStakingSteps {
  processing: boolean;
  isSending: boolean;
  isSent: boolean;
  isBridging: boolean;
  isBridged: boolean;
  isSwapping: boolean;
  isSwapped: boolean;
  isStaking: boolean;
  isStaked: boolean;
}

export interface ISendData {
  sourceWallet: WalletType;
  formattedValue: string;
  asset: Asset | AssetOption;
  feeInfo?: any;
}

export interface ISwapData {
  swapTransactions: any[];
  stakeTransactions: any[];
}

interface IRouteCard {
  offer?: any;
  selected?: boolean;
  chain?: Chain;
  plrToken?: AssetOption;
  sourceWallet?: WalletType;
  formattedToAmount?: string;
  formattedFromAmount?: string;
  networkName?: string;
  provider?: any;
  highFee?: boolean;
  onSelectOffer?: (offer: any, feeInfo: TransactionFeeInfo | null) => void;
  disabled?: boolean;
  stakeFeeInfo: any;
  transactions: any;
  gasFeeAsset: Asset | AssetOption;
  stakingSteps?: IStakingSteps;
  bridgeRoute?: Route;
  sendData?: ISendData;
  swapData?: ISwapData;
}

const RouteCard: FC<IRouteCard> = ({
  offer,
  selected,
  chain,
  plrToken,
  formattedToAmount,
  formattedFromAmount,
  networkName,
  provider,
  onSelectOffer,
  disabled = false,
  stakeFeeInfo,
  transactions,
  gasFeeAsset,
  bridgeRoute,
  stakingSteps,
  sendData,
  swapData,
}) => {
  const { t } = useTranslationWithPrefix('plrStaking.validator');
  const { t: tMain } = useTranslationWithPrefix('plrStaking');

  const currency = useFiatCurrency();
  const chainRates = useChainRates(chain);
  const ethRates = useChainRates(CHAIN.ETHEREUM);
  const chainsConfig = useChainsConfig();

  const config = useProviderConfig(provider);

  const transactionsToEstimate = useMemo(() => {
    if (swapData?.swapTransactions) {
      return [...swapData.swapTransactions, ...(swapData?.stakeTransactions ?? [])];
    }

    return transactions;
  }, [transactions, swapData, bridgeRoute]);

  const { feeInfo } = useTransactionsEstimate(chain, transactionsToEstimate, true, gasFeeAsset);

  const feeEtherValueBn = feeInfo?.fee ? BigNumber.from(feeInfo.fee.toString()) : null;
  const stakeFeeEtherValueBn = stakeFeeInfo ? BigNumber.from(stakeFeeInfo.toString()) : null;

  const loadingStakingFee = useMemo(() => {
    if (swapData && feeInfo?.fee) return false;
    else if (!swapData && stakeFeeInfo) return false;

    return true;
  }, [feeInfo, stakeFeeInfo, swapData]);

  const getFiatValue = (value: BigNumber, address: string, isEthereum?: boolean) => {
    if (!value) return null;

    const etherValue = ethers.utils.formatEther(value.toString());
    const valueInFiat = getBalanceInFiat(currency, etherValue, !!isEthereum ? ethRates : chainRates, address);
    return valueInFiat;
  };

  const getTotalGasFees = () => {
    let totalFiatValue = 0;
    if (feeEtherValueBn) totalFiatValue += getFiatValue(feeEtherValueBn, gasFeeAsset.address) || 0;
    if (!swapData && stakeFeeEtherValueBn)
      totalFiatValue += getFiatValue(stakeFeeEtherValueBn, ADDRESS_ZERO, true) || 0;
    return totalFiatValue;
  };

  const appendPlrSymbol = (value: string) => {
    return `${value} ${plrToken?.symbol}`;
  };

  return (
    <RouteWrapper>
      <RouteContainer onPress={() => onSelectOffer?.(offer, feeInfo)} disabled={disabled || !onSelectOffer}>
        <IconWrapper>{plrToken && <TokenIcon url={plrToken?.iconUrl} size={48} chain={plrToken?.chain} />}</IconWrapper>

        <RouteInfoContainer>
          <RouteInfoRow>
            <MainText>{`${formattedToAmount} ${stkPlrToken.symbol}`}</MainText>
            <MainText highlighted>{` ${t('on')} ${networkName}`}</MainText>
          </RouteInfoRow>

          <RouteInfoRow>
            <GasPriceWrapper>
              <SubText>
                <HighlightText>{`${t('estFee')} `}</HighlightText>
                {!loadingStakingFee ? (
                  formatFiatValue(getTotalGasFees(), currency)
                ) : (
                  <EmptyStateWrapper>
                    <Spinner size={10} trackWidth={1} />
                  </EmptyStateWrapper>
                )}
              </SubText>
            </GasPriceWrapper>
            {/* Commented out as we currently don't know where to pull the estimated time from */}
            {/* <SubText> 
              <HighlightText>{t('estTime')}</HighlightText>
              {` 2 mins`}
            </SubText> */}
          </RouteInfoRow>
        </RouteInfoContainer>

        <RadioButtonWrapper>
          <RadioButton type={OFFERS} visible={selected} style={{ marginRight: 0, marginLeft: 12 }} />
        </RadioButtonWrapper>
      </RouteContainer>

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

      {!bridgeRoute && swapData && (
        <RouteBreakdownWrapper>
          <Circle active={stakingSteps?.isSwapped} />

          <RouteBreakdownContainer processing={stakingSteps?.processing} active={stakingSteps?.isSwapping}>
            <IconWrapper>{config && <TokenIcon url={config.iconUrl} size={32} chain={plrToken?.chain} />}</IconWrapper>

            <RouteInfoContainer>
              <RouteInfoRow>
                <MainText>{t('swapVia', { title: config?.title, networkName })}</MainText>
              </RouteInfoRow>

              <RouteInfoRow>
                <MainText>{`${formattedFromAmount} → ${appendPlrSymbol(formattedToAmount)}`}</MainText>
              </RouteInfoRow>
            </RouteInfoContainer>
          </RouteBreakdownContainer>
        </RouteBreakdownWrapper>
      )}

      {bridgeRoute?.steps?.length &&
        bridgeRoute.steps.map((step, i) => {
          if (i > 0) return null;

          // Etherspot SDK typing fails
          // @ts-ignore
          const [{ toolDetails: firstStepViaService }] = step?.includedSteps ?? [];
          const twoDetailsRows = !!(bridgeRoute?.gasCostUSD || step?.estimate?.executionDuration);
          return (
            <RouteBreakdownWrapper>
              <Circle active={stakingSteps?.isBridged} />

              <BridgeRouteContainer processing={stakingSteps?.processing} active={stakingSteps?.isBridging}>
                {/* Etherspot SDK typing fails */}
                {/* @ts-ignore */}
                {step?.includedSteps?.map((includedStep) => {
                  const { action: includedStepAction, toolDetails: includedToolDetails } = includedStep;

                  const fromAssetAmount = ethers.utils.formatUnits(
                    includedStep.estimate.fromAmount,
                    includedStepAction.fromToken.decimals,
                  );
                  const toAssetAmount = ethers.utils.formatUnits(
                    includedStep.estimate.toAmount,
                    includedStepAction.toToken.decimals,
                  );

                  const sourceChain = chainFromChainId[includedStepAction.fromChainId];
                  const destinationChain = chainFromChainId[includedStepAction.toChainId];

                  const { titleShort: sourceNetworkName } = chainsConfig[sourceChain];
                  const { titleShort: destinationNetworkName } = chainsConfig[destinationChain];

                  if (includedStep.type === 'swap') {
                    return (
                      <RouteInfoRow>
                        <IconWrapper>
                          <TokenIcon url={step.toolDetails.logoURI} size={32} chain={sourceChain} />
                        </IconWrapper>
                        <Spacing w={spacing.mediumLarge} />
                        <RouteInfoCol>
                          <SubText>
                            {t('swapVia', { title: includedToolDetails.name, networkName: sourceNetworkName })}
                          </SubText>
                          <SubText>
                            {`${formatAmountDisplay(fromAssetAmount)} ${
                              includedStepAction.fromToken.symbol
                            } → ${formatAmountDisplay(toAssetAmount)} ${includedStepAction.toToken.symbol}`}
                          </SubText>
                        </RouteInfoCol>
                      </RouteInfoRow>
                    );
                  }

                  if (includedStep.type === 'cross') {
                    return (
                      <RouteInfoRow>
                        <IconWrapper>
                          <TokenIcon url={step.toolDetails.logoURI} size={32} />
                        </IconWrapper>
                        <Spacing w={spacing.mediumLarge} />
                        <RouteInfoCol>
                          <SubText>
                            {t('bridgeFrom', {
                              title: includedToolDetails.name,
                              networkName: sourceNetworkName,
                              destinationNetworkName,
                            })}
                          </SubText>
                          <SubText>
                            <HighlightText>{`${t('estFee')} `}</HighlightText>
                            {feeEtherValueBn ? (
                              formatFiatValue(getFiatValue(feeEtherValueBn, ADDRESS_ZERO, true), currency)
                            ) : (
                              <EmptyStateWrapper>
                                <Spinner size={10} trackWidth={1} />
                              </EmptyStateWrapper>
                            )}
                          </SubText>
                        </RouteInfoCol>
                      </RouteInfoRow>
                    );
                  }
                })}
              </BridgeRouteContainer>
            </RouteBreakdownWrapper>
          );
        })}

      <RouteBreakdownWrapper>
        <Circle active={stakingSteps?.isStaked} />

        <RouteBreakdownContainer processing={stakingSteps?.processing} active={stakingSteps?.isStaking}>
          <IconWrapper>
            {plrToken && <TokenIcon url={plrToken?.iconUrl} size={32} chain={plrToken?.chain} />}
          </IconWrapper>

          <RouteInfoContainer>
            <RouteInfoRow>
              <MainText>{t('stakeOn', { formattedAmount: appendPlrSymbol(formattedToAmount), networkName })}</MainText>
            </RouteInfoRow>
            <RouteInfoRow>
              <GasPriceWrapper>
                {swapData ? (
                  <SubText>
                    <HighlightText>{`${t('estFee')} `}</HighlightText>
                    {!loadingStakingFee ? (
                      formatFiatValue(getTotalGasFees(), currency)
                    ) : (
                      <EmptyStateWrapper>
                        <Spinner size={10} trackWidth={1} />
                      </EmptyStateWrapper>
                    )}
                  </SubText>
                ) : (
                  <SubText>
                    <HighlightText>{`${t('estFee')} `}</HighlightText>
                    {!loadingStakingFee ? (
                      formatFiatValue(getFiatValue(stakeFeeEtherValueBn, ADDRESS_ZERO, true), currency)
                    ) : (
                      <EmptyStateWrapper>
                        <Spinner size={10} trackWidth={1} />
                      </EmptyStateWrapper>
                    )}
                  </SubText>
                )}
              </GasPriceWrapper>
            </RouteInfoRow>
          </RouteInfoContainer>
        </RouteBreakdownContainer>
      </RouteBreakdownWrapper>
    </RouteWrapper>
  );
};

export default RouteCard;
// Routes
const RouteWrapper = styled.View`
  flex-direction: column;
`;

const RouteContainer = styled.TouchableOpacity`
  margin: 0 0 8px;
  padding: 10px 10px 12px 16px;
  border-radius: 20px;
  background-color: ${({ theme }) => theme.colors.basic050};

  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

const Circle = styled.View<{ active?: boolean }>`
  height: 10px;
  width: 10px;
  margin-right: 8px;
  background-color: ${({ theme, active }) => (active ? theme.colors.positive : 'rgba(0,0,0,0)')};
  border: 1px ${({ theme }) => theme.colors.basic080} solid;
  border-radius: 10px;
`;

const RouteBreakdownContainer = styled.View<{ active?: boolean; processing?: boolean }>`
  padding: 10px;
  border-radius: 20px;
  background-color: ${({ theme }) => theme.colors.basic050};

  flex: 1;
  display: flex;
  flex-direction: row;
  justify-content: space-between;

  ${({ active, processing }) => processing && `opacity: ${active ? 1 : 0.7};`};
`;

const RouteBreakdownWrapper = styled.View`
  display: flex;
  flex: 1;
  flex-direction: row;
  align-items: center;
  margin: 0 0 8px;
`;

const BridgeRouteContainer = styled.View<{ active?: boolean; processing?: boolean }>`
  padding: 10px;
  border-radius: 20px;
  background-color: ${({ theme }) => theme.colors.basic050};

  flex: 1;
  display: flex;
  flex-direction: column;

  ${({ active, processing }) => processing && `opacity: ${active ? 1 : 0.7};`};
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
  align-items: center;
`;

const RouteInfoCol = styled.View`
  display: flex;
  flex: 1;
  flex-direction: column;
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

const RadioButtonWrapper = styled.View`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const HighlightText = styled(Text)`
  color: ${({ theme }) => theme.colors.plrStakingHighlight};
`;

const EmptyStateWrapper = styled.View`
  justify-content: center;
  align-items: center;
`;
