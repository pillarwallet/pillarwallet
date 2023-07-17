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

// eslint-disable-next-line import/no-extraneous-dependencies
import ContentLoader from 'react-native-content-loader';
import { Rect } from 'react-native-svg';

// Components
import { Spacing } from 'components/legacy/Layout';

// Utils
import { useThemeColors } from 'utils/themes';

type Props = {
  width: number;
  height: number;
  radius?: number;
};

export const SingleSkeletonLoader = ({ width, height, radius }: Props) => {
  const colors = useThemeColors();
  return (
    <ContentLoader
      primaryColor={colors.primarySkeleton}
      secondaryColor={colors.secondarySkeleton}
      duration={1000}
      width={width * 1.05}
      height={height * 1.05}
    >
      <Rect
        x="0"
        y="0"
        rx={radius ? JSON.stringify(radius) : '4'}
        ry={radius ? JSON.stringify(radius) : '4'}
        width={JSON.stringify(width)}
        height={JSON.stringify(height)}
      />
    </ContentLoader>
  );
};

export const BalanceSelectionLoader = () => <SingleSkeletonLoader width={92} height={31} />;

export const BalanceLoader = () => <SingleSkeletonLoader width={46} height={14} />;

export const CircleLoader = () => <SingleSkeletonLoader width={48} height={48} radius={24} />;

export const HorizontalTitleLoader = () => {
  const colors = useThemeColors();

  return (
    <ContentLoader
      primaryColor={colors.primarySkeleton}
      secondaryColor={colors.secondarySkeleton}
      duration={1000}
      width={190}
      height={50}
    >
      <Rect x="0" y="0" rx="4" ry="4" width="190" height="22" />
      <Rect x="0" y="30" rx="4" ry="4" width="190" height="13" />
    </ContentLoader>
  );
};

export const HorizontalBalanceLoader = () => {
  const colors = useThemeColors();

  return (
    <ContentLoader
      primaryColor={colors.primarySkeleton}
      secondaryColor={colors.secondarySkeleton}
      duration={1000}
      width={77}
      height={50}
    >
      <Rect x="0" y="0" rx="4" ry="4" width="77" height="22" />
      <Rect x="0" y="30" rx="4" ry="4" width="77" height="13" />
    </ContentLoader>
  );
};

export const TokenLoader = () => {
  return (
    <RowContainer>
      <RowSubContainer>
        <CircleLoader />
        <Spacing w={12} />
        <HorizontalTitleLoader />
      </RowSubContainer>
      <Spacing w={18} />
      <HorizontalBalanceLoader />
    </RowContainer>
  );
};

const RowContainer = styled.View`
  width: 100%;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  min-height: 76px;
`;

const RowSubContainer = styled.View`
  flex-direction: row;
  align-items: center;
`;
