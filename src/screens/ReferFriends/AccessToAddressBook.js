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

import { Paragraph } from 'components/Typography';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Button from 'components/Button';
import { Wrapper } from 'components/Layout';
import { spacing } from 'utils/variables';


type Props = {
  allowToAccessPhoneContacts: () => void,
};

const ButtonWrapper = styled.View`
  flex: 1;
  justify-content: center;
`;

const AccessToAddressBook = (props: Props) => {
  const allowAccess = () => {
    const { allowToAccessPhoneContacts } = props;
    allowToAccessPhoneContacts();
  };

  return (
    <ContainerWithHeader headerProps={{ centerItems: [{ title: t('addressBookContent.title.allowAccess') }] }}>
      <Wrapper flex={1} regularPadding>
        <Paragraph style={{ marginTop: spacing.layoutSides }}>
          {t('addressBookContent.paragraph.allowAccess')}
        </Paragraph>
        <ButtonWrapper>
          <Button title={t('button.confirm')} onPress={allowAccess} block />
        </ButtonWrapper>
      </Wrapper>
    </ContainerWithHeader>
  );
};

export default AccessToAddressBook;
