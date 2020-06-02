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
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components';

// actions
import { lockScreenAction } from 'actions/authActions';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { ScrollWrapper } from 'components/Layout';
import HorizontalDots from 'components/HorizontalDots';
import { MediumText, Paragraph } from 'components/Typography';

// utils
import { fontStyles, spacing } from 'utils/variables';

// types
import type { Dispatch } from 'reducers/rootReducer';


type Props = {
  navigation: NavigationScreenProp,
  lockScreen: () => void,
};

const Title = styled(MediumText)`
  ${fontStyles.large};
  text-align: center;
  margin-bottom: ${spacing.small}px;
`;

const WalletRecoveryOptions = (props: Props) => {
  const { lockScreen } = props;

  return (
    <ContainerWithHeader
      headerProps={{
        rightItems: [{ close: true }],
        noBack: true,
        onClose: () => lockScreen(),
      }}
    >
      <ScrollWrapper regularPadding>
        <HorizontalDots
          wrapperVerticalMargin={100}
          dotStyle={{ marginHorizontal: 7 }}
          numAllDots={3}
        />
        <Title center>Smart Wallet is now being recovered</Title>
        <Paragraph small light center>
          Your Smart Wallet device recovery transaction is sent.
          You will be able to use your recovered wallet once transaction is confirmed.
        </Paragraph>
      </ScrollWrapper>
    </ContainerWithHeader>
  );
};


const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  lockScreen: () => dispatch(lockScreenAction()),
});

export default connect(null, mapDispatchToProps)(WalletRecoveryOptions);
