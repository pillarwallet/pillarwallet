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

import React, { useEffect, useState } from 'react';
import { TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

// Components
import Text from 'components/core/Text';
import TokenIcon from 'components/display/TokenIcon';
import Switcher from 'components/Switcher';

// Utils
import { fontStyles, spacing } from 'utils/variables';
import { useChainConfig } from 'utils/uiConfig';
import { isTokenAvailableInList } from 'utils/assets';
import { isProdEnv } from 'utils/environment';

// Selector
import { customTokensListSelector, useRootSelector } from 'selectors';

// Constants
import { ETHERSPOT_POPULAR_MULTICHAIN } from 'constants/assetsConstants';

// Actions
import { manageCustomTokens } from 'actions/assetsActions';

// Types
import type { ViewStyleProp } from 'utils/types/react-native';
import type { Chain } from 'models/Chain';
import type { Asset } from 'models/Asset';

type Props = {
  chain: Chain;
  name: string;
  listType?: list;
  logoURI?: string;
  iconUrl?: string;
  testnetTokens?: number;
  mainnetTokens?: number;
  onPress?: () => void;
  style?: ViewStyleProp;
  isEtherspotPopularMultichain?: boolean;
  rest?: any;
};

type list = 'normal' | 'togglesList' | 'searchList';

function AddTokenListItem({
  chain,
  name,
  logoURI,
  iconUrl,
  onPress,
  style,
  testnetTokens,
  mainnetTokens,
  listType = 'normal',
  isEtherspotPopularMultichain,
  ...rest
}: Props) {
  const { t } = useTranslation();
  const customTokensList = useRootSelector(customTokensListSelector);
  const dispatch = useDispatch();
  const config = useChainConfig(chain);
  const networkName = config?.title;

  const isMainnet = isProdEnv();

  const token: Asset = { chain, name, iconUrl, ...rest };

  const [enableToken, setEnableToken] = useState(isEtherspotPopularMultichain);

  useEffect(() => {
    if (isEtherspotPopularMultichain || listType !== 'togglesList') return;
    setEnableToken(isTokenAvailableInList(customTokensList, token));
  }, [customTokensList]);

  const onChangeToggle = async () => {
    dispatch(manageCustomTokens(token));
  };

  const title =
    listType === 'searchList'
      ? token.symbol
      : name === ETHERSPOT_POPULAR_MULTICHAIN
      ? t('label.pillarDefaultList')
      : name;
  const subTitle =
    listType === 'searchList'
      ? name + t('label.erc20')
      : t('label.symbol_with_network', { network: networkName, symbol: token.symbol });

  return (
    <Container
      accessibilityLabel={`${TAG}-${listType}-token`}
      onPress={onPress}
      disabled={!onPress || listType === 'togglesList'}
      style={style}
      hitSlop={{ top: spacing.medium, bottom: spacing.medium }}
    >
      <TokenIcon url={iconUrl || logoURI} chain={chain} setMarginRight />

      <TitleContainer>
        <NormalText numberOfLines={1}>{title}</NormalText>
        {listType !== 'normal' && <Subtitle numberOfLines={1}>{subTitle}</Subtitle>}
      </TitleContainer>

      {listType === 'togglesList' && (
        <Switcher isOn={enableToken} disabled={isEtherspotPopularMultichain} onToggle={onChangeToggle} />
      )}

      {listType === 'normal' && (
        <NormalText numberOfLines={1}>
          {t('label.number_of_tokens', { tokens: (isMainnet ? mainnetTokens : testnetTokens) || 0 })}
        </NormalText>
      )}
    </Container>
  );
}

const TAG = 'ADD_TOKEN_LIST';

export default AddTokenListItem;

const Container = styled(TouchableOpacity)`
  flex-direction: row;
  align-items: center;
  padding: ${spacing.medium}px ${spacing.large}px;
  min-height: 76px;
`;

const TitleContainer = styled.View`
  flex: 1;
  justify-content: center;
  padding-left: 10px;
`;

const NormalText = styled(Text)`
  ${fontStyles.medium};
`;

const Subtitle = styled(Text)`
  color: ${({ theme }) => theme.colors.secondaryText};
`;
