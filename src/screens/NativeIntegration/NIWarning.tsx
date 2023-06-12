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
import styled from 'styled-components/native';

// Components
import { Container } from 'components/layout/Layout';
import { Wrapper } from 'components/legacy/Layout';
import Title from 'components/legacy/Title';
import Button from 'components/legacy/Button';
import Text from 'components/core/Text';

// Constants
import { NI_SERVICES } from 'constants/navigationConstants';

// Actions
import { saveDbAction } from 'actions/dbActions';

// Utils
import { fontStyles } from 'utils/variables';

function NIWarning() {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const onContinue = async () => {
    await dispatch(saveDbAction('ni_warning', { visible: 'no' }));
    navigation.navigate(NI_SERVICES);
  };

  return (
    <Container style={containerStyle}>
      <Wrapper flex={1}>
        <Title fullWidth title={'Warning!'} titleStyles={titleStyle} align="center" />
        <WarningText>{t('paragraph.nativeIntegrationWarning')}</WarningText>
        <WarningText style={{ fontWeight: 'bold' }}>{t('paragraph.ownRisk')}</WarningText>
      </Wrapper>

      <Button title={t('button.i_understand')} onPress={onContinue} />
    </Container>
  );
}

export default NIWarning;

const titleStyle = {
  fontSize: 24,
  color: 'red',
  marginTop: '12%',
};

const containerStyle = { padding: 20, paddingBottom: 40 };

const WarningText = styled(Text)`
  text-align: center;
  color: ${({ theme }) => theme.colors.basic010};
  ${fontStyles.big};
  padding-horizontal: 20px
  margin-top: 25px;
`;
