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

import * as React from 'react';
import { Keyboard } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import { useDispatch } from 'react-redux';
import { useDebounce } from 'use-debounce';
import { maxBy } from 'lodash';
import styled from 'styled-components/native';
import { useTranslation } from 'translations/translate';

// Actions
import { fetchGasThresholds } from 'redux/actions/gas-threshold-actions';

// Configs
import { getPlrAddressForChain } from 'configs/assetsConfig';

// Components
import { Container, Content, Spacing } from 'components/layout/Layout';
import HeaderBlock from 'components/HeaderBlock';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import Icon from 'components/core/Icon';
import Spinner from 'components/Spinner';
import Toast from 'components/Toast';

// Constants
import { CHAIN } from 'constants/chainConstants';
import { EXCHANGE_CONFIRM } from 'constants/navigationConstants';

// Utils
import { useChainConfig } from 'utils/uiConfig';
import { isLogV2AppEvents } from 'utils/environment';
import { nativeAssetPerChain } from 'utils/chains';
import { addressesEqual } from 'utils/assets';
import { appendFeeCaptureTransactionIfNeeded } from 'utils/exchange';
import { getAccountAddress } from 'utils/accounts';
import { hitSlop50w20h } from 'utils/common';

// Actions
import { logEventAction } from 'actions/analyticsActions';

// Types
import type { AssetOption } from 'models/Asset';
import type { ExchangeOffer } from 'models/Exchange';
import type { Chain } from 'models/Chain';

// Selectors
import { useActiveAccount } from 'selectors';

// Local
import FromAssetSelector from './FromAssetSelector';
import ToAssetSelector from './ToAssetSelector';
import OfferCard from './OfferCard';
import { useFromAssets, useToAssets, useOffersQuery, sortOffers } from './utils';

function Exchange() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const activeAccount = useActiveAccount();

  const fromInputRef = React.useRef();

  const initialChain: Chain = navigation.getParam('chain') || CHAIN.ETHEREUM;
  const initialFromAddress: string =
    navigation.getParam('fromAssetAddress') || nativeAssetPerChain[initialChain]?.address;
  const initialToAddress: string = navigation.getParam('toAssetAddress') || getPlrAddressForChain(initialChain);

  const [chain, setChain] = React.useState(initialChain);
  const [fromAddress, setFromAddress] = React.useState(initialFromAddress);
  const [toAddress, setToAddress] = React.useState(initialToAddress);

  const [fromValue, setFromValue] = React.useState(null);
  const [debouncedFromValue]: [string] = useDebounce(fromValue, 500);

  const fromOptions = useFromAssets();
  const toOptions = useToAssets(chain);

  const chainConfig = useChainConfig(chain);

  const fromAsset = React.useMemo(
    () => fromOptions.find((a) => a.chain === chain && addressesEqual(a.address, fromAddress)),
    [fromOptions, fromAddress, chain],
  );

  const toAsset = React.useMemo(
    () => toOptions.find((a) => a.chain === chain && addressesEqual(a.address, toAddress)),
    [toOptions, toAddress, chain],
  );

  const offersQuery = useOffersQuery(chain, fromAsset, toAsset, debouncedFromValue);
  const offers = sortOffers(offersQuery.data);

  React.useEffect(() => {
    dispatch(fetchGasThresholds());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Focus on from amount input after user changes fromAsset
  React.useEffect(() => {
    let isCancelled = false;

    setTimeout(() => {
      if (!isCancelled) fromInputRef.current?.focus();
    }, 650);

    return () => {
      isCancelled = true;
    };
  }, [dispatch, fromAsset]);

  React.useEffect(() => {
    if (isLogV2AppEvents()) {
      dispatch(logEventAction('v2_exchange_pair_selected'));
    }
  }, [dispatch, fromAsset, toAsset]);

  const handleSelectFromAsset = (asset: AssetOption) => {
    setChain(asset.chain);
    setFromAddress(asset.address);
    if (chain !== asset.chain) {
      setToAddress(null);
    }
  };

  const handleSelectToAsset = (asset: AssetOption) => {
    setToAddress(asset.address);
  };

  const handleOfferPress = async (selectedOffer: ExchangeOffer) => {
    if (!activeAccount) {
      // shouldn't happen
      Toast.show({
        message: t('toast.somethingWentWrong'),
        emoji: 'hushed',
        supportLink: true,
        autoClose: false,
      });
      return;
    }

    const offer = await appendFeeCaptureTransactionIfNeeded(selectedOffer, getAccountAddress(activeAccount));
    navigation.navigate(EXCHANGE_CONFIRM, { offer });
  };

  const allowSwap = !!toAsset && fromOptions.some((o) => o.chain === chain && addressesEqual(o.address, toAddress));

  const handleSwapAssets = () => {
    if (!allowSwap) return;

    // Needed to update keyboard accessory view (add/remove 100% option)
    Keyboard.dismiss();
    setFromAddress(toAddress);
    setToAddress(fromAddress);
    setFromValue(null);
  };

  const toValue = maxBy(offers, (offer) => offer.toAmount)?.toAmount.precision(6);
  const customTitle =
    nativeAssetPerChain[CHAIN.ETHEREUM]?.address === fromAddress && chain === CHAIN.ETHEREUM
      ? t('exchangeContent.title.initialExchange')
      : t('exchangeContent.title.exchange', { chain: chainConfig.titleShort });

  const showLoading = offersQuery.isFetching;
  const showEmptyState = !offers?.length && !offersQuery.isIdle && !offersQuery.isFetching;

  return (
    <Container>
      <HeaderBlock
        leftItems={[{ close: true }]}
        centerItems={[{ title: customTitle }]}
        navigation={navigation}
        noPaddingTop
      />

      <Content onScroll={() => Keyboard.dismiss()}>
        <FromAssetSelector
          assets={fromOptions}
          selectedAsset={fromAsset}
          onSelectAsset={handleSelectFromAsset}
          value={fromValue}
          onValueChange={setFromValue}
          editable={!!fromAsset}
          valueInputRef={fromInputRef}
        />

        <TouchableSwapIcon onPress={handleSwapAssets} disabled={!allowSwap} hitSlop={hitSlop50w20h}>
          {toAsset ? <Icon name="arrow-up-down" /> : <Spacing h={24} />}
        </TouchableSwapIcon>

        <ToAssetSelector
          assets={toOptions}
          selectedAsset={toAsset}
          onSelectAsset={handleSelectToAsset}
          value={toValue}
        />

        <Spacing h={40} />

        {showLoading && (
          <EmptyStateWrapper>
            <Spinner />
          </EmptyStateWrapper>
        )}

        {!showLoading &&
          offers?.map((offer) => (
            <OfferCard
              key={offer.provider}
              offer={offer}
              disabled={false}
              isLoading={false}
              onPress={() => handleOfferPress(offer)}
            />
          ))}

        {showEmptyState && (
          <EmptyStateWrapper>
            <EmptyStateParagraph
              title={t('exchangeContent.emptyState.offers.title')}
              bodyText={t('exchangeContent.emptyState.offers.paragraph')}
              large
            />
          </EmptyStateWrapper>
        )}
      </Content>
    </Container>
  );
}

export default Exchange;

const TouchableSwapIcon = styled.TouchableOpacity`
  margin: 8px 0 8px;
  align-self: center;
`;

const EmptyStateWrapper = styled.View`
  justify-content: center;
  align-items: center;
  margin-top: 40px;
`;
