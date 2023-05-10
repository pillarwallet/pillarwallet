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
import React, { useState } from 'react';
import styled from 'styled-components/native';
import { useTranslation } from 'translations/translate';

// Components
import { Spacing } from 'components/legacy/Layout';

// Local
import CategoryListItem from './CategoryListItem';
import TokenAnalyticsListItem from './TokenAnalyticsListItem';

const TokenAnalytics = ({ tokenRate, tokenDetails, marketDetails }) => {
  const { t } = useTranslation();
  const [visibleContent, setVisibleContent] = useState(true);

  return (
    <Container>
      <CategoryListItem
        key={'token-analytics'}
        iconName={'dashboard-liquidity'}
        isFoldOut={visibleContent}
        title={t('button.token_analytics')}
        onPress={() => {
          setVisibleContent(!visibleContent);
        }}
      />
      <Spacing h={7} />
      {visibleContent && (
        <>
          <TokenAnalyticsListItem tokenRate={tokenRate} tokenDetails={tokenDetails} marketDetails={marketDetails} />
        </>
      )}
    </Container>
  );
};

export default TokenAnalytics;

const Container = styled.View`
  width: 90%;
`;
