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

import React from 'react';
import styled from 'styled-components/native';
import t from 'translations/translate';
import Clipboard from '@react-native-community/clipboard';

// Components
import { Spacing } from 'components/legacy/Layout';
import { MediumText, BaseText } from 'components/legacy/Typography';
import Modal from 'components/Modal';
import ContactSelectorModal from 'components/Modals/ContactSelectorModal';
import ProfileImage from 'components/ProfileImage';
import Spinner from 'components/Spinner';
import Image from 'components/Image';
import Text from 'components/core/Text';
import Toast from 'components/Toast';
import Icon from 'components/core/Icon';

// Selector
import { useAccounts } from 'selectors';

// Utils
import { resolveContact } from 'utils/contacts';
import { isValidAddress } from 'utils/validators';
import { fontStyles, spacing } from 'utils/variables';
import { useTheme, getThemeColors } from 'utils/themes';
import { images } from 'utils/images';
import { findKeyBasedAccount, getActiveAccount } from 'utils/accounts';

// Types
import type { Contact } from 'models/Contact';
import type { Chain } from 'models/Chain';
import { TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { isEmpty } from 'lodash';

export type ContactSelectorProps = {|
  contacts?: Contact[],
  selectedContact?: ?Contact,
  onSelectContact?: (contact: ?Contact) => mixed,
  placeholder?: string,
  disabled?: boolean,
  chain?: ?Chain,
|};

const SelectorPill = styled.TouchableOpacity`
  min-height: 44px;
  justify-content: center;
  padding: ${spacing.medium}px ${spacing.mediumLarge}px;
  background-color: ${({ theme }) => theme.colors.inputField};
  border-radius: 1000px;
`;

const SelectedOption = styled.View`
  flex-direction: row;
  align-items: center;
`;

const ButtonContainer = styled.TouchableOpacity`
  width: 100%;
  padding: ${spacing.medium}px ${spacing.mediumLarge}px;
  margin-bottom: 12px;
  background-color: ${({ theme }) => theme.colors.basic050};
  border-radius: 12px;
`;

const RecommendedContainer = styled.View`
  padding: ${spacing.extraSmall}px ${spacing.small}px;
  background-color: ${({ theme }) => theme.colors.violet};
  border-radius: 6px;
`;

const ButtonTopContainer = styled.View`
  width: 100%;
  flex-direction: row;
  align-items: center;
`;

const SelectionContainer = styled.View`
  width: 90%;
`;

const TitleContainer = styled.View`
  flex-direction: column;
  flex: 1;
`;

const AddressContainer = styled(TouchableOpacity)`
  flex-direction: row;
  align-items: center;
  width: 130px;
`;

const IconImage = styled(Image)`
  height: 34px;
  width: 34px;
`;

const CopyImage = styled(Image)`
  height: 13px;
  width: 13px;
  margin-left: 4px;
`;

const Title = styled(Text)`
  ${fontStyles.medium};
`;

const Recommended = styled(Text)`
  ${fontStyles.regular};
  color: ${({ theme }) => theme.colors.white};
`;

const Subtitle = styled(Text)`
  color: ${({ theme }) => theme.colors.secondaryText};
  fontsize: 14px;
  padding: 0 ${0}px 0 ${4}px;
`;

const Description = styled(Text)`
  fontsize: 14px;
  padding: 6px 0 0 0;
`;

const ContactSelector = ({
  contacts,
  selectedContact,
  onSelectContact,
  placeholder = t('label.whereToSend'),
  disabled,
  chain,
}: ContactSelectorProps) => {
  const theme = useTheme();
  const colors = getThemeColors(theme);
  const { plrXLogo, copyIcon, pllIcon, pencilIcon } = images(theme);
  const pillarXAddress = useSelector((state) => state.modularSdk.pillarXAddress);

  const accounts = useAccounts();
  const keyBasedAccount: any = findKeyBasedAccount(accounts);
  const activeAccount: any = getActiveAccount(accounts);
  const isKeyBasedAccount = activeAccount === keyBasedAccount;

  const [isResolvingContact, setIsResolvingContact] = React.useState(false);

  const handleSelectContact = async (contact: ?Contact) => {
    setIsResolvingContact(true);
    const resolvedContact = await resolveContact(contact, chain);
    setIsResolvingContact(false);

    onSelectContact?.(resolvedContact);
  };

  const openOptions = () => {
    Modal.open(() => <ContactSelectorModal chain={chain} contacts={contacts} onSelectContact={handleSelectContact} />);
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    Clipboard.setString(text);
    if (text) {
      Toast.show({ message: t('toast.addressCopiedToClipboard'), emoji: 'ok_hand' });
    }
  };

  const onPressSelectPill = () => {
    if (selectedContact && !isKeyBasedAccount) {
      onSelectContact(null);
      return;
    }
    openOptions();
  };

  const onSelectKeyWallet = () => {
    const ethAddress = keyBasedAccount?.id;
    const name = t('contactSelector.button.keyWallet');
    onSelectContact({ ethAddress, name, icon: pllIcon });
  };

  const onSelectPillarXWallet = () => {
    const name = t('contactSelector.button.pillarXWallet');
    onSelectContact({ ethAddress: pillarXAddress, name, icon: plrXLogo });
  };

  const selectorList = [
    !isEmpty(pillarXAddress)
      ? {
        id: 'pillarx_address',
        title: t('contactSelector.button.pillarXWallet'),
        description: t('contactSelector.button.pillarXDescription'),
        image: plrXLogo,
        address: pillarXAddress,
        isRecommented: true,
        onPress: onSelectPillarXWallet,
      }
      : null,
    {
      id: 'key_address',
      title: t('contactSelector.button.keyWallet'),
      description: t('contactSelector.button.keyWalletDescription'),
      address: keyBasedAccount?.id,
      image: pllIcon,
      isRecommented: false,
      onPress: onSelectKeyWallet,
    },
    {
      id: 'custom_address',
      title: t('contactSelector.button.customAddress'),
      description: t('contactSelector.button.customAddressDescription'),
      address: null,
      image: pencilIcon,
      isRecommented: false,
      onPress: openOptions,
    },
  ];

  const renderContact = () => {
    if (isResolvingContact) {
      return <Spinner size={20} />;
    }

    if (!selectedContact && isKeyBasedAccount) {
      return (
        <BaseText link medium>
          {disabled || placeholder}
        </BaseText>
      );
    }

    const icon = selectedContact?.icon;
    const name = selectedContact.name || selectedContact.ensName || selectedContact.ethAddress;
    const textProps = isValidAddress(name) ? { tiny: true } : { medium: true };

    return (
      <SelectedOption>
        {icon ? (
          <IconImage source={icon} style={{ width: 20, height: 20 }} />
        ) : (
          <ProfileImage userName={name} diameter={16} borderWidth={0} />
        )}
        <Spacing w={8} />
        <MediumText {...textProps}>{name}</MediumText>
        <Icon name="down-arrow" color={colors.text} width={10} height={10} style={{ marginLeft: 6 }} />
      </SelectedOption>
    );
  };

  if (!selectedContact && !isKeyBasedAccount) {
    return (
      <SelectionContainer>
        {selectorList?.map((item) => {
          if (!item) return null;
          return (
            <ButtonContainer onPress={item.onPress}>
              <ButtonTopContainer>
                <IconImage source={item.image} />
                <TitleContainer>
                  <Title style={{ marginLeft: 4 }}>{item.title}</Title>
                  {item?.address && (
                    <AddressContainer hitSlop={{ top: 5, bottom: 5 }} onPress={() => copyToClipboard(item?.address)}>
                      <Subtitle numberOfLines={1}>
                        {`${item?.address?.substring(0, 5)}...${item?.address?.substring(item?.address?.length - 4)}`}
                      </Subtitle>
                      <CopyImage source={copyIcon} />
                    </AddressContainer>
                  )}
                </TitleContainer>
                {item.isRecommented && (
                  <RecommendedContainer>
                    <Recommended>{t('contactSelector.button.recommented')}</Recommended>
                  </RecommendedContainer>
                )}
              </ButtonTopContainer>
              <Description>{item.description}</Description>
            </ButtonContainer>
          );
        })}
      </SelectionContainer>
    );
  }

  return (
    <SelectorPill onPress={onPressSelectPill} disabled={disabled}>
      {renderContact()}
    </SelectorPill>
  );
};

export default ContactSelector;
