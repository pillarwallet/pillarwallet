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
import styled from 'styled-components/native';
import t from 'translations/translate';
import type { ViewStyleProp } from 'utils/types/react-native';

// components
import BalanceView from 'components/BalanceView';
import { BaseText, MediumText } from 'components/Typography';
import Icon from 'components/Icon';

// selectors
import { useRootSelector } from 'selectors';
import { totalBalanceSelector } from 'selectors/balances';

// utils
import { fontSizes, fontStyles, spacing } from 'utils/variables';


type Props = {
  style?: ViewStyleProp,
  showBalance: boolean,
  toggleBalanceVisibility: () => void,
};


const BalanceWrapper = styled.View`
  width: 100%;
  align-items: center;
  justify-content: center;
`;

const BalanceButton = styled.TouchableOpacity`
  padding: 0 ${spacing.large}px;
`;

const ContentWrapper = styled.View`
  flex-direction: row;
  height: 48px;
  align-items: center;
  justify-content: center;
`;

const ToggleIcon = styled(Icon)`
  font-size: ${fontSizes.medium}px;
  color: ${({ theme }) => theme.colors.basic020};
  margin-left: 6px;
`;

const BalanceText = styled(MediumText)`
  ${fontStyles.big};
`;

const LabelText = styled(BaseText)`
  font-size: ${fontSizes.regular}px;
  margin-bottom: 8px;
`;

const PortfolioBalance = ({
  style,
  showBalance,
  toggleBalanceVisibility,
}: Props) => {
  const totalBalance = useRootSelector(totalBalanceSelector);

  return (
    <BalanceWrapper>
      <LabelText secondary>{t('title.totalBalance')}</LabelText>
      <BalanceButton onPress={toggleBalanceVisibility}>
        <ContentWrapper>
          {!showBalance && <BalanceText secondary>{t('button.viewBalance')}</BalanceText>}
          {!!showBalance && (
            <>
              <BalanceView
                style={style}
                balance={totalBalance}
              />
              {/* different icon name will be passed when !showBalance */}
              <ToggleIcon name="hidden" />
            </>
            )}
        </ContentWrapper>
      </BalanceButton>
    </BalanceWrapper>
  );
};


export default PortfolioBalance;
