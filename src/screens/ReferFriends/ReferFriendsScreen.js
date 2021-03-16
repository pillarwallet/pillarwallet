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
import { Keyboard, FlatList } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import { useDispatch } from 'react-redux';
import styled from 'styled-components/native';
import t from 'translations/translate';

// Actions
import { fetchPhoneContactsAction } from 'actions/phoneContactsActions';
import { fetchSentReferralInvitationsAction, sendReferralInvitationsAction } from 'actions/referralsActions';

// Components
import { Spacing, Wrapper } from 'components/Layout';
import { BaseText } from 'components/Typography';
import Button from 'components/Button';
import CheckBox from 'components/modern/CheckBox';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import MissingInfoNote from 'screens/ReferFriends/MissingInfoNote';
import Modal from 'components/Modal';
import SearchBlock from 'components/SearchBlock';
import Spinner from 'components/Spinner';
import Toast from 'components/Toast';

// Contstants
import { ADD_EDIT_USER } from 'constants/navigationConstants';
import { ALLOWED_DAILY_INVITES } from 'constants/referralsConstants';

// Selectors
import { useRootSelector } from 'selectors';
import { useUser } from 'selectors/user';

// Utils
import {
  getRemainingDailyInvitations,
  isSameContact,
  isSameContactData,
  filterAllowedContacts,
  searchContacts,
} from 'utils/referrals';
import { fontStyles, spacing } from 'utils/variables';
import { isValidPhone, isValidEmail } from 'utils/validators';

// Types
import type { ReferralContact } from 'reducers/referralsReducer';

// Local
import ContactsPermissionModal from './ContactsPermissionModal';

const MIN_QUERY_LENGTH = 3;

const ReferFriendsScreen = () => {
  const navigation = useNavigation();

  const [query, setQuery] = React.useState('');
  const [selectedContacts, setSelectedContacts] = React.useState([]);

  const dispatch = useDispatch();
  const user = useUser();

  const hasAllowedToAccessContacts = useRootSelector((root) => root.referrals.hasAllowedToAccessContacts);
  const alreadyInvitedContacts = useRootSelector((root) => root.referrals.alreadyInvitedContacts);
  const sentInvitationsCount = useRootSelector((root) => root.referrals.sentInvitationsCount);
  const isPillarRewardCampaignActive = useRootSelector((root) => root.referrals.isPillarRewardCampaignActive);
  const isSendingInvite = useRootSelector((root) => root.referrals.isSendingInvite);

  const phoneContacts = useRootSelector((root) => root.phoneContacts.data);
  const isFetchingPhoneContacts = useRootSelector((root) => root.phoneContacts.isFetching);
  const isFetchingPhoneContactsComplete = useRootSelector((root) => root.phoneContacts.isFetchComplete);
  const phoneContactsFetchError = useRootSelector((root) => root.phoneContacts.fetchError);

  const totalInvites = getRemainingDailyInvitations(sentInvitationsCount);
  const availableInvites = Math.max(totalInvites - selectedContacts.length, 0);

  React.useEffect(() => {
    dispatch(fetchSentReferralInvitationsAction());
  }, []);

  React.useEffect(() => {
    if (!hasAllowedToAccessContacts) {
      Modal.open(() => (
        <ContactsPermissionModal onAllow={fetchPhoneContacts} onCancel={() => navigation.goBack(null)} />
      ));
      return;
    }

    fetchPhoneContacts();
  }, [hasAllowedToAccessContacts]);

  const fetchPhoneContacts = () => {
    if (isFetchingPhoneContacts || isFetchingPhoneContactsComplete) return;

    dispatch(fetchPhoneContactsAction());
  };

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
        leftAddon={
          <CheckBox
            value={isSelected}
            onValueChange={() => toggleContact(item)}
            disabled={!canSelect}
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
      if (isSameContactData(contact, user.email, user.phone)) {
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

  const renderFooter = () => {
    if (!totalInvites) {
      return (
        <FooterWrapper>
          <FooterText>{t('referralsContent.label.noMoreDailyInvitesAvailable')}</FooterText>
        </FooterWrapper>
      );
    }

    if (selectedContacts.length) {
      return (
        <FooterWrapper>
          {!!isPillarRewardCampaignActive && (
            <>
              <FooterText>{t('referralsContent.paragraph.rewardMechanics')}</FooterText>
              <Spacing h={spacing.mediumLarge} />
            </>
          )}

          <Button title={t('referralsContent.button.invite')} onPress={sendInvites} isLoading={isSendingInvite} />
        </FooterWrapper>
      );
    }

    return null;
  };

  const allowedContacts = filterAllowedContacts(phoneContacts, user.isPhoneVerified, user.isEmailVerified);
  const isSearching = query && query.length >= MIN_QUERY_LENGTH;
  const filteredContacts = isSearching ? searchContacts(allowedContacts, query) : allowedContacts;

  if (isSearching && !filteredContacts.length) {
    const customContact = createCustomContact(query, user.isPhoneVerified, user.isEmailVerified);

    if (customContact) {
      filteredContacts.push(customContact);
    }
  }

  const selectedText = t('referralsContent.label.remainingCount', {
    remainingCount: availableInvites,
    totalCount: totalInvites,
  });

  return (
    <ContainerWithHeader
      headerProps={{
        centerItems: [
          {
            title: isPillarRewardCampaignActive
              ? t('referralsContent.title.referFriends')
              : t('referralsContent.title.inviteFriends'),
          },
        ],
        rightItems: [
          {
            custom: <HeaderSideText secondary>{selectedText}</HeaderSideText>,
            style: { position: 'absolute' },
          },
        ],
      }}
      inset={{ bottom: 0 }}
      footerContainerInset={{ bottom: 'always' }}
      footer={renderFooter()}
      footerContainerStyle={{ flexWrap: 'nowrap' }}
    >
      {!!isFetchingPhoneContacts && (
        <Wrapper flex={1} center>
          <Spinner />
        </Wrapper>
      )}

      {!isFetchingPhoneContacts && (
        <>
          <SearchBlock
            onSearchChange={setQuery}
            itemSearchState={query.length >= MIN_QUERY_LENGTH}
          />

          <MissingInfoNote
            isEmailVerified={user.isEmailVerified}
            isPhoneVerified={user.isPhoneVerified}
            onPressAdd={() => navigation.navigate(ADD_EDIT_USER)}
          />

          <FlatList
            data={filteredContacts}
            extraData={selectedContacts}
            keyExtractor={(item) => item.id}
            renderItem={(props) => renderContact(props, !!totalInvites)}
            initialNumToRender={8}
            onScroll={() => Keyboard.dismiss()}
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
                />
                {phoneContactsFetchError && (
                  <Button title={t('button.tryAgain')} onPress={fetchPhoneContacts} marginTop={spacing.large} />
                )}
              </EmptyStateWrapper>
            }
          />
        </>
      )}
    </ContainerWithHeader>
  );
};

export default ReferFriendsScreen;

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
  padding: 20px 30px 30px;
  flex: 1;
  justify-content: center;
`;

const HeaderSideText = styled(BaseText)`
  ${fontStyles.regular};
`;

const FooterWrapper = styled.View`
  padding: ${spacing.layoutSides}px;
`;

const FooterText = styled(BaseText)`
  color: ${({ theme }) => theme.colors.accent};
  text-align: center;
`;
