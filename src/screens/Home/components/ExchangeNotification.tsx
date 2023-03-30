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
import React from 'react';
import styled from 'styled-components/native';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

// Components
import Text from 'components/core/Text';

// Utils
import { appFont, fontStyles, spacing } from 'utils/variables';
import { useThemeColors } from 'utils/themes';
import { chainFromChainId } from 'utils/chains';
import { useExchangeAmountsNotification } from 'utils/notifications';

// Services
import etherspotService from 'services/etherspot';

// Actions
import { viewTransactionOnBlockchainAction } from 'actions/historyActions';
import { fetchAllAccountsAssetsBalancesAction } from 'actions/assetsActions';
import { startListeningGetBalancesAction, stopListeningGetBalancesAction } from 'actions/notificationsActions';

// Hooks
import { STATUS, useTimer } from 'hooks/timer';

// Local
import { BottomContainer, CloseButton, NormalIcon, ProgressIcon } from './SendTokenNotification';

export default function ({ data, index }) {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [isVisible, setIsVisible] = React.useState(true);
  const [timerStatus, setTimerStatus] = React.useState(STATUS.STARTED);
  const [hash, setHash] = React.useState(data?.hash);

  const time = useTimer(timerStatus, setTimerStatus);
  const { fromValue, toValue, gasValue } = useExchangeAmountsNotification(data.offer);

  const { fromAmount, toAmount, fromAsset, toAsset } = data.offer;

  React.useEffect(() => {
    if (timerStatus === STATUS.STARTED) {
      dispatch(startListeningGetBalancesAction());
    }
    if (timerStatus === STATUS.STOPPED) {
      setTimeout(() => {
        dispatch(stopListeningGetBalancesAction());
      }, 90 * 1000);
    }
  }, [timerStatus]);

  React.useEffect(() => {
    (async () => {
      if (!hash && data?.batchHash) {
        const submitedBatchHash = await etherspotService.waitForTransactionHashFromSubmittedBatch(
          fromAsset.chain,
          data?.batchHash,
        );
        setHash(submitedBatchHash);
        setTimerStatus(STATUS.STOPPED);
        dispatch(fetchAllAccountsAssetsBalancesAction(true));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const viewOnBlockchain = () => {
    if (!hash) return;
    dispatch(
      viewTransactionOnBlockchainAction(fromAsset.chain, {
        hash,
        batchHash: data?.batchHash,
        fromAddress: fromAsset.address,
      }),
    );
  };

  const onClose = () => {
    setIsVisible(false);
    setTimerStatus(STATUS.STOPPED);
  };

  if (fromAsset?.chainId) {
    fromAsset.chain = chainFromChainId[fromAsset.chainId];
  }
  if (toAsset?.chainId) {
    toAsset.chain = chainFromChainId[toAsset.chainId];
  }

  if (!isVisible || !data?.isSuccess) return null;
  return (
    <TouchableContainer key={index} onPress={viewOnBlockchain} disabled={!hash}>
      <HorizontalContainer>
        <Summary>
          <HorizontalSubContainer>
            <ProgressIcon hash={hash} />
            {hash ? (
              <Title>{t('transactionNotification.you_received')}</Title>
            ) : (
              <Title>
                {t('transactionNotification.selling') + ' ' + fromAmount?.toFixed(4) + ' ' + fromAsset.symbol}
                <NormalIcon nameOrUrl={fromAsset?.logoURI || fromAsset?.iconUrl} isUrl />
                <SubText>{'(' + fromValue + ') ' + t('transactionNotification.on')}</SubText>
                <NormalIcon nameOrUrl={fromAsset.chain} />
              </Title>
            )}
          </HorizontalSubContainer>
          <HorizontalSubContainer>
            <Title style={{ marginLeft: 29 }}>
              {(!hash ? t('transactionNotification.for') + ' ' : '') + toAmount?.toFixed(4) + ' ' + toAsset.symbol}
              <NormalIcon nameOrUrl={toAsset?.logoURI || toAsset?.iconUrl} isUrl />
              <SubText>{'(' + toValue + ') ' + t('transactionNotification.on')}</SubText>
              <NormalIcon nameOrUrl={toAsset.chain} />
            </Title>
          </HorizontalSubContainer>
        </Summary>
        <CloseButton onPress={onClose} colors={colors} />
      </HorizontalContainer>
      <BottomContainer t={t} onPress={viewOnBlockchain} time={time} gasValue={gasValue} colors={colors} />
    </TouchableContainer>
  );
}

const TouchableContainer = styled.TouchableOpacity`
  min-height: 120px;
  background-color: ${({ theme }) => theme.colors.synthetic180};
  border-radius: 16px;
  margin: ${spacing.mediumLarge}px;
`;

const Summary = styled.View`
  padding: 4px;
`;

const HorizontalContainer = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 12px;
  justify-content: space-between;
`;

const HorizontalSubContainer = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 0px 12px 12px 0px;
  justify-content: flex-start;
`;

const Title = styled(Text)`
  ${fontStyles.medium};
  font-family: '${appFont.regular}';
  color: ${({ theme }) => theme.colors.control}; ;
`;

const SubText = styled(Text)`
  font-family: '${appFont.regular}';
  color: ${({ theme }) => theme.colors.control}; ;
`;
