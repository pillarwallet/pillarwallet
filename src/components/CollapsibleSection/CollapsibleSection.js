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

import { spacing } from 'utils/variables';

import ButtonText from 'components/ButtonText';
import Title from 'components/Title';

const Section = styled.View`
  flex-direction: column; 
  justify-content: space-between;
`;

const SectionHeader = styled.View`
  flex: 1;
  flex-direction: row; 
  padding: ${spacing.small}px;
  justify-content: space-between;
  align-items: center;
  padding: 0 ${spacing.mediumLarge}px;
`;

const SectionHeaderAddon = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

const CollapseWrapper = styled.View`
`;

const StyledTitle = styled(Title)``;

type Props = {
  label: string,
  onPress?: Function,
  open?: boolean,
  collapseContent?: React.Node,
  sectionWrapperStyle?: Object,
  onAnimationEnd?: Function,
}

export const CollapsibleSection = (props: Props) => {
  const {
    onPress,
    label,
    open,
    collapseContent,
    sectionWrapperStyle,
    onAnimationEnd,
  } = props;

  return (
    <Section style={sectionWrapperStyle}>
      <SectionHeader>
        <StyledTitle subtitle title={label} />
        {!!collapseContent &&
        <SectionHeaderAddon>
          <ButtonText buttonText={open ? 'Hide' : 'Show'} onPress={onPress} />
        </SectionHeaderAddon>}
      </SectionHeader>
      <Collapsible collapsed={!open} onAnimationEnd={onAnimationEnd}>
        <CollapseWrapper>
          {collapseContent}
        </CollapseWrapper>
      </Collapsible>
    </Section>
  );
};

