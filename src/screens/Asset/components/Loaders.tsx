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
import ContentLoader, { Rect } from 'react-content-loader/native';

// Utils
import { useThemeColors } from 'utils/themes';

// Components
import Icon from 'components/core/Icon';

export const HeaderLoader = () => {
  const colors = useThemeColors();
  return (
    <ContentLoader
      foregroundColor={colors.secondarySkeleton}
      backgroundColor={colors.primarySkeleton}
      speed={1}
      interval={0}
      viewBox="0 0 179 100"
      width={179}
      height={100}
    >
      <Rect x="54.5" y="5" rx="4" ry="4" width="70" height="25" />
      <Rect x="0" y="40" rx="4" ry="4" width="179" height="15" />
      <Rect x="0" y="60" rx="4" ry="4" width="179" height="15" />
    </ContentLoader>
  );
};

export const GraphLoader = () => {
  return (
    <Container>
      <IconContainer>
        <Icon name="plr-transparent" />
      </IconContainer>
    </Container>
  );
};

export const TokenAnalyticsLoader = () => {
  const colors = useThemeColors();
  return (
    <ContentLoader
      foregroundColor={colors.purpleHeatSecondary}
      backgroundColor={colors.purpleHeatPrimary}
      speed={1}
      interval={0}
      viewBox="0 0 66 23"
      width={66}
      height={23}
    >
      <Rect x="0" y="0" rx="4" ry="4" width="66" height="15" />
    </ContentLoader>
  );
};

export const BalanceLoader = () => {
  const colors = useThemeColors();

  return (
    <RowContainer>
      <ContentLoader
        foregroundColor={colors.secondarySkeleton}
        backgroundColor={colors.primarySkeleton}
        speed={1}
        interval={0}
        viewBox="0 0 99 50"
        width={99}
        height={50}
      >
        <Rect x="0" y="5" rx="4" ry="4" width="98" height="22" />
        <Rect x="0" y="32" rx="4" ry="4" width="98" height="13" />
      </ContentLoader>
      <ContentLoader
        foregroundColor={colors.secondarySkeleton}
        backgroundColor={colors.primarySkeleton}
        speed={1}
        interval={0}
        viewBox="0 0 99 50"
        width={99}
        height={50}
      >
        <Rect x="0" y="5" rx="4" ry="4" width="98" height="22" />
        <Rect x="0" y="32" rx="4" ry="4" width="98" height="13" />
      </ContentLoader>
    </RowContainer>
  );
};

export const AllTimeLoader = () => {
  const colors = useThemeColors();

  return (
    <ContentLoader
      foregroundColor={colors.secondarySkeleton}
      backgroundColor={colors.primarySkeleton}
      speed={1}
      interval={0}
      viewBox="0 0 52 13"
      width={52}
      height={13}
    >
      <Rect x="0" y="0" rx="4" ry="4" width="53" height="13" />
    </ContentLoader>
  );
};

const RowContainer = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const Container = styled.View`
  height: 172px;
  align-items: center;
  justify-content: center;
`;

const IconContainer = styled.View`
  background-color: ${({ theme }) => theme.colors.basic070};
  border-radius: 24px;
  shadow-color: #5c0cac;
  shadow-opacity: 0.58;
  shadow-radius: 24;
  elevation: 56;
`;
