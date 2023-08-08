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
import { useAccounts, useActiveAccount } from 'selectors';
import { useWalletAssetBalance } from 'selectors/balances';
import etherspotService from 'services/etherspot';

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
  getBalanceForAddress,
  getStakedToken,
  getStakingContractInfo,
  sendArchanovaTransaction,
  sendTransactions,
  showBalancesReceivedToast,
  showStakedTokensReceivedToast,
  validatePlrStakeAmount,
} from 'utils/plrStakingHelper';
import { mapTransactionsToTransactionPayload, showTransactionRevertedToast } from 'utils/transactions';
import { fontStyles } from 'utils/variables';
import { truncateAmount, reportErrorLog } from 'utils/common';
import {
  isArchanovaAccount,
  isKeyBasedAccount,
  getActiveAccountAddress,
  getEtherspotAccountAddress,
} from 'utils/accounts';
import { formatTokenValue } from 'utils/format';

// Hooks
import { useTransactionFeeCheck } from 'hooks/transactions';
import { useTransactionsEstimate } from 'hooks/transactions';
import useInterval from 'hooks/useInterval';

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
import { ISendData, IStakingSteps } from './RouteCard';

const BALANCE_CHECK_INTERVAL = 5000;

const PlrStakingValidator = () => {
  const navigation = useNavigation();
  const { t, tRoot } = useTranslationWithPrefix('plrStaking.validator');
  const { t: tMain } = useTranslationWithPrefix('plrStaking');

  const token = navigation.getParam('token');
  const chain = navigation.getParam('chain');
  const balancesWithoutPlr = navigation.getParam('balancesWithoutPlr');

  const activeAccount = useActiveAccount();
  const accounts = useAccounts();

  const inputRef: any = useRef();
  const stakeRef: any = useRef();

  const [plrToken, setPlrToken] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState(token);
  const [selectedChain, setSelectedChain] = useState(chain);
  const [accountType, setAccountType] = useState<WalletType>(null);

  const [gasFeeAsset, setGasFeeAsset] = useState<AssetOption | null>(null);
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
  const [isSwapping, setIsSwapping] = useState(false);
  const [isSwapped, setIsSwapped] = useState(false);
  const [isStaking, setIsStaking] = useState(false);
  const [isStaked, setIsStaked] = useState(false);

  // Execute values
  const [startingPlr, setStartingPlr] = useState(null);
  const [lockedStakingAmount, setLockedStakingAmount] = useState(null);
  const [sendTxPayload, setSendTxPayload] = useState<TransactionPayload>(null);
  const [bridgeTxPayload, setBridgeTxPayload] = useState<TransactionPayload>(null);
  const [stakingTransactions, setStakingTransactions] = useState<any[]>(null);
  const [stakeTxPayload, setStakeTxPayload] = useState<TransactionPayload>(null);
  const [stakingError, setStakingError] = useState<string>(null);
  const [startingStkPlr, setStartingStkPlr] = useState<BigNumber>(null);
  const [sendData, setSendData] = useState<ISendData>(null);

  const ethereumPlrAddress = getPlrAddressForChain(CHAIN.ETHEREUM);
  const gasFeeAssets = useGasFeeAssets(selectedChain);
  const ethereumGasFeeAssets = useGasFeeAssets(CHAIN.ETHEREUM);
  const balance = useWalletAssetBalance(selectedToken?.chain, selectedToken?.address);
  const plrBalance = useWalletAssetBalance(CHAIN.ETHEREUM, ethereumPlrAddress);
  const toOptions = useToAssetsCrossChain(CHAIN.POLYGON); // Get Ethereum assets for PLR token

  const isSendTransaction = accountType === WalletType.ARCHANOVA;
  const isBridgeTransaction = selectedToken?.chain !== CHAIN.ETHEREUM && accountType === WalletType.ETHERSPOT;
  const isSwapTransaction =
    selectedToken?.chain === CHAIN.ETHEREUM && !addressesEqual(selectedToken?.address, ethereumPlrAddress);
  const isEthereumPlr =
    selectedToken?.chain === CHAIN.ETHEREUM && addressesEqual(selectedToken?.address, ethereumPlrAddress);

  // Get Bridge offers
  let buildTractionQuery;
  buildTractionQuery = useCrossChainBuildTransactionQuery(selectedToken, plrToken, debouncedValue, isBridgeTransaction);
  const buildTransactionData = buildTractionQuery?.data || null;
  const steps = buildTransactionData?.route?.steps;
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

  // Get Staking Fees
  const { feeInfo: stakingFeeInfo } = useTransactionsEstimate(CHAIN.ETHEREUM, stakingTransactions, true, null);

  useEffect(() => {
    if (!stakingTransactions) return;
    setCalculatingGas(false);

    if (stakingFeeInfo?.fee) {
      setTxFeeInfo(stakingFeeInfo.fee.toString());
      setStakingError(null);
    } else {
      setCalculatingGas(false);
      setStakingError(t('stakingFeeError'));
    }
  }, [stakingFeeInfo]);

  useEffect(() => {
    const getStakingFee = async () => {
      try {
        setCalculatingGas(true);
        const { stakeTransactions } = await buildStakeTransactions();
        setStakingTransactions(stakeTransactions);
      } catch (e) {
        setCalculatingGas(false);
        setStakingError(t('stakingFeeError'));
      }
    };

    const getSendData = () => {
      if (!isSendTransaction || !selectedToken) return;

      const data: ISendData = {
        sourceWallet: accountType,
        formattedValue: `${truncateDecimalPlaces(value.toString(), 0)} ${selectedToken?.symbol}`,
        asset: selectedToken,
        feeInfo: null,
      };

      setSendData(data);
    };

    resetExecuteParams();
    resetGeneratedData();
    getStakingFee();
    getSendData();
  }, [debouncedStkPlrAmount, selectedToken, offerData]);

  // Check if PLR balances have been received
  useInterval(
    async () => {
      if (!isBridging && !isSwapping && !isSending) return;

      const etherspotAddress = getEtherspotAccountAddress(accounts);
      const balance = await getBalanceForAddress(CHAIN.ETHEREUM, ethereumPlrAddress, etherspotAddress);

      if (!balance) return;

      const bnStartingPlr = ethers.utils.parseUnits(startingPlr.toString());
      const balanceDiff = balance.sub(bnStartingPlr);
      const bnStakingAmount = ethers.utils.parseUnits(stkPlrAmount.toString());

      if (balanceDiff.mul(100).gte(bnStakingAmount.mul(90))) {
        // checking if diff greater than 90% of initial PLR balance
        if (isBridging) {
          setIsBridging(false);
          setIsBridged(true);
        } else if (isSwapping) {
          setIsSwapping(false);
          setIsSwapped(true);
        } else if (isSending) {
          setIsSending(false);
          setIsSent(true);
        }

        showBalancesReceivedToast(plrToken.symbol, bnStakingAmount);

        // Staking txs batched with swap already
        if (!isSwapped) submitStakingTransactions();
        else setIsStaking(true);
      }
    },
    isBridging || isSwapping || isSending ? BALANCE_CHECK_INTERVAL : null,
  );

  // Check if staked token has been received
  useInterval(
    async () => {
      if (!isStaking) return;

      const stakedToken = await getStakedToken();

      if (!stakedToken) return;

      const startingBalance = startingStkPlr ?? BigNumber.from(0);

      const balance = await getBalanceForAddress(CHAIN.ETHEREUM, stakedToken);
      const balanceDiff = balance.sub(startingBalance);
      const bnStakingAmount = ethers.utils.parseUnits(stkPlrAmount.toString());

      if (balanceDiff.mul(100).gte(bnStakingAmount.mul(90))) {
        setIsBridging(false);
        setIsSwapping(false);
        setIsSending(false);
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
    if (isStaking) setIsSwapping(false);
    if (isStaked) setIsSwapped(false);
    if (isStaking) setIsStaking(false);
    if (isStaked) setIsStaked(false);
    if (sendTxPayload) setSendTxPayload(null);
    if (bridgeTxPayload) setBridgeTxPayload(null);
    if (stakeTxPayload) setStakeTxPayload(null);
    if (startingPlr) setStartingPlr(null);
    if (lockedStakingAmount) setLockedStakingAmount(null);
  };

  const resetGeneratedData = () => {
    if (stakingTransactions) setStakingTransactions(null);
    if (showFeeError) setShowFeeError(false);
    if (stakingError) setStakingError(null);
    if (txFeeInfo) setTxFeeInfo(null);
    if (sendData) setSendData(null);
  };

  const resetForm = (resetValue = false) => {
    resetExecuteParams();
    resetGeneratedData();
    if (resetValue && !!value) setValue(null);
    if (offerData) setOfferData(null);
    if (stkPlrAmount) setStkPlrAmount(null);
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

  const submitStakingTransactions = async () => {
    if (!stakeTxPayload) return;

    try {
      const stakedToken = await getStakedToken();
      const stkPlrBalance = await getBalanceForAddress(CHAIN.ETHEREUM, stakedToken);
      setStartingStkPlr(stkPlrBalance);

      if (isSwapTransaction) setIsSwapping(true);
      else setIsStaking(true);

      const tx = await sendTransactions(selectedChain, stakeTxPayload);
      if (!tx) {
        showTransactionRevertedToast();
        resetExecuteParams();
      }
    } catch (e) {
      showTransactionRevertedToast();
      reportErrorLog('submitStakingTransactions error)', e);
    }
  };

  const submitTransactions = async () => {
    const { transactions, stakeTransactions } = await buildStakeTransactions();
    setStakingTransactions(stakingTransactions);

    if (!stakeTransactions?.length) return;

    resetExecuteParams();
    setProcessing(true);
    setStartingPlr(plrBalance);
    setLockedStakingAmount(stkPlrAmount);

    let sendTransactionPayload: TransactionPayload = null;
    let bridgeTransactionPayload: TransactionPayload = null;
    let stakeTransactionPayload: TransactionPayload = null;
    let transactionType: TRANSACTION_TYPE = null;

    if (isSendTransaction) {
      transactionType = TRANSACTION_TYPE.SENDTOKEN;
      const etherspotAddress = getEtherspotAccountAddress(accounts);

      sendTransactionPayload = {
        to: etherspotAddress,
        amount: truncateAmount(value.toString(), selectedToken.decimals),
        symbol: selectedToken.symbol,
        contractAddress: selectedToken.address,
        decimals: selectedToken.decimals,
        chain,
        assetData: selectedToken,
        gasToken: gasFeeAsset,
        type: TRANSACTION_TYPE.SENDTOKEN,
      };
    }

    if (isBridgeTransaction) {
      // Separate bridge offer txs from staking txs
      setIsBridging(true);
      if (!transactionType) transactionType = TRANSACTION_TYPE.EXCHANGE;

      bridgeTransactionPayload = mapTransactionsToTransactionPayload(selectedChain, transactions);
      bridgeTransactionPayload = {
        ...bridgeTransactionPayload,
        offer: {
          ...offerData,
          swapFeeInfo,
        },
        type: TRANSACTION_TYPE.EXCHANGE,
        gasToken: gasFeeAsset,
      };

      setBridgeTxPayload(bridgeTransactionPayload);
    }

    try {
      if (!transactionType) transactionType = TRANSACTION_TYPE.STAKEPLR;

      let allTransactions = [...stakeTransactions];
      if (!isBridgeTransaction && !isSendTransaction) allTransactions = [...transactions, ...stakeTransactions];

      stakeTransactionPayload = mapTransactionsToTransactionPayload(CHAIN.ETHEREUM, allTransactions);
      stakeTransactionPayload = {
        ...stakeTransactionPayload,
        offer: null,
        type: TRANSACTION_TYPE.STAKEPLR,
      };

      setStakeTxPayload(stakeTransactionPayload);
    } catch (e) {
      reportErrorLog('PlrStakingValidator error', e);
      setStakingError(t('stakingBuildError'));
    }

    if (
      !stakeTransactionPayload ||
      (isBridgeTransaction && !bridgeTransactionPayload) ||
      (isSendTransaction && !sendTransactionPayload)
    )
      return;

    let tx;
    const stakedToken = await getStakedToken();
    const stkPlrBalance = await getBalanceForAddress(CHAIN.ETHEREUM, stakedToken);
    setStartingStkPlr(stkPlrBalance);

    if (transactionType === TRANSACTION_TYPE.SENDTOKEN) {
      const activeAddress = getActiveAccountAddress(accounts);
      setIsSending(true);
      tx = sendArchanovaTransaction(sendTransactionPayload, activeAddress);
    }

    if (transactionType === TRANSACTION_TYPE.EXCHANGE) {
      setIsBridging(true);
      tx = await sendTransactions(selectedChain, bridgeTransactionPayload);
    }

    if (transactionType === TRANSACTION_TYPE.STAKEPLR) {
      if (isSwapTransaction) setIsSwapping(true);
      else setIsStaking(true);
      tx = await sendTransactions(selectedChain, stakeTransactionPayload);
    }

    if (!tx) {
      showTransactionRevertedToast();
      resetExecuteParams();
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
    (isEthereumPlr && stkPlrAmount && !!txFeeInfo) ||
    (isBridgeTransaction && buildTransactionData && buildTransactionFetched && stkPlrAmount) ||
    (isSwapTransaction && swapOffers?.length && stkPlrAmount);

  const stakingSteps: IStakingSteps = {
    processing,
    isBridging,
    isBridged,
    isSending,
    isSent,
    isSwapping,
    isSwapped,
    isStaking,
    isStaked,
  };

  const formattedFromAmount = formatTokenValue(value ?? 0, selectedToken?.symbol ?? '', { decimalPlaces: 0 }) ?? '';

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
            walletType={accountType}
            balance={balance}
            maxValue={balance}
            referenceValue={balance}
            referenceDisableMax={isNativeAsset(selectedToken?.chain, selectedToken?.address)}
            ref={inputRef}
            onTokenPress={onTokenPress}
            disabled={processing || lockedStakingAmount || isStaked}
          />

          <Spacing w={spacing.large} />

          {stkPlrToken && (
            <AssetInput
              value={truncateDecimalPlaces(stkPlrAmount, 4)}
              asset={plrToken}
              chain={stkPlrToken.chain}
              symbolOverride={stkPlrToken.symbol}
              walletType={accountType === WalletType.KEYBASED ? WalletType.KEYBASED : WalletType.ETHERSPOT}
              referenceDisableMax={true}
              ref={stakeRef}
              disabled={true}
              editable={false}
              to
            />
          )}
        </AssetInputWrapper>

        {value && gasFeeAssets && (
          <>
            <Spacing h={spacing.large} />
            <GasFeeAssetSelect
              assets={gasFeeAssets}
              chain={chain}
              selectAsset={gasFeeAsset}
              onSelectAsset={setGasFeeAsset}
              disabled={processing || isStaked}
            />
          </>
        )}

        {showLoading && (
          <>
            <Spacing h={30} />
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
            gasFeeAsset={gasFeeAsset}
            plrToken={plrToken}
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
            stakingSteps={stakingSteps}
            sendData={sendData}
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
            stakingTransactions={stakingTransactions}
            stakeFeeInfo={txFeeInfo}
            stakingSteps={stakingSteps}
            sendData={sendData}
          />
        )}

        {isEthereumPlr && !!txFeeInfo && (
          <StakeRouteCard
            plrToken={plrToken}
            value={value}
            chain={selectedChain}
            formattedFromAmount={formattedFromAmount}
            stakeFeeInfo={txFeeInfo}
            stakeGasFeeAsset={gasFeeAsset}
            stakingSteps={stakingSteps}
            sendData={sendData}
          />
        )}

        <Spacing h={30} />
        {!validatePlr() ? (
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
            disabled={!accountType || !selectedChain || !validatePlr() || !!feeErrorMessage || !txFeeInfo || processing}
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
