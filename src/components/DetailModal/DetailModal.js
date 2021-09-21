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
import type { Node as ReactNode } from 'react';
import styled from 'styled-components/native';
import type { ThemeValue } from 'styled-theming';
import { SafeAreaView } from 'react-navigation';

// components
import SlideModal from 'components/Modals/SlideModal';
import { BaseText, MediumText } from 'components/legacy/Typography';
import { Spacing } from 'components/legacy/Layout';
import Button from 'components/legacy/Button';
import Spinner from 'components/Spinner';

// utils
import { fontStyles, fontSizes } from 'utils/variables';
import { formatDate } from 'utils/date';

// types
import type { Props as ButtonProps } from 'components/legacy/Button';

opaque type FeePending = $FlowFixMe;
export const FEE_PENDING: FeePending = Symbol('fee pending');

type Props = {|
  date?: Date,
  title: string,
  subtitle?: string,
  image: ReactNode,
  children?: string | ReactNode,
  fee?: ?string | FeePending,
  buttons?: ButtonProps[],
|};

const DATE_FORMAT = 'MMMM d, yyyy HH:mm';

const spacing = {
  side: 20,
  bottom: 50,
  xxs: 4,
  xs: 8,
  s: 16,
  m: 20,
  xxl: 32,
};

const isTextChild = (node: ?ReactNode): %checks =>
  typeof node === 'string' || typeof node === 'number';

const Wrapper = styled(SafeAreaView)`
  padding-top: ${({ hasDate }) => hasDate ? spacing.s : spacing.m}px;
  padding-horizontal: ${spacing.side}px;
  padding-bottom: ${spacing.bottom}px;
  align-items: center;
`;

const EventTime = styled(BaseText)`
  ${fontStyles.tiny};
  margin-bottom: ${spacing.xs}px;
`;

const Title = styled(MediumText)`
  ${fontStyles.medium};
`;

const Subtitle = styled(BaseText)`
  ${fontStyles.regular};
`;

const ChildrenWrapper = styled.View`
  align-self: stretch;
  align-items: center;
  margin-bottom: ${({ bottomSpacingCut = 0 }) => spacing.xxl - bottomSpacingCut}px;
`;

const FeeText = styled(BaseText)`
  ${fontStyles.regular};
  margin-bottom: ${spacing.s}px;
`;

const FeeSpinner = styled(Spinner)`
  margin-bottom: ${spacing.s}px;
`;

const ButtonsContainer = styled.View`
  align-self: stretch;
`;

const ButtonWrapper = styled.View`
  margin-bottom: ${({ last }) => last ? 0 : spacing.xs}px;
`;

const DetailText = styled(MediumText)`
  font-size: ${fontSizes.large}px;
  line-height: ${fontSizes.large}px;
  color: ${({ color, theme }) => color || theme.colors.basic010};
`;

const RowWrapper = styled.View`
  flex-direction: row;
  align-items: flex-start;
  margin-bottom: ${spacing.xxs}px;
`;

type RowProps = {|
  children: ReactNode,
  color?: ?ThemeValue,
|};

export const DetailRow = ({ children, color }: RowProps) => (
  <RowWrapper>
    {React.Children.map(children, child =>
      isTextChild(child)
        ? <DetailText color={color}>{child}</DetailText>
        : child,
    )}
  </RowWrapper>
);

// Checking component.type does not work in development,
// see: https://github.com/gaearon/react-hot-loader/issues/304
(DetailRow: any).extraSpacing = spacing.xxs;

export const DetailParagraph = styled(BaseText)`
  ${fontStyles.medium};
  color: ${({ theme }) => theme.colors.basic030};
  text-align: center;
`;

const getChildrenSpacing = (children: ?ReactNode): number =>
  React.Children.toArray(children).slice(-1)[0]?.type?.extraSpacing ?? 0;

const Fee = ({ fee }: { fee: void | string | FeePending }) => {
  if (fee === FEE_PENDING) {
    return <FeeSpinner size={20} trackWidth={2} />;
  }

  if (typeof fee === 'string') {
    return <FeeText secondary>{fee}</FeeText>;
  }

  return null;
};

const DetailModal = ({
  date,
  title,
  subtitle,
  image,
  children,
  fee,
  buttons,
}: Props) => {
  const hasDate = date !== undefined;
  const wrappedChildren = isTextChild(children)
    ? <DetailRow>{children}</DetailRow>
    : children;

  return (
    <SlideModal
      noClose
      hideHeader
      eventDetail
    >
      <Wrapper
        forceInset={{ top: 'never', bottom: 'always' }}
        hasDate={hasDate}
      >
        {hasDate && <EventTime secondary>{formatDate(date, DATE_FORMAT)}</EventTime>}
        <Title>{title}</Title>
        {!!subtitle && <Subtitle secondary>{subtitle}</Subtitle>}

        <Spacing h={spacing.m} />
        {image}
        <Spacing h={spacing.m} />

        <ChildrenWrapper bottomSpacingCut={getChildrenSpacing(wrappedChildren)}>
          {wrappedChildren}
        </ChildrenWrapper>

        <Fee fee={fee} />
        {buttons && (
          <ButtonsContainer>
            {buttons.map((buttonProps, i) => (
              <ButtonWrapper key={i} last={i + 1 === buttons.length}>
                <Button {...buttonProps} />
              </ButtonWrapper>
            ))}
          </ButtonsContainer>
        )}
      </Wrapper>
    </SlideModal>
  );
};

export default DetailModal;
