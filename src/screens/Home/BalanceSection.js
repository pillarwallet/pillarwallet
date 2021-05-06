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
import { BigNumber } from 'bignumber.js';
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import AddFundsModal from 'components/AddFundsModal';
import Modal from 'components/Modal';
import Text from 'components/modern/Text';
import Tooltip from 'components/Tooltip';

// Selectors
import { useRootSelector, useFiatCurrency, activeAccountAddressSelector } from 'selectors';

// Utils
import { formatFiatValue, formatFiatChangeExtended } from 'utils/format';
import { useThemeColors } from 'utils/themes';
import { spacing } from 'utils/variables';

// Local
import SpecialButton from './components/SpecialButton';


type Props = {|
  balanceInFiat: BigNumber,
  changeInFiat?: ?BigNumber,
|};

function BalanceSection({ balanceInFiat, changeInFiat }: Props) {
  const { t, tRoot } = useTranslationWithPrefix('home.balance');
  const colors = useThemeColors();

  const fiatCurrency = useFiatCurrency();
  const accountAddress = useRootSelector(activeAccountAddressSelector);

  const initialBalance = changeInFiat ? balanceInFiat.minus(changeInFiat) : null;
  const formattedChange = formatFiatChangeExtended(changeInFiat, initialBalance, fiatCurrency);

  const handleAddFunds = React.useCallback(() => {
    Modal.open(() => <AddFundsModal receiveAddress={accountAddress} />);
  }, [accountAddress]);

  const showHint = balanceInFiat.isZero();

  return (
    <Container>
      <FirstColumn>
        <BalanceText numberOfLines={1} adjustsFontSizeToFit>
          {formatFiatValue(balanceInFiat, fiatCurrency)}
        </BalanceText>
        {!!formattedChange && (
          <ProfitContainer>
            <ProfitLabel color={colors.secondaryText}>{t('lastWeek')}</ProfitLabel>
            <ProfitValue color={colors.positive}>{formattedChange}</ProfitValue>
          </ProfitContainer>
        )}
      </FirstColumn>

      <SecondColumn>
        <Tooltip body={t('hint')} isVisible={showHint}>
          <SpecialButton title={tRoot('button.addCash')} iconName="add-cash" onPress={handleAddFunds} />
        </Tooltip>
      </SecondColumn>
    </Container>
  );
}

export default BalanceSection;

const Container = styled.View`
  flex-direction: row;
  justify-content: center;
  padding: 0 ${spacing.layoutSides}px;
`;

const FirstColumn = styled.View`
  flex: 1;
  justify-content: center;
  margin-right: ${spacing.large}px;
`;

const SecondColumn = styled.View`
  justify-content: center;
`;

const BalanceText = styled(Text)`
  font-size: 36px;
  font-variant: tabular-nums;
`;

const ProfitContainer = styled.View`
  flex-direction: row;
  margin-top: ${spacing.extraSmall}px;
`;
const ProfitLabel = styled(Text)`
  margin-right: 6px;
`;

const ProfitValue = styled(Text)`
  font-variant: tabular-nums;
`;
