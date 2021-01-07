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
import { storiesOf } from '@storybook/react-native';
import styled from 'styled-components/native';
import { USD } from 'constants/assetsConstants';
import ValueOverTimeGraph from './ValueOverTimeGraph';
import WithThemeDecorator from '../../../storybook/WithThemeDecorator';


const data = [
  { date: new Date('2020-08-06T14:46:46.564Z'), value: 1453.5586042837713 },
  { date: new Date('2020-08-07T08:08:10.829Z'), value: 1437.1943639636936 },
  { date: new Date('2020-08-08T05:12:10.194Z'), value: 1206.3875872585024 },
  { date: new Date('2020-08-08T22:01:59.600Z'), value: 1238.3898364644608 },
  { date: new Date('2020-08-09T08:14:31.368Z'), value: 1424.4156359964832 },
  { date: new Date('2020-08-09T16:06:41.258Z'), value: 1388.459828905391 },
  { date: new Date('2020-08-10T08:32:47.341Z'), value: 1195.3202802317057 },
  { date: new Date('2020-08-11T09:06:01.758Z'), value: 1071.78186137296 },
  { date: new Date('2020-08-12T05:14:59.769Z'), value: 1083.0656842871135 },
  { date: new Date('2020-08-12T11:53:22.273Z'), value: 1290.6424152696898 },
  { date: new Date('2020-08-13T04:53:50.448Z'), value: 1410.271100945718 },
  { date: new Date('2020-08-13T08:57:45.349Z'), value: 1202.8411123365213 },
  { date: new Date('2020-08-13T14:30:12.882Z'), value: 987.8831343148993 },
  { date: new Date('2020-08-14T09:52:07.989Z'), value: 793.5403892902469 },
  { date: new Date('2020-08-15T09:28:17.105Z'), value: 753.2457460056889 },
  { date: new Date('2020-08-16T07:48:06.649Z'), value: 714.6008552220783 },
  { date: new Date('2020-08-16T21:03:59.338Z'), value: 700.2225932361165 },
  { date: new Date('2020-08-17T05:18:26.647Z'), value: 931.4736028247453 },
  { date: new Date('2020-08-17T11:53:39.116Z'), value: 1099.2817770857641 },
  { date: new Date('2020-08-18T10:24:25.208Z'), value: 1339.8625124240934 },
  { date: new Date('2020-08-19T08:07:23.463Z'), value: 1150.6558826155338 },
  { date: new Date('2020-08-19T15:19:28.376Z'), value: 978.2337084087324 },
  { date: new Date('2020-08-20T02:17:22.736Z'), value: 1098.4458450788925 },
  { date: new Date('2020-08-21T03:31:01.950Z'), value: 1240.1778520125554 },
  { date: new Date('2020-08-22T05:45:50.772Z'), value: 1156.2920045591338 },
  { date: new Date('2020-08-23T05:23:51.098Z'), value: 1182.359971861812 },
  { date: new Date('2020-08-23T20:37:39.021Z'), value: 1354.4785188777623 },
  { date: new Date('2020-08-24T12:42:25.037Z'), value: 1306.3183921107661 },
  { date: new Date('2020-08-25T10:35:04.516Z'), value: 1390.1592436942265 },
  { date: new Date('2020-08-26T02:32:44.127Z'), value: 1144.1152919066483 },
  { date: new Date('2020-08-26T21:04:26.170Z'), value: 1175.6042314728595 },
  { date: new Date('2020-08-27T19:06:34.467Z'), value: 1305.5074897608465 },
  { date: new Date('2020-08-28T04:12:54.299Z'), value: 1475.377071072064 },
  { date: new Date('2020-08-28T22:59:37.506Z'), value: 1447.5082516851749 },
  { date: new Date('2020-08-30T00:59:16.878Z'), value: 1351.7657520773676 },
  { date: new Date('2020-08-30T08:31:10.284Z'), value: 1236.3661823977775 },
  { date: new Date('2020-08-31T04:32:11.839Z'), value: 1066.1775996544663 },
  { date: new Date('2020-09-01T04:15:42.845Z'), value: 1161.018579048153 },
  { date: new Date('2020-09-02T05:21:26.899Z'), value: 1270.5530937914245 },
  { date: new Date('2020-09-02T15:29:27.010Z'), value: 1066.86197304071 },
];

const Container = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
`;

storiesOf('ValueOverTimeGraph', module)
  .addDecorator(WithThemeDecorator)
  .add('default', () => {
    return (
      <Container>
        <ValueOverTimeGraph data={data} fiatCurrency={USD} />
      </Container>
    );
  });
