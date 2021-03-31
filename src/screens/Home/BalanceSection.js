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
import AddFundsModal from 'components/AddFundsModal';
import Modal from 'components/Modal';
import Text from 'components/modern/Text';

// Selectors
import { useRootSelector, useFiatCurrency, activeAccountAddressSelector } from 'selectors';
import { totalBalanceSelector } from 'selectors/balances';

// Utils
import { formatFiatValue } from 'utils/format';
import { spacing } from 'utils/variables';

// Local
import SpecialButton from './components/SpecialButton';

const addCashIcon = require('assets/icons/icon-24-add-cash.png');

function BalanceSection() {
  const { t } = useTranslationWithPrefix('home.balance');

  const accountAddress = useRootSelector(activeAccountAddressSelector);
  const totalBalance = useRootSelector(totalBalanceSelector);
  const fiatCurrency = useFiatCurrency();

  // TODO: show propper value when service is available
  // eslint-disable-next-line i18next/no-literal-string
  const formattedPerformance = '+0%';

  const handleAddFunds = React.useCallback(() => {
    Modal.open(() => <AddFundsModal receiveAddress={accountAddress} />);
  }, [accountAddress]);

  return (
    <Container>
      <FirstColumn>
        <BalanceText>{formatFiatValue(totalBalance, fiatCurrency)}</BalanceText>
        <PerformanceContainer>
          <PerformanceLabel color="secondaryText">{t('lastWeek')}</PerformanceLabel>
          <Text color="positive">{formattedPerformance}</Text>
        </PerformanceContainer>
      </FirstColumn>

      <SecondColumn>
        <SpecialButton title={t('addCash')} iconSource={addCashIcon} onPress={handleAddFunds} />
      </SecondColumn>
    </Container>
  );
}

export default BalanceSection;

const Container = styled.View`
  flex-direction: row;
  justify-content: center;
  padding: 10px 0;
`;

const FirstColumn = styled.View`
  flex: 1;
  justify-content: center;
`;

const SecondColumn = styled.View`
  justify-content: center;
`;

const BalanceText = styled(Text)`
  font-size: 36px;
  font-variant: tabular-nums;
`;

const PerformanceContainer = styled.View`
  flex-direction: row;
  margin-top: ${spacing.extraSmall}px;
`;
const PerformanceLabel = styled(Text)`
  margin-right: 6px;
`;
