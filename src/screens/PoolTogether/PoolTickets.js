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
import styled, { withTheme } from 'styled-components/native';
import { format } from 'date-fns';
import t from 'translations/translate';

import { BaseText } from 'components/Typography';
import IconButton from 'components/IconButton';
import Button from 'components/Button';
import { Spacing } from 'components/Layout';

import type { Theme } from 'models/Theme';

import { getThemeColors, themedColors } from 'utils/themes';
import { fontStyles, fontSizes } from 'utils/variables';
import { formatAmount } from 'utils/common';
import { getWinChance } from 'utils/poolTogether';

const PoolTicketsWrapper = styled.View`
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  align-content: center;
`;

const Text = styled(BaseText)`
  ${({ label }) => label ? fontStyles.regular : fontStyles.giant};
  letter-spacing: 0.18px;
  color: ${({ label }) => label ? themedColors.secondaryText : themedColors.text};
`;

const ActionCircleButton = styled(IconButton)`
  height: 24px;
  width: 24px;
  border-radius: 12px;
  justify-content: center;
  align-items: center;
  background: ${themedColors.primary}
  opacity: ${({ active }) => active ? '1' : '0.5'};
`;

const TicketCounterRow = styled.View`
  flex-direction: row;
  justify-content: center;
`;

const TicketCounterColumn = styled.View`
  flex-direction: column;
  justify-content: center;
`;

type Props = {
  maxCount: number,
  currentCount: number,
  totalPoolTicketsCount: number,
  userTickets: number,
  remainingTimeMs: number,
  theme: Theme,
  onTicketCountChange: Function,
  onPressCallback: Function,
};

const PoolTickets = (props: Props) => {
  const {
    maxCount = 0,
    currentCount = 0,
    totalPoolTicketsCount = 0,
    userTickets = 0,
    remainingTimeMs = 0,
    theme,
    onTicketCountChange,
    onPressCallback,
  } = props;

  const colors = getThemeColors(theme);

  const canAdd = currentCount < maxCount;
  const canSubtract = currentCount > 0;

  const winChance = getWinChance(currentCount + userTickets, totalPoolTicketsCount);

  const ticketSubtract = () => {
    return canSubtract && onTicketCountChange(currentCount - 1);
  };

  const ticketAdd = () => {
    return canAdd && onTicketCountChange(currentCount + 1);
  };

  const nextDate = new Date(Date.now() + remainingTimeMs);
  // TODO: localize dates
  const eligibleDate = format(nextDate, 'MMMM D, YYYY'); // eslint-disable-line i18next/no-literal-string

  return (
    <PoolTicketsWrapper
      style={{
        paddingHorizontal: 20,
      }}
    >
      <TicketCounterRow>
        <Text label>{t('poolTogetherContent.label.purchaseTickets')}</Text>
      </TicketCounterRow>
      <Spacing h={16} />
      <TicketCounterRow>
        <TicketCounterColumn>
          {!!canSubtract &&
            <ActionCircleButton
              color={colors.basic070}
              active={canSubtract}
              icon="count-minus"
              fontSize={fontSizes.large}
              onPress={ticketSubtract}
            />
          }
          {!canSubtract && // must rerender like this so it will not stay active before a double action
            <ActionCircleButton
              color={colors.basic070}
              active={canSubtract}
              icon="count-minus"
              fontSize={fontSizes.large}
            />
          }
        </TicketCounterColumn>
        <Spacing w={16} />
        <TicketCounterColumn>
          <Text>{t('poolTogetherContent.label.ownedTickets', { count: currentCount })}</Text>
        </TicketCounterColumn>
        <Spacing w={16} />
        <TicketCounterColumn>
          {!!canAdd &&
            <ActionCircleButton
              color={colors.basic070}
              active={canAdd}
              icon="count-plus"
              fontSize={fontSizes.large}
              onPress={ticketAdd}
            />
          }
          {!canAdd &&
            <ActionCircleButton
              color={colors.basic070}
              active={canAdd}
              icon="count-plus"
              fontSize={fontSizes.large}
            />
          }
        </TicketCounterColumn>
      </TicketCounterRow>
      <TicketCounterRow>
        <Text label>
          {t('poolTogetherContent.label.winningChance', {
            primaryText: t('percentValue', { value: formatAmount(winChance, 6) }),
          })}
        </Text>
      </TicketCounterRow>
      <Spacing h={48} />
      <TicketCounterRow>
        <Button
          title={currentCount > 0 ? t('button.next') : t('poolTogetherContent.button.joinPool')}
          disabled={currentCount === 0}
          onPress={onPressCallback}
          style={{ width: '100%' }}
        />
      </TicketCounterRow>
      <Spacing h={16} />
      <TicketCounterRow>
        <Text center label>
          {t('poolTogetherContent.paragraph.purchasedTicketsEligibleDate', { date: eligibleDate })}
        </Text>
      </TicketCounterRow>
    </PoolTicketsWrapper>
  );
};

export default withTheme(PoolTickets);
