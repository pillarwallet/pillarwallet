import React, { useState, useEffect } from 'react';
import { ScrollView, Keyboard, Platform } from 'react-native';
import { useTranslationWithPrefix } from 'translations/translate';
import styled from 'styled-components/native';
import { useNavigation } from 'react-navigation-hooks';
import { useDispatch } from 'react-redux';

// Constants
import { PLR_STAKING_VALIDATOR } from 'constants/navigationConstants';
import {
  MAX_PLR_STAKE_AMOUNT,
  MIN_PLR_STAKE_AMOUNT,
  WalletType,
  plrSupportedChains,
} from 'constants/plrStakingConstants';

// Hooks
import { useStableAssets, useNonStableAssets } from 'hooks/assets';

// Utils
import { fontSizes, fontStyles, spacing } from 'utils/variables';

// Selectors
import { useSupportedChains } from 'selectors/chains';

// Configs
import { getPlrAddressForChain } from 'configs/assetsConfig';
import { useChainsConfig } from 'utils/uiConfig';

// Components
import { Container, Content } from 'components/layout/Layout';
import HeaderBlock from 'components/HeaderBlock';
import Button from 'components/core/Button';
import Text from 'components/core/Text';
import Icon from 'components/core/Icon';
import RadioButton from 'components/RadioButton';
import { Spacing } from 'components/legacy/Layout';
import AssetSelectorModal from 'components/Modals/AssetSelectorModal';

const PlrStaking = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { t, tRoot } = useTranslationWithPrefix('plrStaking');

  const chains: string[] = useSupportedChains();
  const chainsConfig = useChainsConfig();

  const { tokens: stableTokens } = useStableAssets();
  const { tokens: nonStableTokens } = useNonStableAssets();
  const tokens = [...stableTokens, ...nonStableTokens];

  const [balancesWithoutPlr, setBalancesWithoutPlr] = useState(null);
  const [plrBalances, setPlrBalances] = useState(null);
  const [hasEnoughPlr, setHasEnoughPlr] = useState(false);

  const [selectedWallet, setSelectedWallet] = useState(WalletType.ETHERSPOT);
  const [selectedChain, setSelectedChain] = useState(null);

  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const plrAddresses: string[] = [];
    console.log('Chains', chains);
    chains.map((chain) => {
      const plrAddress = getPlrAddressForChain(chain);
      if (!!plrAddress) plrAddresses.push(plrAddress.toLowerCase());
    });

    console.log('plrAddresses', plrAddresses);

    console.log('tokens', tokens);

    const filteredWithoutPlr = tokens.filter(
      (token) =>
        !plrAddresses.includes(token?.address?.toLowerCase()) &&
        plrSupportedChains.includes(token.chain) &&
        token.assetBalance > 0,
    );

    const filteredTokens = tokens
      .filter((token) => plrAddresses.includes(token?.address?.toLowerCase()))
      .sort((a, b) => b?.assetBalance - a?.assetBalance);

    console.log('plrBalances', plrBalances);

    if (!filteredTokens?.length) {
      setHasEnoughPlr(false);
      return;
    }

    setSelectedChain(filteredTokens[0].chain);
    setHasEnoughPlr(filteredTokens[0].assetBalance >= MIN_PLR_STAKE_AMOUNT);
    setPlrBalances(filteredTokens);
    setBalancesWithoutPlr(filteredWithoutPlr);
  }, []);

  const getPlrTotal = () => {
    if (!plrBalances?.length) return 0;

    let total = 0;
    let symbol = '';
    plrBalances.map((bal) => {
      if (!symbol) symbol = bal?.symbol || '';
      total += parseFloat(bal?.assetBalance || 0);
    });

    return `${total.toFixed(2)} ${symbol}`;
  };

  const getPlrFiatTotal = () => {
    if (!plrBalances?.length) return 0;

    let total = 0;
    let symbol = '';
    plrBalances.map((bal) => {
      if (!symbol) symbol = bal?.formattedBalanceInFiat?.substring(0, 1) || '';
      total += parseFloat(bal?.balance?.balanceInFiat || 0);
    });

    return symbol + total.toFixed(2);
  };

  const selectChain = (chain) => {
    const balance = plrBalances.find((bal) => bal.chain === chain);

    if (!balance || balance.assetBalance < MIN_PLR_STAKE_AMOUNT) return;

    setSelectedChain(chain);
  };

  const onSelectToken = (token) => {
    console.log('selected token', token);
    setShowModal(false);
    navigation.navigate(PLR_STAKING_VALIDATOR, {
      token: token,
      chain: token.chain,
      wallet: selectedWallet,
      balancesWithoutPlr: balancesWithoutPlr,
    });
  };

  const onChooseAsset = () => {
    setShowModal(true);
  };

  const onStake = () => {
    const token = plrBalances.find((bl) => bl?.chain === selectedChain);
    if (!token) return;

    navigation.navigate(PLR_STAKING_VALIDATOR, {
      token: token,
      chain: token.chain,
      wallet: selectedWallet,
      balancesWithoutPlr: null,
    });
  };

  return (
    <Container>
      <HeaderBlock
        centerItems={[{ title: t('title') }]}
        leftItems={[{ close: true }]}
        navigation={navigation}
        noPaddingTop
      />
      <Content>
        <InfoText>{t('info')}</InfoText>

        {!!plrBalances?.length && (
          <PlrBalancesWrapper>
            <PlrAvailableText>
              {t('plrAvailable', { chainAmount: plrBalances.length, s: plrBalances.length > 1 ? 's' : '' })}
            </PlrAvailableText>
            <AvailablePlrBox>
              <AvailablePlrTokenWrapper>
                <Icon name="plr32" />
                <PlrTitle>{t('pillar')}</PlrTitle>
              </AvailablePlrTokenWrapper>

              <AvailablePlrBoxTextWrapper>
                <AvailablePlrText>{getPlrTotal()}</AvailablePlrText>
                <AvailablePlrFiatText>{getPlrFiatTotal()}</AvailablePlrFiatText>
              </AvailablePlrBoxTextWrapper>
            </AvailablePlrBox>

            <BalanceSelectWrapper>
              <BalanceItem disabled>
                <BalanceLeftItem>
                  <Icon name="etherspot16" />
                  <BalanceTitle>Etherspot Wallet</BalanceTitle>
                  <Icon name="checkmark-green" />
                </BalanceLeftItem>

                <BalanceRightItem>
                  <BalanceValueText>{getPlrTotal()}</BalanceValueText>
                  <BalanceValueText fiat>{getPlrFiatTotal()}</BalanceValueText>
                </BalanceRightItem>
              </BalanceItem>

              {plrBalances.map((bal) => {
                const { titleShort } = chainsConfig[bal.chain];

                const disabled = bal.assetBalance < MIN_PLR_STAKE_AMOUNT || true;

                return (
                  <BalanceItem onClick={() => selectChain(bal.chain)} disabled={disabled}>
                    <BalanceRightItem>
                      <Spacing w={spacing.large} />
                      <RadioButton visible={bal.chain === selectedChain} disabled={disabled} />
                      <Spacing w={spacing.small} />
                      {/* @ts-ignore */}
                      <Icon name={bal.chain + 16} />
                      <BalanceTitle disabled={disabled}>{titleShort}</BalanceTitle>
                    </BalanceRightItem>

                    <BalanceRightItem>
                      <BalanceValueText disabled={disabled}>
                        {`${parseFloat(bal.assetBalance).toFixed(2)} ${bal.symbol}`}
                      </BalanceValueText>
                      <BalanceValueText fiat disabled={disabled}>
                        {bal.formattedBalanceInFiat}
                      </BalanceValueText>
                    </BalanceRightItem>
                  </BalanceItem>
                );
              })}
            </BalanceSelectWrapper>
          </PlrBalancesWrapper>
        )}

        {!plrBalances?.length || (!hasEnoughPlr && <LimitWarningText>{t('limitWarning')}</LimitWarningText>)}

        <ContinueButtonWrapper>
          {!!hasEnoughPlr && (
            <Button
              title={t('button.stake')}
              onPress={onStake}
              size="large"
              disabled={!selectedWallet || !selectedChain}
            />
          )}

          {!hasEnoughPlr && <Button title={t('button.chooseAsset')} onPress={onChooseAsset} size="large" />}
        </ContinueButtonWrapper>
      </Content>

      <AssetSelectorModal
        visible={showModal}
        onCloseModal={() => setShowModal(false)}
        title={t('chooseAsset')}
        tokens={balancesWithoutPlr}
        onSelectToken={onSelectToken}
      />
    </Container>
  );
};

const InfoText = styled(Text)`
  color: ${({ theme }) => theme.colors.basic010};
  margin-top: ${spacing.mediumLarge}px;
  ${fontStyles.regular};
`;

const LimitWarningText = styled(Text)`
  color: ${({ theme }) => theme.colors.basic000};
  margin-top: 76px;
  text-align: center;
`;

const PlrAvailableText = styled(Text)`
  color: ${({ theme }) => theme.colors.basic000};
`;

const ContinueButtonWrapper = styled.View`
  width: 100%;
  justify-content: space-between;
  margin-top: ${spacing.largePlus}px;
  margin-bottom: ${spacing.small}px;
`;

const PlrBalancesWrapper = styled.View`
  margin-top: ${spacing.large}px;
`;

const AvailablePlrBox = styled.View`
  display: flex;
  flex: 1;
  justify-content: space-between;
  flex-direction: row;

  padding: 10px 16px 12px;
  margin-top: ${spacing.small}px;
  border-radius: 8px;
  ${({ theme }) => `
    background-color: ${theme.colors.plrStaking}
    border: solid 1px ${theme.colors.plrStakingAlt};
  `};
`;

const AvailablePlrBoxTextWrapper = styled.View`
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
`;

const AvailablePlrText = styled(Text)`
  color: ${({ theme }) => theme.colors.link};
  ${fontStyles.medium};
  font-weight: 500;
`;

const AvailablePlrFiatText = styled(Text)`
  color: ${({ theme }) => theme.colors.secondaryText};
  ${fontStyles.medium};
`;

const AvailablePlrTokenWrapper = styled.View`
  display: flex;
  flex: 1;
  justify-content: flex-start;
  align-items: center;
  flex-direction: row;
`;

const PlrTitle = styled(Text)`
  color: ${({ theme }) => theme.colors.link};
  ${fontStyles.medium};
  margin-left: ${spacing.small}px;
`;

const BalanceSelectWrapper = styled.View`
  margin-top: ${spacing.mediumLarge}px;
`;

const BalanceItem = styled.TouchableOpacity.attrs((props: { disabled?: boolean }) => props)`
  margin-bottom: ${spacing.small}px;
  display: flex;
  flex: 1;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;

  ${({ disabled }) => disabled && 'opacity: 0.6;'};
`;

const BalanceLeftItem = styled.View`
  display: flex;
  flex: 1;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
`;

const BalanceRightItem = styled.View`
  display: flex;
  flex: 1;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
`;

const BalanceTitle = styled(Text)`
  color: ${({ theme }) => theme.colors.link};
  ${fontStyles.regular};
  margin: 0 ${spacing.small}px;
`;

const BalanceValueText = styled(Text).attrs((props: { fiat?: boolean }) => props)`
  ${fontStyles.regular};
  color: ${({ theme, fiat }) => (!!fiat ? theme.colors.secondaryText : theme.colors.link)};
  margin-left: ${spacing.small}px;
`;

export default PlrStaking;
