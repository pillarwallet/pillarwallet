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

import * as React from 'react';
import { useNavigation } from 'react-navigation-hooks';
import { useTranslation } from 'translations/translate';
import styled from 'styled-components/native';

// Components
import { Container } from 'components/layout/Layout';
import HeaderBlock from 'components/HeaderBlock';
import ChainSelectorContent from 'components/ChainSelector/ChainSelectorContent';
import SearchBar from 'components/SearchBar';
import Icon from 'components/core/Icon';
import Checkbox from 'components/legacy/Checkbox';
import Button from 'components/core/Button';

// Utils
import { fontSizes, fontStyles } from 'utils/variables';
import { useThemeColors } from 'utils/themes';

export default function () {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const colors = useThemeColors();

  const [selectedChain, setSelectedChain] = React.useState(null);
  const [query, setQuery] = React.useState('');
  const [hasAgreedToTerms, setHasAgreedToTerms] = React.useState(false);

  return (
    <Container>
      <HeaderBlock navigation={navigation} centerItems={[{ title: t('label.manageTokenLists') }]} noPaddingTop />
      <ChainSelectorContent selectedAssetChain={selectedChain} onSelectChain={setSelectedChain} />

      <SearchBar
        accessibilityHint="manage_token_search_bar"
        inputStyle={{ fontSize: fontSizes.big }}
        style={{ width: '100%' }}
        query={query}
        onQueryChange={setQuery}
        placeholder={t('label.find_token')}
      />

      <SubContainer>
        <WarningContainer>
          <Icon name="small-warning" color={colors.helpIcon} />
          <WarningText>{t('paragraph.tokenNotListedWarning')}</WarningText>
        </WarningContainer>

        <Checkbox
          onPress={() => {
            setHasAgreedToTerms(!hasAgreedToTerms);
          }}
          small
          lightText
          checked={hasAgreedToTerms}
          wrapperStyle={{ marginVertical: 16 }}
        >
          {t('paragraph.importTokenPermission')}
        </Checkbox>

        <Button title={t('label.importCustomToken')} onPress={() => {}} disabled={!hasAgreedToTerms} />
      </SubContainer>
    </Container>
  );
}

const WarningContainer = styled.View`
  margin: 24px 0px 18px;
  padding: 12px 62px 12px 16px;
  border-radius: 16px;
  flex-direction: row;
  align-items: center;
  border: ${({ theme }) => theme.colors.helpIcon};
`;

const WarningText = styled.Text`
  ${fontStyles.small}
  margin: 0 0 0 20px;
  color: ${({ theme }) => theme.colors.helpIcon};
`;

const SubContainer = styled.View`
  margin-horizontal: 20px;
`;
