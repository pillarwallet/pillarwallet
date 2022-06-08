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
import styled from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import Text from 'components/core/Text';
import SlideModal from 'components/Modals/SlideModal';
import Icon from 'components/core/Icon';
import { BigNumber } from 'bignumber.js';
import RadioButton from 'components/RadioButton';

// Selectors
import { useFiatCurrency, useRootSelector } from 'selectors';
import { accountTotalBalancesSelector } from 'selectors/totalBalances';

// Utils
import { fontStyles, spacing, appFont, borderRadiusSizes } from 'utils/variables';
import { calculateTotalBalancePerCategory, calculateTotalBalancePerChain } from 'utils/totalBalances';
import { formatFiatValue } from 'utils/format';
import { mapChainToChainId } from 'utils/chains';
import { isLightTheme } from 'utils/themes';
import { type Chain } from 'models/Chain';

// Local
import { useConnectedAppItems } from '../selectors';

type itemType = {|
  key: ?Chain,
  title: ?string,
|};

type Props = {|
  items: ?(itemType[]),
  activeItem: ?itemType,
  updateActiveChain: (?Chain) => void,
  updateActiveItem: (itemType) => void,
  closeModal: () => void,
|};

function SwitchChainModal({ items, activeItem, updateActiveChain, updateActiveItem, closeModal }: Props) {
  const { t } = useTranslationWithPrefix('walletConnect.home');
  const connectedApps = useConnectedAppItems();
  const accountTotalBalances = useRootSelector(accountTotalBalancesSelector);
  const balancePerCategory = calculateTotalBalancePerCategory(accountTotalBalances);
  const balancePerChain = calculateTotalBalancePerChain(accountTotalBalances);
  const fiatCurrency = useFiatCurrency();

  const handleChains = (chain: itemType) => {
    updateActiveItem(chain);
    updateActiveChain(chain?.key);
    closeModal();
    if (chain?.key) {
      const chainId = mapChainToChainId(chain?.key);
      connectedApps.map((item) => {
        const connector = item?.connector;
        if (connector) connector.updateSession({ chainId, accounts: item?.accounts });
        return item;
      });
    }
  };

  const renderChainAddress = (chain: itemType) => {
    const { title, key } = chain;
    let balance;
    if (!chain.key) {
      balance = balancePerCategory.wallet ?? BigNumber(0);
    } else {
      balance = balancePerChain[chain.key] ?? BigNumber(0);
    }
    const formattedBalance = formatFiatValue(balance, fiatCurrency);
    const isSelected = activeItem?.title === title;

    return (
      <Container key={`${key ?? 'all'}`} onPress={() => handleChains(chain)}>
        <ContainerView isSelected={isSelected}>
          <RowContainer>
            <RadioButton visible={isSelected} />
            <ChainViewIcon
              size={24}
              style={IconContainer}
              name={key ?? (isLightTheme() ? 'all-networks-light' : 'all-networks')}
            />
            <Title style={isSelected && { fontFamily: appFont.medium }}>{title}</Title>
            <Value>{formattedBalance}</Value>
          </RowContainer>
        </ContainerView>
      </Container>
    );
  };

  return (
    <SlideModal noPadding noClose showHeader centerTitle title={t('switch-title')}>
      <ContentWrapper forceInset={{ top: 'never', bottom: 'always' }}>
        <InfoView>{items?.map((item) => renderChainAddress(item))}</InfoView>
      </ContentWrapper>
    </SlideModal>
  );
}

export default SwitchChainModal;

const ContentWrapper = styled.View`
  padding: ${spacing.medium}px 0px;
  align-items: center;
`;

const InfoView = styled.View`
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

const ContainerView = styled.View`
  background-color: ${({ theme, isSelected }) => (isSelected ? theme.colors.basic60 : theme.colors.basic050)};
  margin: 8px ${spacing.medium}px;
  padding: 0 ${spacing.large}px 0 ${spacing.mediumLarge}px;
  height: 64px;
  justify-content: center;
  border-radius: ${borderRadiusSizes.medium}px;
  flex-direction: column;
  flex: 1;
`;

const TouchableContainer = styled.TouchableOpacity`
  align-items: center;
  justify-content: center;
`;

const Container = styled(TouchableContainer)`
  background-color: ${({ theme }) => theme.colors.basic050};
  flex-direction: row;
  border-radius: ${borderRadiusSizes.defaultContainer}px;
`;

const Value = styled(Text)`
  ${fontStyles.medium};
  font-variant: tabular-nums;
`;

const RowContainer = styled.View`
  align-items: center;
  justify-content: center;
  flex-direction: row;
  padding: ${spacing.small}px;
`;

const IconContainer = styled.View`
  align-items: center;
  justify-content: center;
`;

const Title = styled(Text)`
  flex: 1;
  flex-direction: row;
  ${fontStyles.big};
  padding: 0 ${spacing.medium}px 0 ${spacing.medium}px;
`;

const ChainViewIcon = styled(Icon)`
  height: 24px;
  width: 24px;
  background-color: ${({ theme }) => theme.colors.basic050};
  border-radius: ${borderRadiusSizes.medium}px;
`;
