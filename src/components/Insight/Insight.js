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
import { FlatList } from 'react-native';
import styled from 'styled-components/native';

import ShadowedCard from 'components/ShadowedCard';
import IconButton from 'components/IconButton';
import Icon from 'components/Icon';

import { baseColors, fontSizes, fontStyles, spacing } from 'utils/variables';
import { BaseText, MediumText } from 'components/Typography';

type Props = {
  title: string,
  onClose: Function,
  insightList: Object[],
  children?: React.Node,
  isVisible: boolean,
  onLayout?: Function,
  wrapperStyle?: Object,
}

const Wrapper = styled.View`
  padding: 16px 20px 6px 20px;
  background-color: ${baseColors.snowWhite};
`;

const CardRow = styled.View`
   flex-direction: row;
   width: 100%;
   align-items: center;
`;

const ContentWrapper = styled.View`
  width: 100%;
  flex: 1;
`;

const ListItem = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 2px 0;
`;

const CardTitle = styled(MediumText)`
  color: ${baseColors.slateBlack};
  ${fontStyles.regular};
  margin-bottom: 10px;
`;

const InsightText = styled(BaseText)`
  color: ${props => props.color};
  ${fontStyles.regular};
`;

const Close = styled(IconButton)`
  height: 44px;
  width: 44px;
  position: absolute;
  top: 0;
  right: 16px;
`;

const StatusIconWrapper = styled.View`
  height: 20px;
  width: 20px;
  justify-content: center;
  align-items: center;
  margin-right: ${spacing.medium}px;
`;

const TinyCircle = styled.View`
  height: 4px;
  width: 4px;
  border-radius: 4px;
  background-color: ${baseColors.indianRed};
`;

const StatusIcon = ({ isDone }) => {
  if (isDone) {
    return (
      <Icon
        name="check"
        style={{
          fontSize: fontSizes.tiny,
          color: baseColors.fruitSalad,
        }}
      />
    );
  }
  return (
    <TinyCircle />
  );
};

export const Insight = (props: Props) => {
  const {
    title,
    onClose,
    insightList,
    children,
    isVisible,
    onLayout,
    wrapperStyle,
  } = props;

  if (!isVisible) return null;
  return (
    <Wrapper onLayout={onLayout} style={wrapperStyle}>
      <ShadowedCard
        wrapperStyle={{ marginBottom: 10, width: '100%' }}
        contentWrapperStyle={{ paddingLeft: 20, paddingRight: 40, paddingVertical: 16 }}
      >
        <Close
          icon="close"
          color={baseColors.coolGrey}
          onPress={onClose}
          fontSize={fontSizes.small}
          horizontalAlign="flex-end"
        />
        <CardRow>
          <ContentWrapper>
            <CardTitle>{title}</CardTitle>
            {!!insightList && <FlatList
              data={insightList}
              extraData={props}
              keyExtractor={(item) => item.key}
              renderItem={({ item }) => {
                const { status, title: listItem, onPress } = item;
                return (
                  <ListItem onPress={onPress} disabled={!onPress}>
                    <StatusIconWrapper>
                      <StatusIcon isDone={!!status} />
                    </StatusIconWrapper>
                    <InsightText color={status ? baseColors.coolGrey : baseColors.slateBlack}>{listItem}</InsightText>
                  </ListItem>
                );
              }}
            />}
            {children}
          </ContentWrapper>
        </CardRow>
      </ShadowedCard>
    </Wrapper>
  );
};
