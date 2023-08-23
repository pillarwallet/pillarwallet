/* eslint-disable i18next/no-literal-string */
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
import { Linking } from 'react-native';
import styled from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';
import {
  parseISO,
  addHours,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  isAfter,
  isBefore,
} from 'date-fns';

// Components
import Image from 'components/Image';
import Text from 'components/core/Text';

// Utils
import { fontStyles, spacing } from 'utils/variables';
import { reportErrorLog } from 'utils/common';
import { formatDate } from 'utils/date';

// Services
import * as Prismic from 'services/prismic';

// assets
const smartWalletIcon = require('assets/icons/smart-wallet-migrate.png');

// local consts
const TYPE_GOVERNANCE_CALL = 'governance-calls';
const DATE_FORMAT = 'do LLL'; // Human readable
const TIME_WITH_TIMEZONE_FORMAT = 'HH:mm O'; // Human readable

const GovernanceCallBanner = () => {
  const { t } = useTranslationWithPrefix('governanceCall');
  const [title, setTitle] = React.useState(t('banner.title'));
  const [description, setDescription] = React.useState('');
  const [governanceCallLink, setGovernanceCallLink] = React.useState('');
  const [timingData, setTimingData] = React.useState({});
  const [remainingTime, setRemainingTime] = React.useState({});
  const [isVisible, setIsVisible] = React.useState(false);
  const interval = React.useRef();

  const calculateLeftOverTime = (startTime) => {
    const thisDateNow = Date.now();
    const daysTillEventStart = differenceInDays(startTime, thisDateNow);
    const hoursTillEventStart = differenceInHours(startTime, thisDateNow);
    const minutesTillEventStart = differenceInMinutes(startTime, thisDateNow);
    return { daysTillEventStart, hoursTillEventStart, minutesTillEventStart };
  };

  const fetchGovernanceCallDataMemoized = React.useCallback(() => {
    Prismic.queryDocumentsByType(TYPE_GOVERNANCE_CALL)
      .then((result) => {
        const thisDateNow = Date.now();
        const prismicResponse = result?.results[0]?.data;
        setTitle(prismicResponse?.title[0]?.text);
        setDescription(prismicResponse?.description[0]?.text);
        setGovernanceCallLink(prismicResponse?.link?.url);
        /* eslint-disable camelcase */
        const governanceCallStartTime = new Date(parseISO(prismicResponse?.scheduled_for));
        const governanceCallEndTime = addHours(governanceCallStartTime, 1);
        const timeTillEventStart = calculateLeftOverTime(governanceCallStartTime);
        setRemainingTime(timeTillEventStart);
        const isEventLive =
          !isBefore(governanceCallEndTime, thisDateNow) && timeTillEventStart.minutesTillEventStart <= 0;

        const formattedDate = formatDate(governanceCallStartTime, DATE_FORMAT);

        const formattedTimeWithTimezone = formatDate(governanceCallStartTime, TIME_WITH_TIMEZONE_FORMAT);

        const calculatedBannerVisibility =
          /* eslint-disable camelcase */
          (prismicResponse?.show_permanently && isAfter(governanceCallEndTime, thisDateNow)) ||
          (timeTillEventStart.hoursTillEventStart <= 24 && timeTillEventStart.hoursTillEventStart >= 0);

        setTimingData({
          governanceCallStartTime,
          governanceCallEndTime,
          formattedDate,
          formattedTimeWithTimezone,
          isEventLive,
        });

        setIsVisible(calculatedBannerVisibility);

        return true;
      })
      .catch((error) => reportErrorLog('Prismic content fetch failed', { error }));
  }, []);

  React.useEffect(() => {
    fetchGovernanceCallDataMemoized();
  }, [fetchGovernanceCallDataMemoized]);

  React.useEffect(() => {
    interval.current = setInterval(() => {
      if (timingData?.governanceCallStartTime) {
        setRemainingTime(calculateLeftOverTime(timingData?.governanceCallStartTime));
      }
    }, 60000);
    return () => clearInterval(interval.current);
  }, [timingData]);

  if (!isVisible) return null;

  const showRequestModal = () => Linking.openURL(governanceCallLink);

  const calculateRemainingTime = () => {
    if (remainingTime.daysTillEventStart > 0) {
      const remainingTotalHours = remainingTime.hoursTillEventStart - (remainingTime.daysTillEventStart * 24);
      return `${remainingTime.daysTillEventStart}d ${remainingTotalHours}h`;
    } else if (remainingTime.hoursTillEventStart > 0) {
      return `${remainingTime.hoursTillEventStart}h`;
    }
    return `${remainingTime.minutesTillEventStart}m`;
  };

  return (
    <TouchableContainer onPress={showRequestModal}>
      <IconImage source={smartWalletIcon} />
      <Column>
        <Title numberOfLines={1}>{title}</Title>
        {!!description && <Description>{description}</Description>}
        {!timingData.isEventLive && (
          <ScheduledCallTime>
            {`${timingData.formattedDate} at ${timingData.formattedTimeWithTimezone}`}
          </ScheduledCallTime>
        )}
      </Column>
      {!!timingData.isEventLive && (
        <LiveView>
          <LiveText>{t('banner.live')}</LiveText>
          <LiveDot />
        </LiveView>
      )}
      {!timingData.isEventLive && <CallTimeLeft>{calculateRemainingTime()}</CallTimeLeft>}
    </TouchableContainer>
  );
};

export default GovernanceCallBanner;

const TouchableContainer = styled.TouchableOpacity`
  flex-direction: row;
  margin: ${spacing.medium / 2}px ${spacing.layoutSides}px;
  padding: ${spacing.large}px;
  background-color: ${({ theme }) => theme.colors.basic050};
  border-radius: 30px;
  shadow-opacity: 0.07;
  shadow-color: #000;
  shadow-offset: 0 6px;
  shadow-radius: 20px;
  elevation: 6;
`;

const IconImage = styled(Image)`
  width: 46px;
  height: 48px;
`;

const Column = styled.View`
  flex: 1;
  margin-left: ${spacing.mediumLarge}px;
`;

const Title = styled(Text)`
  ${fontStyles.medium};
  color: ${({ theme }) => theme.colors.text};
`;

const Description = styled(Text)`
  color: ${({ theme }) => theme.colors.secondaryText};
`;

const ScheduledCallTime = styled(Text)`
  color: ${({ theme }) => theme.colors.secondaryText};
`;

const CallTimeLeft = styled(Text)`
  color: ${({ theme }) => theme.colors.buttonTextTitle};
  alignSelf: center;
`;

const LiveView = styled.View`
  flex-direction: row;
`;

const LiveText = styled(Text)`
  color: ${({ theme }) => theme.colors.negative};
  alignSelf: center;
`;

const LiveDot = styled.View`
  width: 6px;
  height: 6px;
  border-radius: 3px;
  margin-left: 5px;
  background-color: ${({ theme }) => theme.colors.negative};
  alignSelf: center;
`;

