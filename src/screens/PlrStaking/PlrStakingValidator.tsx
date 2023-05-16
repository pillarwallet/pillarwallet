import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ScrollView, Keyboard, Platform } from 'react-native';
import { useTranslationWithPrefix } from 'translations/translate';
import styled from 'styled-components/native';
import { useNavigation } from 'react-navigation-hooks';
import { useDispatch } from 'react-redux';
import { useDebounce } from 'use-debounce';
import { BigNumber } from 'bignumber.js';

// Constants
import { CHAIN } from 'constants/chainConstantsTs';
import { stkPlrToken } from 'constants/plrStakingConstants';

// Types
import type { AssetOption } from 'models/Asset';

// Utils
import { spacing } from 'utils/variables';
import {
  useToAssetsCrossChain,
  useCrossChainBuildTransactionQuery,
  useGasFeeAssets,
} from 'screens/Bridge/Exchange-CrossChain/utils'; // From Cross-chain screen
import { getPlrAddressForChain } from 'configs/assetsConfig';
import { addressesEqual, isNativeAsset } from 'utils/assets';
import { truncateDecimalPlaces } from 'utils/bigNumber';

// Selectors
import { useWalletAssetBalance } from 'selectors/balances';

// Components
import { Container, Content } from 'components/layout/Layout';
import HeaderBlock from 'components/HeaderBlock';
import { Spacing } from 'components/legacy/Layout';
import AssetSelectorModal from 'components/Modals/AssetSelectorModal';
import Button from 'components/core/Button';

// Local
import GasFeeAssetSelect from './GasFeeAssetSelect';
import AssetInput from './AssetInput';
import RouteCard from './RouteCard';

const PlrStakingValidator = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { t, tRoot } = useTranslationWithPrefix('plrStaking.validator');
  const { t: tMain } = useTranslationWithPrefix('plrStaking');

  const token = navigation.getParam('token');
  const chain = navigation.getParam('chain');
  const wallet = navigation.getParam('wallet');
  const balancesWithoutPlr = navigation.getParam('balancesWithoutPlr');

  const gasFeeAssets = useGasFeeAssets(chain);
  const balance = useWalletAssetBalance(token?.chain, token?.address);
  const toOptions = useToAssetsCrossChain(chain);

  const inputRef: any = useRef();
  const stakeRef: any = useRef();

  const [plrToken, setPlrToken] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState(token);
  const [selectedChain, setSelectedChain] = useState(chain);
  const [selectedWallet, setSelectedWallet] = useState(wallet);

  const [gasFeeAsset, setGasFeeAsset] = useState<AssetOption | null>(null);
  const [value, setValue] = useState(null);
  const [debouncedFromValue] = useDebounce(value, 500);

  const [offerData, setOfferData] = useState(null);
  const [feeInfo, setFeeInfo] = useState(null);
  const [failedEstimateOffer, setFailedEstimateOffer] = useState(null);

  useEffect(() => {
    if (!!plrToken || !toOptions) return;
    const ethereumPlrAddress = getPlrAddressForChain(CHAIN.ETHEREUM);
    const asset = toOptions?.find((a) => a.chain === CHAIN.ETHEREUM && addressesEqual(a.address, ethereumPlrAddress));
    if (!!asset) setPlrToken(asset);
  }, [toOptions]);

  const onTokenPress = () => {
    if (!balancesWithoutPlr?.length) return;

    setShowModal(true);
  };

  const onSelectToken = (token) => {
    setValue(null);
    setSelectedToken(token);
    setSelectedChain(token?.chain);
  };

  const onToValueChange = () => {};

  const onExecute = () => {};

  const buildTractionQuery = useCrossChainBuildTransactionQuery(selectedToken, plrToken, debouncedFromValue);
  const buildTransactionData = buildTractionQuery?.data || null;
  const buildTransactionFetched = buildTractionQuery?.isFetched || false;

  const txData = useMemo(() => {
    if (!buildTransactionData || !plrToken) return null;
    const { approvalTransactionData, transactionData } = buildTransactionData;
    if (!approvalTransactionData) return [transactionData];
    return [approvalTransactionData, transactionData];
  }, [buildTransactionData]);

  const offer = useMemo(() => {
    if (!buildTransactionData || !plrToken) return null;
    const {
      provider,
      estimate: { data, toAmount },
    } = buildTransactionData.quote;
    const { fromToken, toToken } = data;

    const decimalValue: any = `10e${toToken?.decimals - 1}`;

    const amount: any = parseInt(toAmount) / (decimalValue ?? 1);

    return {
      provider: provider === 'lifi' ? 'Lifi' : provider,
      chain,
      gasFeeAsset,
      toChain: plrToken.chain,
      transactions: txData,
      fromAsset: fromToken,
      toAsset: toToken,
      fromAmount: value,
      toAmount: new BigNumber(amount),
      exchangeRate: amount,
    };
  }, [buildTransactionData]);

  if (!!offer) console.log('offer', offer.toAmount);

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
            onValueChange={setValue}
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

          {plrToken && (
            <AssetInput
              value={truncateDecimalPlaces(offer?.toAmount, 4)}
              onValueChange={onToValueChange}
              asset={plrToken}
              chain={plrToken.chain}
              walletType={selectedWallet}
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

        {!!offer && (
          <>
            <Spacing h={20} />

            <RouteCard
              key={offer.provider}
              crossChainTxs={txData}
              offer={offer}
              disabled={false}
              isLoading={false}
              gasFeeAsset={gasFeeAsset}
              isSelected={true}
              onFeeInfo={setFeeInfo}
              onEstimateFail={() => {
                setFailedEstimateOffer(true);
              }}
              plrToken={plrToken}
            />
          </>
        )}

        {!!feeInfo && (
          <Button title={'Execute'} onPress={onExecute} size="large" disabled={!selectedWallet || !selectedChain} />
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
