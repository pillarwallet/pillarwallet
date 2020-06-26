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
import moment from 'moment';

import { BaseText } from 'components/Typography';
import IconButton from 'components/IconButton';
import Button from 'components/Button';

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
  ${({ label }) => label ? fontStyles.regular : fontStyles.large};
  letter-spacing: 0.18px;
  color: ${({ label }) => label ? themedColors.secondaryText : themedColors.text};
`;

const ActionCircleButton = styled(IconButton)`
  height: 24px;
  width: 24px;
  border-radius: 12px;
  margin: 0 0 0 10px;
  justify-content: center;
  align-items: center;
  background: ${({ theme }) => theme.colors.activeTabBarIcon};
  opacity: ${({ active }) => active ? '1' : '0.5'};
`;

const TicketCounterRow = styled.View`
  flex-direction: row;
  justify-content: center;
  padding: 8px 0;
`;

const TicketCounterColumn = styled.View`
  flex-direction: column;
  justify-content: center;
  padding: 8px 8px;
`;

type Props = {
  maxCount: number,
  currentCount: number,
  totalPoolTicketsCount: number,
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
    remainingTimeMs = 0,
    theme,
    onTicketCountChange,
    onPressCallback,
  } = props;

  const colors = getThemeColors(theme);

  const canAdd = currentCount < maxCount;
  const canSubtract = currentCount > 0;

  const winChance = getWinChance(currentCount, totalPoolTicketsCount);

  const ticketSubtract = () => {
    return canSubtract && onTicketCountChange(currentCount - 1);
  };

  const ticketAdd = () => {
    return canAdd && onTicketCountChange(currentCount + 1);
  };

  const nextDate = new Date(Date.now() + remainingTimeMs);
  const eligibleDate = moment(nextDate).format('MMMM D, Y');

  return (
    <PoolTicketsWrapper
      style={{
          marginTop: 40,
          paddingHorizontal: 20,
        }}
    >
      <TicketCounterRow>
        <Text label>Purchase tickets for pool</Text>
      </TicketCounterRow>
      <TicketCounterRow style={{ paddingBottom: 0 }}>
        <TicketCounterColumn>
          {!!canSubtract &&
            <ActionCircleButton
              color={colors.control}
              margin={0}
              active={canSubtract}
              icon="count-minus"
              fontSize={fontSizes.large}
              onPress={ticketSubtract}
            />
          }
          {!canSubtract && // must rerender like this so it will not stay active before a double action
            <ActionCircleButton
              color={colors.control}
              margin={0}
              active={canSubtract}
              icon="count-minus"
              fontSize={fontSizes.large}
            />
          }
        </TicketCounterColumn>
        <TicketCounterColumn>
          <Text>{currentCount} Tickets</Text>
        </TicketCounterColumn>
        <TicketCounterColumn>
          {!!canAdd &&
            <ActionCircleButton
              color={colors.control}
              margin={0}
              active={canAdd}
              icon="count-plus"
              fontSize={fontSizes.large}
              onPress={ticketAdd}
            />
          }
          {!canAdd &&
            <ActionCircleButton
              color={colors.control}
              margin={0}
              active={canAdd}
              icon="count-plus"
              fontSize={fontSizes.large}
            />
          }
        </TicketCounterColumn>
      </TicketCounterRow>
      <TicketCounterRow style={{ paddingTop: 0 }}>
        <Text label style={{ color: colors.primary, paddingRight: 4 }}>{formatAmount(winChance, 6)}%</Text>
        <Text label>chance of win</Text>
      </TicketCounterRow>
      <TicketCounterRow style={{ marginTop: 40 }}>
        <Button
          title={currentCount > 0 ? 'Next' : 'Join Pool'}
          disabled={currentCount === 0}
          onPress={onPressCallback}
          style={{ marginBottom: 13, width: '100%' }}
        />
      </TicketCounterRow>
      <TicketCounterRow style={{ paddingTop: 0 }}>
        <Text style={{ textAlign: 'center' }} label>
          Tickets purchased today will be eligible for prizes starting on {eligibleDate}.
        </Text>
      </TicketCounterRow>
    </PoolTicketsWrapper>
  );
};

export default withTheme(PoolTickets);
