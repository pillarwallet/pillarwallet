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

/* eslint-disable no-use-before-define */

import * as React from 'react';
import { FlatList, Keyboard, ScrollView } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import { useDispatch } from 'react-redux';
import styled, { withTheme } from 'styled-components/native';
import isEmpty from 'lodash.isempty';
import Intercom from 'react-native-intercom';
import t from 'translations/translate';

// Actions
import { fetchPhoneContactsAction } from 'actions/phoneContactsActions';
import { fetchSentReferralInvitationsAction, sendReferralInvitationsAction } from 'actions/referralsActions';

// Components
import { Wrapper } from 'components/Layout';
import { BaseText } from 'components/Typography';
import Button from 'components/Button';
import Checkbox from 'components/Checkbox';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import MissingInfoNote from 'screens/ReferFriends/MissingInfoNote';
import SearchBlock from 'components/SearchBlock';
import Spinner from 'components/Spinner';
import Toast from 'components/Toast';

// Contstants
import { ADD_EDIT_USER } from 'constants/navigationConstants';
import { ALLOWED_DAILY_INVITES } from 'constants/referralsConstants';

// Selectors
import { useRootSelector } from 'selectors';

// Utils
import {
  getRemainingDailyInvitations,
  isSameContact,
  isSameContactData,
  filterAllowedContacts,
  searchContacts,
} from 'utils/referrals';
import { spacing } from 'utils/variables';
import { isValidPhone, isValidEmail } from 'utils/validators';

// Types
import type { ReferralContact } from 'reducers/referralsReducer';


const MIN_QUERY_LENGTH = 3;

const ReferralContacts = () => {
  const navigation = useNavigation();

  const [query, setQuery] = React.useState('');
  const [selectedContacts, setSelectedContacts] = React.useState([]);

  const dispatch = useDispatch();
  const {
    isEmailVerified,
    isPhoneVerified,
    phone: userPhone,
    email: userEmail,
  } = useRootSelector(root => root.user.data);
  const {
    alreadyInvitedContacts,
    sentInvitationsCount,
    isPillarRewardCampaignActive,
    isSendingInvite,
  } = useRootSelector(root => root.referrals);
  const {
    data: phoneContacts,
    isFetching: isFetchingPhoneContacts,
    isFetchComplete: isFetchingPhoneContactsComplete,
    fetchError: phoneContactsFetchError,
  } = useRootSelector(root => root.phoneContacts);

  React.useEffect(() => {
    dispatch(fetchSentReferralInvitationsAction());

    if (!isFetchingPhoneContacts && !isFetchingPhoneContactsComplete) {
      dispatch(fetchPhoneContactsAction());
    }
  }, []);

  const sendInvites = () => {
    dispatch(sendReferralInvitationsAction(selectedContacts));
  };

  const renderContact = ({ item }: { item: ReferralContact }, canInvite: boolean) => {
    const isPreviouslyInvited = alreadyInvitedContacts.some((contact) => isSameContact(item, contact));

    const isSelected = selectedContacts.some(({ id }) => id === item.id) || isPreviouslyInvited;
    const canSelect = canInvite && !isPreviouslyInvited;

    return (
      <ListItemWithImage
        label={item.name}
        subtext={item.email || item.phone}
        itemImageUrl={item.photo}
        onPress={canSelect ? () => toggleContact(item) : null}
        wrapperOpacity={canSelect ? 1 : 0.5}
        customAddon={
          <Checkbox
            checked={isSelected}
            onPress={() => toggleContact(item)}
            disabled={!canSelect}
            rounded
            wrapperStyle={{ width: 24, marginRight: 4, marginLeft: 12 }}
            positive
          />
        }
        noSeparator
      />
    );
  };

  const toggleContact = (contact: ReferralContact) => {
    const { id: relatedContactId, phone } = contact;
    const updatedSelectedContacts = selectedContacts.filter(({ id }) => id !== relatedContactId);

    if (!selectedContacts.find(({ id }) => id === relatedContactId)) {
      const availableInvites = getRemainingDailyInvitations(sentInvitationsCount) - selectedContacts.length;

      if (isSameContactData(contact, userEmail, userPhone)) {
        Toast.show({
          message: t('toast.cantInviteYourself'),
          emoji: 'point_up',
        });
        return;
      }

      if (!!phone && !isValidPhone(phone)) {
        Toast.show({
          message: t('toast.invalidPhoneNumber'),
          emoji: 'point_up',
        });
        return;
      }

      if (!availableInvites) {
        Toast.show({
          message: t('toast.dailyInvitationsLimitReached', {
            remainingDailyInvitations: getRemainingDailyInvitations(sentInvitationsCount),
            allowedDailyUpdates: ALLOWED_DAILY_INVITES,
          }),
          emoji: 'point_up',
        });
        return;
      }
      updatedSelectedContacts.push(contact);
    }
    setSelectedContacts(updatedSelectedContacts);
  };

  const renderFooter = (availableInvites) => {
    const availableInvitesText = !availableInvites
      ? 0
      : t('referralsContent.label.remainingCount', { amount: availableInvites });

    if (!availableInvites) {
      return (
        <FooterWrapper>
          <FooterText>{t('referralsContent.label.noMoreDailyInvitesAvailable')}</FooterText>
        </FooterWrapper>
      );
    }

    if (selectedContacts.length) {
      return (
        <FooterWrapper>
          <FooterText>
            {t('referralsContent.label.selectedInvitesCount', {
              selectedCount: selectedContacts.length,
              amountText: availableInvitesText,
            })}
          </FooterText>
          {!!isPillarRewardCampaignActive && <FooterText>{t('referralsContent.paragraph.rewardMechanics')}</FooterText>}
          <Button title={t('button.sendInvites')} onPress={sendInvites} isLoading={isSendingInvite} marginTop={16} />
        </FooterWrapper>
      );
    }

    return null;
  };

  const allowedContacts = filterAllowedContacts(phoneContacts, isPhoneVerified, isEmailVerified);
  const isSearching = query && query.length >= MIN_QUERY_LENGTH;
  const filteredContacts = isSearching ? searchContacts(allowedContacts, query) : allowedContacts;

  if (isSearching && isEmpty(filteredContacts)) {
    const customContact = createCustomContact(query, isPhoneVerified, isEmailVerified);

    if (customContact) {
      filteredContacts.push(customContact);
    }
  }

  const availableInvites = getRemainingDailyInvitations(sentInvitationsCount) - selectedContacts.length;

  return (
    <ContainerWithHeader
      headerProps={{
        centerItems: [
          {
            title: isPillarRewardCampaignActive
              ? t('referralsContent.title.referMain')
              : t('referralsContent.title.inviteMain'),
          },
        ],
        rightItems: [
          {
            link: t('button.support'),
            onPress: () => Intercom.displayMessenger(),
          },
        ],
        sideFlex: 2,
      }}
      inset={{ bottom: 0 }}
      footerContainerInset={{ bottom: 'always' }}
      footer={renderFooter(availableInvites)}
      footerContainerStyle={{ flexWrap: 'nowrap' }}
    >
      {!!isFetchingPhoneContacts && (
        <Wrapper flex={1} center>
          <Spinner />
        </Wrapper>
      )}

      {!isFetchingPhoneContacts && (
        <ScrollView stickyHeaderIndices={[0]} contentContainerStyle={{ flexGrow: 1 }}>
          <SearchBlock
            searchInputPlaceholder={t('label.emailOrPhone')}
            onSearchChange={setQuery}
            itemSearchState={query.length >= MIN_QUERY_LENGTH}
            wrapperStyle={{ paddingVertical: spacing.small }}
          />
          <MissingInfoNote
            isEmailVerified={isEmailVerified}
            isPhoneVerified={isPhoneVerified}
            onPressAdd={() => navigation.navigate(ADD_EDIT_USER)}
          />
          <FlatList
            data={filteredContacts}
            extraData={selectedContacts}
            keyExtractor={(item) => item.id}
            renderItem={(props) => renderContact(props, !!availableInvites)}
            initialNumToRender={8}
            onScroll={() => Keyboard.dismiss()}
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingVertical: spacing.rhythm,
              paddingTop: 0,
              flexGrow: 1,
            }}
            ListEmptyComponent={
              <EmptyStateWrapper>
                <EmptyStateParagraph
                  title={
                    !phoneContactsFetchError
                      ? t('phoneBookContactsList.emptyState.noneFound.title')
                      : t('phoneBookContactsList.emptyState.couldNotGetContacts.title')
                  }
                  bodyText={!phoneContactsFetchError ? t('phoneBookContactsList.emptyState.noneFound.paragraph') : ''}
                  wide
                  large
                >
                  {phoneContactsFetchError && (
                    <Button title={t('button.tryAgain')} onPress={fetchPhoneContacts} marginTop={spacing.large} />
                  )}
                </EmptyStateParagraph>
              </EmptyStateWrapper>
            }
          />
        </ScrollView>
      )}
    </ContainerWithHeader>
  );
};

export default withTheme(ReferralContacts);

const createCustomContact = (query: string, isPhoneVerified: boolean, isEmailVerified: boolean): ?ReferralContact => {
  const contact = {
    id: 'custom-contact',
    name: query,
  };

  if (isPhoneVerified && isValidPhone(query)) {
    return { ...contact, phone: query };
  }

  if (isEmailVerified && isValidEmail(query)) {
    return { ...contact, email: query };
  }

  return null;
};

const EmptyStateWrapper = styled.View`
  width: 100%;
  align-items: center;
  padding: 20px 30px 30px;
  flex: 1;
  justify-content: center;
`;

const FooterWrapper = styled.View`
  padding: ${spacing.layoutSides}px;
`;

const FooterText = styled(BaseText)`
  color: ${({ theme }) => theme.colors.accent};
  text-align: center;
`;
