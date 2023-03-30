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
import Icon from 'components/core/Icon';
import Text from 'components/core/Text';
import TokenIcon from 'components/display/TokenIcon';

// Utils
import { appFont, fontStyles, spacing } from 'utils/variables';
import { useThemeColors } from 'utils/themes';
import { useSendTransactionNotification } from 'utils/notifications';

// Services
import etherspotService from 'services/etherspot';

// Actions
import { viewTransactionOnBlockchainAction } from 'actions/historyActions';
import { fetchAllAccountsAssetsBalancesAction } from 'actions/assetsActions';
import { startListeningGetBalancesAction, stopListeningGetBalancesAction } from 'actions/notificationsActions';

// Constants
import { TRANSACTION_TYPE } from 'constants/transactionsConstants';

// Hooks
import { STATUS, useTimer } from 'hooks/timer';

export default function ({ data, index }) {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [isVisible, setIsVisible] = React.useState(true);
  const [timerStatus, setTimerStatus] = React.useState(STATUS.STARTED);
  const [hash, setHash] = React.useState(data?.hash);

  const { value, gasValue } = useSendTransactionNotification(data);
  const time = useTimer(timerStatus, setTimerStatus);

  const { contractAddress, to, assetData, amount, chain, batchHash, type } = data;

  React.useEffect(() => {
    if (timerStatus === STATUS.STARTED) {
      dispatch(startListeningGetBalancesAction());
      setTimeout(() => {
        dispatch(stopListeningGetBalancesAction());
      }, 1000 * 60);
    }
  }, [timerStatus]);

  React.useEffect(() => {
    (async () => {
      if (!hash && batchHash) {
        const submitedBatchHash = await etherspotService.waitForTransactionHashFromSubmittedBatch(chain, batchHash);
        setHash(submitedBatchHash);
        setTimerStatus(STATUS.STOPPED);
        dispatch(fetchAllAccountsAssetsBalancesAction(true));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isVisible || !data?.isSuccess) return null;

  const viewOnBlockchain = () => {
    if (!hash) return;
    dispatch(
      viewTransactionOnBlockchainAction(chain, {
        hash,
        batchHash: batchHash,
        fromAddress: contractAddress,
      }),
    );
  };

  const onClose = () => {
    setIsVisible(false);
    setTimerStatus(STATUS.STOPPED);
  };

  const NormalTitle = () => {
    if (type === TRANSACTION_TYPE.SENDTOKEN) {
      return (
        <Title>
          {t('transactionNotification.sending') + ' ' + amount + ' ' + data.symbol}
          <NormalIcon nameOrUrl={assetData?.iconUrl} isUrl />
          <SubText>{'(' + value + ') ' + t('transactionNotification.on')}</SubText>
          <NormalIcon nameOrUrl={chain} />
        </Title>
      );
    }
    return (
      <Title>
        {t('transactionNotification.sending') + ' ' + value}
        <SubText>{' ' + t('transactionNotification.on')}</SubText>
        <NormalIcon nameOrUrl={chain} />
      </Title>
    );
  };

  return (
    <TouchableContainer key={index} onPress={viewOnBlockchain} disabled={!hash}>
      <HorizontalContainer>
        <Summary>
          <HorizontalSubContainer style={{ paddingBottom: 5 }}>
            <ProgressIcon hash={hash} />
            {hash ? <Title>{t('transactionNotification.you_sent')}</Title> : <NormalTitle />}
          </HorizontalSubContainer>
          <HorizontalSubContainer>
            <Title numberOfLines={1} style={{ marginLeft: 29 }}>
              {t('transactionNotification.to') + ' '}
              <SubText>
                {to?.slice(0, 10)}...{to?.slice(32, 42)}
              </SubText>
            </Title>
          </HorizontalSubContainer>
        </Summary>
        <CloseButton onPress={onClose} colors={colors} />
      </HorizontalContainer>
      <BottomContainer t={t} onPress={viewOnBlockchain} time={time} gasValue={gasValue} colors={colors} />
    </TouchableContainer>
  );
}

type IconProps = {
  nameOrUrl: any;
  isUrl?: boolean;
};

export const NormalIcon = ({ nameOrUrl, isUrl }: IconProps) =>
  isUrl ? (
    <TokenIcon url={nameOrUrl} size={18} style={{ paddingHorizontal: 7, paddingTop: 5 }} />
  ) : (
    <Icon name={nameOrUrl} width={18} height={18} style={{ paddingHorizontal: 7, paddingTop: 5 }} />
  );

export const BottomContainer = ({ onPress, t, time, gasValue, colors }) => (
  <>
    <Line />
    <HorizontalContainer>
      <SubText style={{ width: '30%' }}>{t('transactionNotification.time') + ': ' + time}</SubText>
      <SubText style={{ flex: 1 }}>{t('transactionNotification.gas') + ': ' + gasValue}</SubText>
      <ButtonContainer onPress={onPress}>
        <Icon color={colors.control} name={'info'} width={24} height={24} />
      </ButtonContainer>
    </HorizontalContainer>
  </>
);

export const CloseButton = ({ colors, onPress }) => (
  <ButtonContainer onPress={onPress}>
    <Icon color={colors.control} name={'close'} width={30} height={30} />
  </ButtonContainer>
);

export const ProgressIcon = ({ hash }) => (
  <Icon name={hash ? 'checkmark-circle' : 'pending-process'} width={24} height={24} style={{ paddingRight: 5 }} />
);

const TouchableContainer = styled.TouchableOpacity`
  min-height: 120px;
  background-color: ${({ theme }) => theme.colors.synthetic180};
  border-radius: 16px;
  margin: ${spacing.mediumLarge}px;
`;

const ButtonContainer = styled.TouchableOpacity`
  align-self: flex-start;
`;

const Summary = styled.View`
  padding: 4px;
`;

const Line = styled.View`
  width: 100%;
  height: 1;
  background-color: ${({ theme }) => theme.colors.background};
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
