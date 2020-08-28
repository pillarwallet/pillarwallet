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
import React, { Fragment, PureComponent } from 'react';
import t from 'translations/translate';

import { themedColors } from 'utils/themes';
import Header from 'components/Header';
import { BaseText } from 'components/Typography';
import styled from 'styled-components/native';


type Props = {
  onClose: () => void,
};

const HeaderWrapper = styled.SafeAreaView`
  margin-bottom: auto;
  width: 100%;
`;

const Body = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 10px;
`;

const PermissionsText = styled(BaseText)`
  color: ${themedColors.control};
`;

export default class NoPermissions extends PureComponent<Props> {
  render() {
    const { onClose } = this.props;

    return (
      <Fragment>
        <HeaderWrapper>
          <Header light flexStart onClose={onClose} />
        </HeaderWrapper>
        <Body>
          <PermissionsText>
            {t('error.noCameraPermission')}
          </PermissionsText>
        </Body>
      </Fragment>
    );
  }
}
