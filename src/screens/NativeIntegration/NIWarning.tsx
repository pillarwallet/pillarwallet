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
import { useNavigation } from 'react-navigation-hooks';
import t from 'translations/translate';
import { useDispatch } from 'react-redux';

// Components
import { Container } from 'components/layout/Layout';
import { Wrapper } from 'components/legacy/Layout';
import Title from 'components/legacy/Title';
import Button from 'components/core/Button';
import HeaderBlock from 'components/HeaderBlock';

// Constants
import { NI_SERVICES } from 'constants/navigationConstants';

// Actions
import { saveDbAction } from 'actions/dbActions';

function NIWarning() {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const onContinue = async () => {
    await dispatch(saveDbAction('ni_warning', { visible: 'no' }));
    navigation.navigate(NI_SERVICES);
  };

  return (
    <Container>
      <HeaderBlock leftItems={[{ close: true }]} navigation={navigation} />
      <Wrapper flex={1} center regularPadding>
        <Title fullWidth title={'Warning!'} titleStyles={titleStyle} align="center" />
      </Wrapper>

      <Button onPress={onContinue} title={t('button.continue')} style={buttonStyle} />
    </Container>
  );
}

export default NIWarning;

const titleStyle = {
  fontSize: 16,
};

const buttonStyle = {
  width: '90%',
  alignSelf: 'center',
  marginBottom: 20,
};
