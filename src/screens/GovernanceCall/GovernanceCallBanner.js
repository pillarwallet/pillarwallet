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
import { mapFromDocumentDataToString } from 'utils/prismic';
import { formatDate } from 'utils/date';

// Services
import * as Prismic from 'services/prismic';

// assets
const smartWalletIcon = require('assets/icons/smart-wallet-migrate.png');

const TYPE_GOVERNANCE_CALL = 'governance-calls';
const DATE_FORMAT = 'dd.MM';
const TIME_WITH_TIMEZONE_FORMAT = 'HH:mm OOO';

const GovernanceCallBanner = () => {
  const { t } = useTranslationWithPrefix('governanceCall');
  const [title, setTitle] = React.useState(t('banner.title'));
  const [description, setDescription] = React.useState('');
  const [scheduledCallTime, setScheduledCallTime] = React.useState(0);
  const [governanceCallLink, setGovernanceCallLink] = React.useState('');
  const [showPermanently, setShowPermanently] = React.useState(false);

  React.useEffect(() => {
    async function fetchGovernanceCallData() {
      try {
        const data = await Prismic.queryDocumentsByType(TYPE_GOVERNANCE_CALL);
        data?.results?.map((governanceCallData) => {
          const bannerTitleContent = [];
          mapFromDocumentDataToString(governanceCallData?.data?.title, bannerTitleContent);
          setTitle(bannerTitleContent);
          const bannerDescriptionContent = [];
          mapFromDocumentDataToString(governanceCallData?.data?.description, bannerDescriptionContent);
          setDescription(bannerDescriptionContent);
          /* eslint-disable camelcase */
          setScheduledCallTime(governanceCallData?.data?.scheduled_for);
          setGovernanceCallLink(governanceCallData?.data?.link?.url);
          setShowPermanently(governanceCallData?.data?.show_permanently);
        });
      } catch (error) {
        reportErrorLog('Prismic content fetch failed', { error });
      }
    }
    fetchGovernanceCallData();
  }, [scheduledCallTime]);

  const eventEndTime = addHours(new Date(scheduledCallTime), 1);
  const formattedDate = formatDate(new Date(scheduledCallTime), DATE_FORMAT);
  const formattedTimeWithTimezone = formatDate(new Date(scheduledCallTime), TIME_WITH_TIMEZONE_FORMAT);
  const getTotalDays = differenceInDays(new Date(scheduledCallTime), Date.now());
  const getTotalHours = differenceInHours(new Date(scheduledCallTime), Date.now());
  const getTotalMinutes = differenceInMinutes(new Date(scheduledCallTime), Date.now());
  const eventISLive = !isBefore(eventEndTime, Date.now()) && getTotalMinutes <= 0;

  const isBannerShow =
    (showPermanently && isAfter(eventEndTime, Date.now())) || (getTotalHours <= 24 && getTotalHours >= 0);

  if (!isBannerShow) return null;

  const showRequestModal = () => {
    Linking.openURL(governanceCallLink);
  };

  const calculateRemainingTime = () => {
    if (getTotalDays > 0) {
      return `${getTotalDays}d ${getTotalHours}h`;
    } else if (getTotalHours > 0) {
      return `${getTotalHours}h`;
    }
    return `${getTotalMinutes}m`;
  };

  return (
    <TouchableContainer onPress={showRequestModal}>
      <IconImage source={smartWalletIcon} />

      <Column>
        <Title numberOfLines={1}>{title}</Title>
        {!!description && <Description>{description}</Description>}
        {!eventISLive && (<ScheduledCallTime>{`${formattedDate} at ${formattedTimeWithTimezone}`}</ScheduledCallTime>)}
      </Column>
      {eventISLive && (
        <LiveView>
          <LiveText>{t('banner.live')}</LiveText>
          <LiveDot />
        </LiveView>
      )}
      {!eventISLive && (<CallTimeLeft>{calculateRemainingTime()}</CallTimeLeft>)}
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
