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

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslationWithPrefix } from 'translations/translate';
import styled from 'styled-components/native';
import { useNavigation } from 'react-navigation-hooks';
import { useDebounce } from 'use-debounce';
import { BigNumber, ethers } from 'ethers';

// Constants
import { CHAIN } from 'constants/chainConstantsTs';
import { WalletType, stkPlrToken } from 'constants/plrStakingConstants';
import { TRANSACTION_TYPE } from 'constants/transactionsConstants';
import { HOME } from 'constants/navigationConstants';

// Types
import type { AssetOption } from 'models/Asset';
import type { TransactionPayload } from 'models/Transaction';

// Selectors
import { activeAccountAddressSelector, useActiveAccount } from 'selectors';

// Utils
import { spacing } from 'utils/variables';
import {
  useToAssetsCrossChain,
  useCrossChainBuildTransactionQuery,
  useGasFeeAssets,
  useOffersQuery,
  sortOffers,
} from 'screens/Bridge/Exchange-CrossChain/utils'; // From Cross-chain screen
import { getPlrAddressForChain } from 'configs/assetsConfig';
import { addressesEqual, isNativeAsset } from 'utils/assets';
import { truncateDecimalPlaces } from 'utils/bigNumber';
import {
  buildStakingTransactions,
  estimateTransactions,
  getBalanceForAddress,
  getStakedToken,
  getStakingContractInfo,
  sendTransactions,
  showBalancesReceivedToast,
  showStakedTokensReceivedToast,
  validatePlrStakeAmount,
} from 'utils/plrStakingHelper';
import { mapTransactionsToTransactionPayload, showTransactionRevertedToast } from 'utils/transactions';
import { buildEtherspotTxFeeInfo } from 'utils/etherspot';
import { fontStyles } from 'utils/variables';
import { reportErrorLog } from 'utils/common';
import { isArchanovaAccount, isKeyBasedAccount } from 'utils/accounts';

// Selectors
import { useWalletAssetBalance } from 'selectors/balances';

// Hooks
import { useTransactionFeeCheck } from 'hooks/transactions';

// Components
import { Container, Content } from 'components/layout/Layout';
import HeaderBlock from 'components/HeaderBlock';
import { Spacing } from 'components/legacy/Layout';
import AssetSelectorModal from 'components/Modals/AssetSelectorModal';
import Button from 'components/core/Button';
import Text from 'components/core/Text';
import Spinner from 'components/Spinner';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';

// Local
import GasFeeAssetSelect from './GasFeeAssetSelect';
import AssetInput from './AssetInput';
import BridgeRouteCard from './BridgeRouteCard';
import SwapRouteCard from './SwapRouteCard';
import StakeRouteCard from './StakeRouteCard';
import useInterval from 'hooks/useInterval';

const BALANCE_CHECK_INTERVAL = 5000;

const PlrStakingValidator = () => {
  const navigation = useNavigation();
  const { t, tRoot } = useTranslationWithPrefix('plrStaking.validator');
  const { t: tMain } = useTranslationWithPrefix('plrStaking');

  const token = navigation.getParam('token');
  const chain = navigation.getParam('chain');
  const wallet = navigation.getParam('wallet');
  const balancesWithoutPlr = navigation.getParam('balancesWithoutPlr');

  const activeAccount = useActiveAccount();

  const inputRef: any = useRef();
  const stakeRef: any = useRef();

  const [plrToken, setPlrToken] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState(token);
  const [selectedChain, setSelectedChain] = useState(chain);
  const [selectedWallet, setSelectedWallet] = useState(wallet);
  const [accountType, setAccountType] = useState<WalletType>(null);

  const [gasFeeAsset, setGasFeeAsset] = useState<AssetOption | null>(null);
  const [bridgeGasFeeAsset, setBridgeGasFeeAsset] = useState<AssetOption | null>(null);
  const [value, setValue] = useState(null);
  const [debouncedValue] = useDebounce(value, 500);

  // Form values
  const [stkPlrAmount, setStkPlrAmount] = useState(null);
  const [debouncedStkPlrAmount] = useDebounce(stkPlrAmount, 500);
  const [offerData, setOfferData] = useState(null);
  const [swapFeeInfo, setSwapFeeInfo] = useState(null);
  const [txFeeInfo, setTxFeeInfo] = useState(null);
  const [showFeeError, setShowFeeError] = useState(false);
  const [calculatingGas, setCalculatingGas] = useState(false);

  // Form steps
  const [processing, setProcessing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [isBridging, setIsBridging] = useState(false);
  const [isBridged, setIsBridged] = useState(false);
  const [isStaking, setIsStaking] = useState(false);
  const [isStaked, setIsStaked] = useState(false);

  // Form values
  const [startingPlr, setStartingPlr] = useState(null);
  const [lockedStakingAmount, setLockedStakingAmount] = useState(null);
  const [bridgeTxPayload, setBridgeTxPayload] = useState<TransactionPayload>(null);
  const [stakeTxPayload, setStakeTxPayload] = useState<TransactionPayload>(null);
  const [stakingError, setStakingError] = useState<string>(null);
  const [startingStkPlr, setStartingStkPlr] = useState<BigNumber>(null);

  const ethereumPlrAddress = getPlrAddressForChain(CHAIN.ETHEREUM);
  const gasFeeAssets = useGasFeeAssets(selectedChain);
  const ethereumGasFeeAssets = useGasFeeAssets(CHAIN.ETHEREUM);
  const balance = useWalletAssetBalance(selectedToken?.chain, selectedToken?.address);
  const plrBalance = useWalletAssetBalance(CHAIN.ETHEREUM, ethereumPlrAddress);
  const toOptions = useToAssetsCrossChain(CHAIN.POLYGON); // Get Ethereum assets for PLR token

  const isBridgeTransaction = selectedToken?.chain !== CHAIN.ETHEREUM;
  const isSwapTransaction =
    selectedToken?.chain === CHAIN.ETHEREUM && !addressesEqual(selectedToken?.address, ethereumPlrAddress);
  const isEthereumPlr =
    selectedToken?.chain === CHAIN.ETHEREUM && addressesEqual(selectedToken?.address, ethereumPlrAddress);

  // Get Bridge offers
  let buildTractionQuery;
  buildTractionQuery = useCrossChainBuildTransactionQuery(selectedToken, plrToken, debouncedValue, isBridgeTransaction);
  const buildTransactionData = buildTractionQuery?.data || null;
  const buildTransactionFetched = buildTractionQuery?.isFetched || false;

  // Get Swap offers
  let offersQuery;
  offersQuery = useOffersQuery(selectedChain, selectedToken, plrToken, debouncedValue, isSwapTransaction);
  const swapOffers = sortOffers(offersQuery?.data);

  const { errorMessage: feeErrorMessage } = useTransactionFeeCheck(
    selectedChain || CHAIN.ETHEREUM,
    offerData?.feeInfo,
    selectedToken,
    offerData?.fromAmount,
  );

  useEffect(() => {
    let accountType = WalletType.ETHERSPOT;
    if (isArchanovaAccount(activeAccount)) accountType = WalletType.ARCHANOVA;
    else if (isKeyBasedAccount(activeAccount)) accountType = WalletType.KEYBASED;
    setAccountType(accountType);
  }, [activeAccount]);

  useEffect(() => {
    if (!!plrToken || !toOptions) return;
    const asset = toOptions?.find((a) => a.chain === CHAIN.ETHEREUM && addressesEqual(a.address, ethereumPlrAddress));
    if (!!asset) setPlrToken(asset);
  }, [toOptions]);

  useEffect(() => {
    const getFee = async () => {
      try {
        const { transactions, stakeTransactions } = await buildStakeTransactions();
        const allTransactions = isBridgeTransaction ? [...stakeTransactions] : [...transactions, ...stakeTransactions];
        await getFeeInfo(allTransactions);
      } catch (e) {
        setStakingError(t('stakingFeeError'));
      }
    };

    getFee();
  }, [debouncedStkPlrAmount]);

  useInterval(
    async () => {
      if (!isBridging) return;

      const balance = await getBalanceForAddress(CHAIN.ETHEREUM, ethereumPlrAddress);

      if (!balance) return;

      const bnStartingPlr = ethers.utils.parseUnits(startingPlr.toString());
      const balanceDiff = balance.sub(bnStartingPlr);
      const bnStakingAmount = ethers.utils.parseUnits(stkPlrAmount.toString());

      if (balanceDiff.mul(100).gte(bnStakingAmount.mul(90))) {
        // checking if diff greater than 90% of PLR staked
        setIsBridging(false);
        setIsBridged(true);
        showBalancesReceivedToast(plrToken.symbol, bnStakingAmount);

        submitStakingTransactions();
      }
    },
    isBridging ? BALANCE_CHECK_INTERVAL : null,
  );

  useInterval(
    async () => {
      if (!isStaking) return;

      const stakedToken = await getStakedToken();

      if (!stakedToken) return;

      const startingBalance = startingStkPlr ?? BigNumber.from(0);

      const balance = await getBalanceForAddress(CHAIN.ETHEREUM, stakedToken);
      if (balance.gt(startingBalance)) {
        setIsBridging(false);
        setIsStaking(false);
        setIsStaked(true);
        showStakedTokensReceivedToast('stkPlr', ethers.utils.parseUnits(stkPlrAmount.toString()));
      }
    },
    isStaking ? BALANCE_CHECK_INTERVAL : null,
  );

  const resetExecuteParams = () => {
    if (processing) setProcessing(false);
    if (isSending) setIsSending(false);
    if (isSent) setIsSent(false);
    if (isBridging) setIsBridging(false);
    if (isBridged) setIsBridged(false);
    if (isStaking) setIsStaking(false);
    if (isStaked) setIsStaked(false);
    if (stakeTxPayload) setStakeTxPayload(null);
    if (startingPlr) setStartingPlr(null);
    if (lockedStakingAmount) setLockedStakingAmount(null);
  };

  const resetForm = (resetValue = false) => {
    resetExecuteParams();
    if (resetValue && !!value) setValue(null);
    if (offerData) setOfferData(null);
    if (stkPlrAmount) setStkPlrAmount(null);
    if (showFeeError) setShowFeeError(false);
    if (txFeeInfo) setTxFeeInfo(null);
    if (stakingError) setStakingError(null);
  };

  const onValueChange = (newValue: string) => {
    resetForm();
    setValue(newValue);
    if (isEthereumPlr) setStkPlrAmount(newValue);
  };

  const onTokenPress = () => {
    setShowModal(true);
  };

  const onSelectToken = (token) => {
    resetForm(true);
    setSelectedToken(token);
    setSelectedChain(token?.chain);
  };

  const validatePlr = (): boolean => {
    return validatePlrStakeAmount(stkPlrAmount);
  };

  const buildStakeTransactions = async () => {
    if (!isEthereumPlr && !offerData?.transactions) return;

    let transactions = offerData?.transactions ? [...offerData.transactions] : [];

    const stakeTransactions = await buildStakingTransactions(stkPlrAmount, plrToken);

    if (!stakeTransactions?.transactions || !!stakeTransactions.errorMessage) {
      return;
    }

    return { transactions, stakeTransactions: stakeTransactions.transactions };
  };

  const getFeeInfo = async (transactions: any[]) => {
    setCalculatingGas(true);
    const estimate = await estimateTransactions(transactions, gasFeeAsset);

    if (!estimate?.errorMessage) {
      const feeInfo = await buildEtherspotTxFeeInfo(estimate.estimation);
      if (feeInfo?.fee) setTxFeeInfo(feeInfo.fee);
    } else setTxFeeInfo(null);

    setCalculatingGas(false);
  };

  const submitStakingTransactions = async () => {
    if (!stakeTxPayload) return;

    setProcessing(false);
    const tx = await sendTransactions(selectedChain, stakeTxPayload);

    if (tx) {
      const stakedToken = await getStakedToken();
      const stkPlrBalance = await getBalanceForAddress(CHAIN.ETHEREUM, stakedToken);
      setStartingStkPlr(stkPlrBalance);
      setIsStaking(true);
    }
  };

  const submitTransactions = async () => {
    const { transactions, stakeTransactions } = await buildStakeTransactions();

    if (!stakeTransactions?.length) return;

    resetExecuteParams();
    setProcessing(true);
    setStartingPlr(plrBalance);
    setLockedStakingAmount(stkPlrAmount);

    let transactionPayload: TransactionPayload = null;
    let transactionType;

    if (isBridgeTransaction) {
      // Separate bridge offer txs from staking txs
      setIsBridging(true);

      transactionType = TRANSACTION_TYPE.EXCHANGE;
      transactionPayload = mapTransactionsToTransactionPayload(selectedChain, transactions);
      transactionPayload = {
        ...transactionPayload,
        offer: {
          ...offerData,
          swapFeeInfo,
        },
        type: transactionType,
        gasToken: gasFeeAsset,
      };

      let stakeTransactionPayload = mapTransactionsToTransactionPayload(CHAIN.ETHEREUM, stakeTransactions);
      stakeTransactionPayload = {
        ...stakeTransactionPayload,
        offer: null,
        type: TRANSACTION_TYPE.STAKEPLR,
      };

      setStakeTxPayload(stakeTransactionPayload);
    } else {
      try {
        transactionType = TRANSACTION_TYPE.STAKEPLR;
        const allTransactions = [...transactions, ...stakeTransactions];
        transactionPayload = mapTransactionsToTransactionPayload(CHAIN.ETHEREUM, allTransactions);
        transactionPayload = {
          ...transactionPayload,
          offer: null,
          type: transactionType,
        };
      } catch (e) {
        reportErrorLog('PlrStakingValidator error', e);
        setStakingError(t('stakingBuildError'));
      }
    }

    if (!transactionPayload) return;

    const tx = await sendTransactions(selectedChain, transactionPayload);

    if (!tx) {
      showTransactionRevertedToast();
      setIsBridging(false);
      setIsStaking(false);
      setProcessing(false);
    }

    if (tx && transactionType === TRANSACTION_TYPE.EXCHANGE) {
      setIsBridging(true);
    }

    if (tx && transactionType === TRANSACTION_TYPE.STAKEPLR) {
      const stakedToken = await getStakedToken();
      const stkPlrBalance = await getBalanceForAddress(CHAIN.ETHEREUM, stakedToken);
      setStartingStkPlr(stkPlrBalance);
      setIsStaking(true);
    }
  };

  const onExecute = async () => {
    if (!processing && !isBridging && !isStaking && !validatePlr()) return;

    submitTransactions();
  };

  const onDone = async () => {
    await getStakingContractInfo();

    navigation.navigate(HOME);
  };

  const formButtonText = () => {
    if (processing) return tMain('button.processing');
    else if (!value) return tMain('button.enterAmount');
    else if (!validatePlr()) return tMain('button.insufficientAmount');
    else if (calculatingGas && !txFeeInfo) return tMain('button.calculatingFees');
    else if (value && isBridgeTransaction && !buildTransactionFetched) return tMain('button.fetchingRoutes');
    else if (value && isSwapTransaction && !swapOffers?.length) return tMain('button.fetchingOffers');
    return tMain('button.execute');
  };

  const showLoading =
    !!value && ((isBridgeTransaction && !buildTransactionFetched) || (isSwapTransaction && !swapOffers));

  const noOffers =
    (isBridgeTransaction && !buildTransactionData && buildTransactionFetched && !!value) ||
    (isSwapTransaction && !swapOffers?.length && !!value);

  const showRoute =
    (isEthereumPlr && stkPlrAmount && txFeeInfo) ||
    (isBridgeTransaction && buildTransactionData && buildTransactionFetched && stkPlrAmount && txFeeInfo) ||
    (isSwapTransaction && swapOffers?.length && !!stkPlrAmount && txFeeInfo);

  return (
    <Container>
      <HeaderBlock
        centerItems={[{ title: t('title') }]}
        leftItems={[{ close: true }]}
        navigation={navigation}
        noPaddingTop
      />
      <Content>
        <AssetInputWrapper>
          <AssetInput
            value={value}
            onValueChange={onValueChange}
            asset={selectedToken}
            chain={selectedChain}
            walletType={selectedWallet}
            balance={balance}
            maxValue={balance}
            referenceValue={balance}
            referenceDisableMax={isNativeAsset(selectedToken?.chain, selectedToken?.address)}
            ref={inputRef}
            onTokenPress={onTokenPress}
            disabled={processing || lockedStakingAmount}
          />

          <Spacing w={spacing.large} />

          {stkPlrToken && (
            <AssetInput
              value={truncateDecimalPlaces(stkPlrAmount, 4)}
              asset={plrToken}
              chain={stkPlrToken.chain}
              symbolOverride={stkPlrToken.symbol}
              walletType={selectedWallet}
              referenceDisableMax={true}
              ref={stakeRef}
              disabled={true}
              editable={false}
              to
            />
          )}
        </AssetInputWrapper>

        {gasFeeAssets && isBridgeTransaction && value && (
          <>
            <Spacing h={spacing.large} />

            <GasFeeAssetSelect
              assets={gasFeeAssets}
              chain={chain}
              selectAsset={bridgeGasFeeAsset}
              onSelectAsset={setBridgeGasFeeAsset}
              disabled={processing}
            />
          </>
        )}

        {ethereumGasFeeAssets && value && (
          <>
            <Spacing h={spacing.large} />

            <GasFeeAssetSelect
              assets={ethereumGasFeeAssets}
              chain={CHAIN.ETHEREUM}
              selectAsset={gasFeeAsset}
              onSelectAsset={setGasFeeAsset}
              disabled={processing}
            />
          </>
        )}

        {showLoading && (
          <>
            <Spacing h={48} />

            <EmptyStateWrapper>
              <Spinner size={20} />
            </EmptyStateWrapper>
          </>
        )}

        {noOffers && !isEthereumPlr && !showLoading && (
          <>
            <Spacing h={30} />

            <EmptyStateWrapper>
              <EmptyStateParagraph
                title={tRoot('exchangeContent.emptyState.routes.title')}
                bodyText={tRoot('exchangeContent.emptyState.routes.paragraph')}
                large
              />
            </EmptyStateWrapper>
          </>
        )}

        {showRoute && (
          <>
            <Spacing h={16} />

            <RouteText>Route</RouteText>
          </>
        )}

        {isBridgeTransaction && buildTransactionData && buildTransactionFetched && (
          <BridgeRouteCard
            value={value}
            selectedToken={selectedToken}
            gasFeeAsset={bridgeGasFeeAsset}
            plrToken={stkPlrToken}
            buildTransactionData={buildTransactionData}
            buildTransactionFetched={buildTransactionFetched}
            setStkPlrAmount={setStkPlrAmount}
            setOfferData={setOfferData}
            onFeeInfo={setSwapFeeInfo}
            onEstimateFail={() => {
              setShowFeeError(true);
            }}
            fromChain={selectedChain}
            stakeFeeInfo={txFeeInfo}
            stakeGasFeeAsset={gasFeeAsset}
          />
        )}

        {isSwapTransaction && !!swapOffers && (
          <SwapRouteCard
            value={value}
            selectedToken={selectedToken}
            chain={selectedToken?.chain}
            offers={swapOffers}
            selectedOffer={offerData}
            disabled={false}
            onEstimateFail={() => {
              setShowFeeError(true);
            }}
            gasFeeAsset={gasFeeAsset}
            plrToken={plrToken}
            setOfferData={setOfferData}
            setStkPlrAmount={setStkPlrAmount}
            onFeeInfo={setSwapFeeInfo}
            stakeFeeInfo={txFeeInfo}
            stakeGasFeeAsset={gasFeeAsset}
          />
        )}

        {isEthereumPlr && !!txFeeInfo && (
          <StakeRouteCard
            plrToken={plrToken}
            value={value}
            chain={selectedChain}
            stakeFeeInfo={txFeeInfo}
            stakeGasFeeAsset={gasFeeAsset}
          />
        )}

        <Spacing h={30} />
        {stkPlrAmount && !validatePlr() ? (
          <>
            <LimitWarningText>{t('limitWarning')}</LimitWarningText>
            <Spacing h={8} />
          </>
        ) : feeErrorMessage ? (
          <ErrorMessage>{feeErrorMessage}</ErrorMessage>
        ) : stakingError ? (
          <ErrorMessage>{stakingError}</ErrorMessage>
        ) : null}

        {!isStaked ? (
          <Button
            title={formButtonText()}
            onPress={onExecute}
            size="large"
            disabled={
              !selectedWallet || !selectedChain || !validatePlr() || !!feeErrorMessage || !txFeeInfo || processing
            }
          />
        ) : (
          <Button title={tMain('button.done')} onPress={onDone} size="large" disabled={!isStaked || processing} />
        )}
      </Content>

      <AssetSelectorModal
        visible={showModal}
        onCloseModal={() => setShowModal(false)}
        title={tMain('chooseAsset')}
        tokens={balancesWithoutPlr}
        onSelectToken={onSelectToken}
      />
    </Container>
  );
};

export default PlrStakingValidator;

export const AssetInputWrapper = styled.View`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
`;

const LimitWarningText = styled(Text)`
  color: ${({ theme }) => theme.colors.secondaryAccent240};
  text-align: left;
`;

const EmptyStateWrapper = styled.View`
  justify-content: center;
  align-items: center;
`;

const ErrorMessage = styled(Text)`
  margin-bottom: 15px;
  text-align: center;
  color: ${({ theme }) => theme.colors.negative};
`;

const RouteText = styled(Text)`
  ${fontStyles.big};
  color: ${({ theme }) => theme.colors.basic010};
`;
