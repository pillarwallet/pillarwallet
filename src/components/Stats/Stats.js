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
import { ScrollView } from 'react-native';
import styled from 'styled-components/native';

import { BaseText, MediumText } from 'components/legacy/Typography';
import { Spacing } from 'components/legacy/Layout';
import Image from 'components/Image';


type Props = {
  stats: {
    title: string,
    value: string,
    iconUrl?: string
  }[],
};

const Row = styled.View`
  flex-direction: row;
  align-items: center;
`;

const Card = styled.View`
  background-color: ${({ theme }) => theme.colors.basic050};
  padding: 8px 16px 16px;
  border-radius: 6px;
`;

const TokenIcon = styled(Image)`
  width: 20px;
  height: 20px;
`;

const Stats = ({ stats }: Props) => {
  return (
    <ScrollView horizontal>
      <Row>
        <Spacing w={4} />
        {stats.map(({ title, value, iconUrl }) => (
          <Row key={title}>
            <Spacing w={16} />
            <Card>
              <Row>
                {!!iconUrl && (
                  <>
                    <TokenIcon source={{ uri: iconUrl }} />
                    <Spacing w={4} />
                  </>
                )}
                <MediumText big>
                  {value}
                </MediumText>
              </Row>
              <BaseText secondary small>{title}</BaseText>
            </Card>
          </Row>
        ))}
      </Row>
    </ScrollView>
  );
};

export default Stats;
