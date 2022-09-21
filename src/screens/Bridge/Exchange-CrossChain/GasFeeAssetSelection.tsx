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
import { useTranslation } from 'translations/translate';

// Components
import Text from 'components/core/Text';
import Icon from 'components/core/Icon';
import RadioButton from 'components/RadioButton';
import { Spacing } from 'components/layout/Layout';
import TokenIcon from 'components/display/TokenIcon';

// Utils
import { borderRadiusSizes, fontStyles, spacing } from 'utils/variables';

// Types
import type { Asset, AssetOption } from 'models/Asset';
import type { Chain } from 'models/Chain';

// Local
import { assetTitle } from './utils';

type Props = {
  assets: AssetOption[] | Asset[];
  chain: Chain;
  selectAsset: AssetOption | Asset;
  onSelectAsset: (res: Asset | AssetOption) => void;
};

export default function ({ assets, chain, selectAsset, onSelectAsset }: Props) {
  const { t } = useTranslation();
  const [showAsset, setShowAsset] = React.useState(false);

  React.useEffect(() => {
    onSelectAsset(assets[0]);
  }, [chain]);

  const renderItem = (item, index) => {
    const { iconUrl, symbol } = item;

    return (
      <Container
        style={containerStyle}
        key={'asset__' + index.toString()}
        onPress={() => {
          onSelectAsset(item);
        }}
      >
        <ItemContainer isSelected={selectAsset?.symbol === symbol}>
          <RowContainer>
            <TokenIcon size={24} url={iconUrl} />
            <Title style={left10}>{assetTitle(item)}</Title>
            <Value style={flex}>{''}</Value>
            <RadioButton visible={selectAsset?.symbol === symbol} />
          </RowContainer>
        </ItemContainer>
      </Container>
    );
  };

  return (
    <ContainerView>
      <RowTouchableContainer
        style={{ justifyContent: 'space-between' }}
        onPress={() => {
          setShowAsset(!showAsset);
        }}
      >
        <Title>{t('exchangeContent.gas_fee_asset.title')}</Title>
        {selectAsset && (
          <>
            <TokenIcon size={16} url={selectAsset.iconUrl} style={{ marginHorizontal: 5 }} />
            <Title style={flex}>
              {selectAsset.symbol +
                (selectAsset?.formattedBalanceInFiat
                  ? '  •  ' + selectAsset.formattedBalanceInFiat + ' ' + t('exchangeContent.gas_fee_asset.left')
                  : '')}
            </Title>
          </>
        )}
        <ChainViewIcon name={showAsset ? 'chevron-up' : 'chevron-down'} />
      </RowTouchableContainer>
      {showAsset && (
        <>
          <Spacing h={15} />
          <InfoView>{assets?.map(renderItem)}</InfoView>
        </>
      )}
    </ContainerView>
  );
}

const containerStyle = { marginTop: 3, width: '100%' };
const left10 = { marginLeft: 10 };
const flex = { flex: 1 };

const ContainerView = styled.View`
  background-color: ${({ theme, isSelected }) => theme.colors.basic050};
  margin: 0 ${spacing.layoutSides}px;
  padding: ${spacing.medium}px;
  justify-content: center;
  border-radius: ${borderRadiusSizes.small}px;
`;

const ItemContainer = styled.View`
  width: 100%;
  padding: ${spacing.small}px 0 ${spacing.small}px ${spacing.small}px;
  background-color: ${({ theme, isSelected }) => (isSelected ? theme.colors.basic080 : 'transparent')};
  border-radius: 24;
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

const RowContainer = styled.View`
  align-items: center;
  justify-content: flex-start;
  flex-direction: row;
`;

const RowTouchableContainer = styled.TouchableOpacity`
  align-items: center;
  justify-content: flex-start;
  flex-direction: row;
`;

const Title = styled(Text)`
  flex-direction: row;
  ${fontStyles.regular};
`;

const ChainViewIcon = styled(Icon)`
  height: 24px;
  width: 24px;
  background-color: ${({ theme }) => theme.colors.basic040};
  border-radius: ${borderRadiusSizes.medium}px;
  align-items:center
  justify-content:center
`;

const InfoView = styled.View`
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

const Value = styled(Text)`
  ${fontStyles.medium};
  font-variant: tabular-nums;
`;
