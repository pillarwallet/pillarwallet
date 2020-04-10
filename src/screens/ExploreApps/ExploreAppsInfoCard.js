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
import { fontStyles } from 'utils/variables';
import { MediumText, BaseText } from 'components/Typography';
import ShadowedCard from 'components/ShadowedCard';
import Button from 'components/Button';

interface Props {
  onButtonPress: () => void
}

const Wrapper = styled.View`
  padding: 22px 30px 30px;
`;

const Title = styled(MediumText)`
  ${fontStyles.big};
  margin-bottom: 10px;
  text-align: center;
`;

const Text = styled(BaseText)`
  ${fontStyles.medium};
  margin-bottom: 38;
`;

const ButtonWrapper = styled.View`
  width: 100%;
`;

const title = 'What is it?';
// eslint-disable-next-line quotes
const content = `A curated collection of web3 apps available to use with Pillar.\
 Sign in without creating an account. Just scan QR and go.`;


const ExploreAppsInfoCard = (props: Props) => (
  <ShadowedCard borderRadius={30}>
    <Wrapper>
      <Title>{title}</Title>
      <Text>{content}</Text>
      <ButtonWrapper>
        <Button title="Cool, thanks" onPress={props.onButtonPress} height={32} small />
      </ButtonWrapper>
    </Wrapper>
  </ShadowedCard>
);


export default ExploreAppsInfoCard;
