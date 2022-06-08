import React, { FC, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Text from 'components/core/Text';
import styled from 'styled-components/native';
import { useTranslation } from 'translations/translate';
import { useDispatch } from 'react-redux';

// Components
import SlideModal from 'components/Modals/SlideModal';
import Icon from 'components/core/Icon';
import { Spacing } from 'components/legacy/Layout';

// Actions
import { fetchGasInfoAction } from 'actions/historyActions';

// Utils
import { spacing, fontSizes } from 'utils/variables';
import { useThemeColors } from 'utils/themes';
import { getCurrencySymbol, truncateAddress } from 'utils/common';
import { nativeAssetPerChain } from 'utils/chains';
import { getTxFeeInFiat } from 'utils/transactions';
import { calculateDeploymentFee } from 'utils/deploymentCost';

// Types
import { Contact } from 'models/Contact';
import type { TransactionFeeInfo } from 'models/Transaction';

// Selectors
import { useFiatCurrency, useChainRates, useChainGasInfo } from 'selectors';

// Local
import TxListItem from './TxListItem';
import WarningBlock from './WarningBlock';
import type { Chain } from 'models/Chain';
import BigNumber from 'bignumber.js';

interface ISendHighGasModal {
  value: BigNumber | null;
  contact: Contact | null;
  chain: Chain | null;
  txFeeInfo: TransactionFeeInfo | null;
}

const SendHighGasModal: FC<ISendHighGasModal> = (props) => {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const dispatch = useDispatch();

  let { value, contact, chain, txFeeInfo } = props;

  const chainRates = useChainRates(chain);
  const gasInfo = useChainGasInfo(chain);
  const chainInfo = nativeAssetPerChain[chain];
  const fiatCurrency = useFiatCurrency();
  const currencySymbol = getCurrencySymbol(fiatCurrency);

  useEffect(() => {
    dispatch(fetchGasInfoAction(chain));
  }, [chain, dispatch]);

  const deploymentFee = React.useMemo(() => {
    if (!gasInfo?.gasPrice?.fast) return null;
    return calculateDeploymentFee(chain, chainRates, fiatCurrency, gasInfo);
  }, [gasInfo, chainRates, chain, fiatCurrency]);

  const styles = StyleSheet.create({
    text: {
      fontSize: fontSizes.big,
    },
    subText: {
      fontSize: fontSizes.big,
      color: colors.basic030,
    },
  });

  const TxSending: FC = () => {
    if (!txFeeInfo || !chainRates || !value) return null;

    let sendingInFiat = value.multipliedBy(chainRates[chainInfo.address][fiatCurrency]);
    let fiatDisplayValue = `${currencySymbol}${sendingInFiat.toFixed(2)}`;
    let assetDisplay = `${value} ${chainInfo.symbol}`;

    return (
      <TextRow>
        <Text style={styles.text}>
          {fiatDisplayValue} <Text style={styles.subText}>{assetDisplay}</Text>
        </Text>
      </TextRow>
    );
  };

  const TxTo: FC = () => {
    if (!contact) return null;

    let toDisplay = truncateAddress(contact.ethAddress);
    return <Text style={styles.text}>{toDisplay}</Text>;
  };

  const TxNetwork: FC = () => {
    if (!chainInfo) return null;

    return (
      <TextRow>
        <Icon name={chain} />
        <Spacing w={spacing.small} />
        <Text style={styles.text}>{chainInfo.name}</Text>
      </TextRow>
    );
  };

  const TxFee: FC = () => {
    if (!txFeeInfo) return null;

    const feeInFiat = getTxFeeInFiat(chain, txFeeInfo.fee, txFeeInfo.gasToken, chainRates, fiatCurrency);
    const feeInFiatDisplayValue = `${currencySymbol}${feeInFiat.toFixed(2)}`;
    const labelValue = feeInFiatDisplayValue;

    return <Text style={[styles.text, { color: colors.negative }]}>{labelValue}</Text>;
  };

  const DeployFee: FC = () => {
    const labelValue = deploymentFee?.fiatValue;
    if (!labelValue) return null;

    return <Text style={[styles.text]}>{labelValue}</Text>;
  };

  return (
    <SlideModal noPadding hideHeader>
      <ModalContainer>
        <TxListItem title={t('label.sending')} component={<TxSending />} />
        <TxListItem title={t('label.to')} component={<TxTo />} />
        <TxListItem title={t('label.network')} component={<TxNetwork />} />

        <TxListItem title={t('label.transactionFee')} component={<TxFee />} />
        <WarningBlock
          text={t('transactions.highGasFee.warningLabel')}
          icon={'small-warning'}
          backgroundColor={colors.negative}
          right={10}
        />

        <TxListItem title={t('label.smartWalletDeploy')} component={<DeployFee />} />
        <WarningBlock
          text={t('transactions.highGasFee.deployLabel')}
          textColor={colors.neutral}
          icon={'exclamation-round-light'}
          backgroundColor={colors.swiperButtonThumb}
          right={10}
        />
      </ModalContainer>
    </SlideModal>
  );
};

const ModalContainer = styled.View`
  padding: 0px ${spacing.extraLarge}px ${spacing.extraLarge}px;
`;

const TextRow = styled.View`
  flex-direction: row;
  align-items: center;
`;

export default SendHighGasModal;
