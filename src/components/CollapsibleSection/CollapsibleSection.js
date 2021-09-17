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
import Collapsible from 'react-native-collapsible';

// components
import { MediumText, TextLink } from 'components/legacy/Typography';
import Icon from 'components/legacy/Icon';

// utils
import { fontSizes, fontStyles, spacing } from 'utils/variables';
import Spinner from 'components/Spinner';


type Props = {
  label: string,
  onPress?: () => void,
  open?: boolean,
  collapseContent?: React.Node,
  sectionWrapperStyle?: Object,
  onAnimationEnd?: () => void,
  labelRight?: ?string,
  onPressLabelRight?: () => void,
  showLoadingSpinner?: boolean,
};

const Section = styled.View`
  flex-direction: column; 
  width: 100%;
`;

const SectionHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 18px ${spacing.layoutSides}px 8px;
`;

const SectionHeaderPart = styled.TouchableOpacity`
  flex-direction: row; 
`;

const SectionTitle = styled(MediumText)`
  ${fontStyles.big};
`;

const SectionLink = styled(TextLink)`
  ${fontStyles.regular};
`;

const ChevronIcon = styled(Icon)`
  color: ${({ theme }) => theme.colors.basic020};
  font-size: ${fontSizes.tiny}px;
  align-self: center;
  justify-content: center;
  padding: 0 10px;
  transform: ${({ open }) => (open ? 'rotate(-90deg)' : 'rotate(90deg)')};
  ${({ open }) => !open && 'margin-top: 2px;'}
`;

const CollapsibleSection = (props: Props) => {
  const {
    onPress,
    label,
    open,
    collapseContent,
    sectionWrapperStyle,
    onAnimationEnd,
    labelRight,
    onPressLabelRight,
    showLoadingSpinner,
  } = props;

  return (
    <Section style={sectionWrapperStyle}>
      <SectionHeader>
        <SectionHeaderPart onPress={collapseContent && onPress}>
          <SectionTitle>{label}</SectionTitle>
          {!!collapseContent && <ChevronIcon name="chevron-right" open={open} />}
        </SectionHeaderPart>
        {showLoadingSpinner && <Spinner size={20} trackWidth={2} />}
        {!showLoadingSpinner && !!labelRight && (
          <SectionHeaderPart onPress={onPressLabelRight}>
            <SectionLink>{labelRight}</SectionLink>
          </SectionHeaderPart>
        )}
      </SectionHeader>
      <Collapsible collapsed={!open} onAnimationEnd={onAnimationEnd}>
        {collapseContent}
      </Collapsible>
    </Section>
  );
};

export default CollapsibleSection;
