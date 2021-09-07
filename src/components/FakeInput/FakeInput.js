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
import styled from 'styled-components/native';
import { BaseText } from 'components/legacy/Typography';

const FakeInput = styled(BaseText)`
  background: #ffffff;
  border-width: 0.5;
  border-color: #efefef;
  border-style: solid;
  padding: 10px;
  margin-bottom: 20px;
  border-radius: 4px;
  font-size: 12px;
`;

export default FakeInput;
