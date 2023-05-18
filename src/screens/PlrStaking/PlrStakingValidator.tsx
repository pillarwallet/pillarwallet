import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslationWithPrefix } from 'translations/translate';
import styled from 'styled-components/native';
import { useNavigation } from 'react-navigation-hooks';
import { useDispatch } from 'react-redux';
import { useDebounce } from 'use-debounce';

// Constants
import { SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';
import { CHAIN } from 'constants/chainConstantsTs';
import { stkPlrToken } from 'constants/plrStakingConstants';
import { TRANSACTION_TYPE } from 'constants/transactionsConstants';

// Types
import type { AssetOption } from 'models/Asset';
import type { TransactionPayload } from 'models/Transaction';

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
import { buildStakingTransactions, validatePlrStakeAmount } from 'utils/plrStakingHelper';
import { mapTransactionsToTransactionPayload, showTransactionRevertedToast } from 'utils/transactions';

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

const PlrStakingValidator = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { t, tRoot } = useTranslationWithPrefix('plrStaking.validator');
  const { t: tMain } = useTranslationWithPrefix('plrStaking');

  const token = navigation.getParam('token');
  const chain = navigation.getParam('chain');
  const wallet = navigation.getParam('wallet');
  const balancesWithoutPlr = navigation.getParam('balancesWithoutPlr');

  const inputRef: any = useRef();
  const stakeRef: any = useRef();

  const [plrToken, setPlrToken] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState(token);
  const [selectedChain, setSelectedChain] = useState(chain);
  const [selectedWallet, setSelectedWallet] = useState(wallet);

  const [gasFeeAsset, setGasFeeAsset] = useState<AssetOption | null>(null);
  const [value, setValue] = useState(null);
  const [debouncedValue] = useDebounce(value, 500);

  const [stkPlrAmount, setStkPlrAmount] = useState(null);
  const [offerData, setOfferData] = useState(null);
  const [feeInfo, setFeeInfo] = useState(null);
  const [showFeeError, setShowFeeError] = useState(false);

  const gasFeeAssets = useGasFeeAssets(selectedChain);
  const balance = useWalletAssetBalance(selectedToken?.chain, selectedToken?.address);
  const toOptions = useToAssetsCrossChain(CHAIN.POLYGON); // Get Ethereum assets for PLR token
  const ethereumPlrAddress = getPlrAddressForChain(CHAIN.ETHEREUM);

  const isBridgeTransaction = selectedToken?.chain !== CHAIN.ETHEREUM;
  const isSwapTransaction = selectedToken?.chain === CHAIN.ETHEREUM && selectedToken?.address !== ethereumPlrAddress;
  const isEthereumPlr = selectedToken?.chain === CHAIN.ETHEREUM && selectedToken?.address === ethereumPlrAddress;

  // Get Bridge offers
  let buildTractionQuery;
  if (isBridgeTransaction) {
    buildTractionQuery = useCrossChainBuildTransactionQuery(selectedToken, plrToken, debouncedValue);
  }
  const buildTransactionData = buildTractionQuery?.data || null;
  const buildTransactionFetched = buildTractionQuery?.isFetched || false;
  console.log('bridgeOffers', buildTransactionData);

  // Get Swap offers
  let offersQuery;
  if (isSwapTransaction) {
    console.log('start query');

    offersQuery = useOffersQuery(chain, selectedToken, plrToken, debouncedValue);
  }
  const swapOffers = sortOffers(offersQuery?.data);
  console.log('isSwap', isSwapTransaction);
  console.log('swapOffers', swapOffers);

  const { errorMessage } = useTransactionFeeCheck(
    chain || CHAIN.ETHEREUM,
    offerData?.feeInfo,
    selectedToken,
    offerData?.fromAmount,
  );

  useEffect(() => {
    if (!!plrToken || !toOptions) return;
    const asset = toOptions?.find((a) => a.chain === CHAIN.ETHEREUM && addressesEqual(a.address, ethereumPlrAddress));
    if (!!asset) setPlrToken(asset);
  }, [toOptions]);

  const resetForm = (resetValue = false) => {
    if (resetValue && !!value) setValue(null);
    if (offerData) setOfferData(null);
    if (stkPlrAmount) setStkPlrAmount(null);
    if (showFeeError) setShowFeeError(false);
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

  const onExecute = () => {
    console.log('attempting execute...');

    if (!feeInfo) {
      showTransactionRevertedToast();
      return;
    }

    console.log('execute 1', offerData);

    if (!isEthereumPlr && !offerData?.transactions) return;

    let transactions = [...offerData.transactions];
    console.log('execute 2', transactions);

    const stakeTransactions = buildStakingTransactions(stkPlrAmount, plrToken);
    console.log('execute 3', stakeTransactions);

    let transactionPayload: TransactionPayload = mapTransactionsToTransactionPayload(chain, transactions);
    transactionPayload = {
      ...transactionPayload,
      offer: !isEthereumPlr
        ? {
            ...offerData,
            feeInfo,
          }
        : null,
      type: TRANSACTION_TYPE.STAKEPLR,
      gasToken: gasFeeAsset,
    };

    navigation.navigate(SEND_TOKEN_PIN_CONFIRM, {
      transactionPayload,
      toAssetSymbol: plrToken.symbol,
      goBackDismiss: true,
      transactionType: TRANSACTION_TYPE.STAKEPLR,
    });
  };

  const showLoading =
    !!value && ((isBridgeTransaction && !buildTransactionFetched) || (isSwapTransaction && !swapOffers));

  const noOffers =
    (isBridgeTransaction && !buildTransactionData && buildTransactionFetched && !!value) ||
    (isSwapTransaction && !swapOffers?.length && !!value);

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
          />

          <Spacing w={spacing.large} />

          {stkPlrToken && (
            <AssetInput
              value={truncateDecimalPlaces(stkPlrAmount, 4)}
              asset={stkPlrToken}
              chain={stkPlrToken.chain}
              walletType={selectedWallet}
              balance={balance}
              maxValue={balance}
              referenceValue={balance}
              referenceDisableMax={true}
              ref={stakeRef}
              disabled={true}
              editable={false}
            />
          )}
        </AssetInputWrapper>

        {gasFeeAssets && value && (
          <>
            <Spacing h={spacing.large} />

            <GasFeeAssetSelect
              assets={gasFeeAssets}
              chain={chain}
              selectAsset={gasFeeAsset}
              onSelectAsset={setGasFeeAsset}
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

        {noOffers && !showLoading && (
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

        {isBridgeTransaction && buildTransactionData && buildTransactionFetched && (
          <BridgeRouteCard
            value={value}
            selectedToken={selectedToken}
            gasFeeAsset={gasFeeAsset}
            plrToken={stkPlrToken}
            buildTransactionData={buildTransactionData}
            buildTransactionFetched={buildTransactionFetched}
            setStkPlrAmount={setStkPlrAmount}
            setOfferData={setOfferData}
            onFeeInfo={setFeeInfo}
            onEstimateFail={() => {
              setShowFeeError(true);
            }}
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
            onFeeInfo={setFeeInfo}
          />
        )}

        {!!offerData && (
          <>
            <Spacing h={30} />
            {!validatePlr() && (
              <>
                <LimitWarningText>
                  {'You need to stake min 10,000 PLR.\nYou can stake up to max 250,000 PLR.'}
                </LimitWarningText>
                <Spacing h={8} />
              </>
            )}

            {validatePlr() && errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}

            <Button
              title={'Execute'}
              onPress={onExecute}
              size="large"
              disabled={!selectedWallet || !selectedChain || !validatePlr() || !!errorMessage}
            />
          </>
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
