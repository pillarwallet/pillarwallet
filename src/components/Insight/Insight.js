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
import { FlatList, Platform } from 'react-native';
import styled, { withTheme } from 'styled-components/native';

import ShadowedCard from 'components/ShadowedCard';
import IconButton from 'components/IconButton';
import Icon from 'components/Icon';

import { fontSizes, fontStyles, spacing } from 'utils/variables';
import { getThemeColors, themedColors, getColorByTheme } from 'utils/themes';
import { BaseText, MediumText } from 'components/Typography';
import type { Theme } from 'models/Theme';


type InsightChecklistItem = {
  status?: boolean,
  title: string,
  onPress: () => void,
};

type Props = {
  title?: string,
  onClose?: () => void,
  insightChecklist: InsightChecklistItem[],
  insightNumberedList: string[],
  children?: React.Node,
  isVisible: boolean,
  onLayout?: Function,
  wrapperStyle?: Object,
  wrapperPadding?: number | string,
  theme: Theme,
  titleStyle?: Object,
  borderRadius?: number,
};


const Wrapper = styled.View`
  padding: 16px ${({ wrapperPadding }) => !!wrapperPadding || wrapperPadding === 0
    ? wrapperPadding
    : `${spacing.layoutSides}px 6px ${spacing.layoutSides}px`};
`;

const CardRow = styled.View`
  flex-direction: row;
  width: 100%;
  align-items: center;
  padding: 16px 0;
`;

const ContentWrapper = styled.View`
  width: 100%;
  flex: 1;
`;

const ListItem = styled.TouchableOpacity`
  flex-direction: row;
  padding: 2px 0;
`;

const CardTitle = styled(MediumText)`
  color: ${themedColors.text};
  ${fontStyles.regular};
  margin-bottom: 10px;
`;

const InsightText = styled(BaseText)`
  color: ${({ theme }) => theme.colors.basic030};
  ${fontStyles.regular};
  flex: 1;
`;

const Close = styled(IconButton)`
  height: 44px;
  width: 44px;
  position: absolute;
  top: 0;
  right: 16px;
`;

const StatusIconWrapper = styled.View`
  height: 22px;
  width: 20px;
  justify-content: center;
  align-items: center;
  margin-right: ${spacing.medium}px;
`;

const TinyCircle = styled.View`
  height: 4px;
  width: 4px;
  border-radius: 4px;
  background-color: ${getColorByTheme({ lightKey: 'secondaryAccent240', darkKey: 'basic020' })};
`;

const CheckIcon = styled(Icon)`
  color: ${themedColors.positive};
  font-size: ${fontSizes.tiny}px;
`;

const NumberedListItem = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 8px;
`;

const ListNumberWrapper = styled.View`
  width: 16px;
  height: 16px;
  border-radius: 8px;
  background-color: ${themedColors.orange};
  align-items: center;
  justify-content: center;
  margin-top: ${Platform.select({
    ios: '1.5px',
    android: '3px',
  })};
  margin-right: 10px;
`;

const TextWrapper = styled.View`
  flex-wrap: wrap;
  flex-grow: 1;
`;

const TextRow = styled.View`
  flex-direction: row;
  width: 90%;
`;

const ListNumber = styled(BaseText)`
  color: ${({ theme }) => theme.colors.basic070};
  font-size: ${fontSizes.tiny}px;
  line-height: 16px;
`;

const NumberedListItemText = styled(BaseText)`
  color: ${themedColors.secondaryText};
  ${fontStyles.regular};
  flex-wrap: wrap;
  flex: 1;
`;

const StatusIcon = ({ isDone }) => {
  if (isDone) {
    return (
      <CheckIcon name="check" />
    );
  }
  return (
    <TinyCircle />
  );
};

const Insight = (props: Props) => {
  const {
    title,
    onClose,
    insightChecklist,
    insightNumberedList,
    children,
    isVisible,
    onLayout,
    wrapperStyle,
    wrapperPadding,
    theme,
    titleStyle,
    borderRadius,
  } = props;

  const colors = getThemeColors(theme);

  if (!isVisible) return null;
  return (
    <Wrapper onLayout={onLayout} style={wrapperStyle} wrapperPadding={wrapperPadding}>
      <ShadowedCard
        wrapperStyle={{ marginBottom: 10, width: '100%' }}
        contentWrapperStyle={{ paddingLeft: 20, paddingRight: 40 }}
        borderRadius={borderRadius}
      >
        {!!onClose &&
        <Close
          icon="close"
          color={colors.secondaryText}
          onPress={onClose}
          fontSize={fontSizes.small}
          horizontalAlign="flex-end"
        />}
        <CardRow>
          <ContentWrapper>
            {!!title && <CardTitle style={titleStyle}>{title}</CardTitle>}
            {!!insightChecklist && <FlatList
              data={insightChecklist}
              extraData={props}
              keyExtractor={(item) => item.title}
              renderItem={({ item }) => {
                const { status, title: listItem, onPress } = item;
                return (
                  <ListItem onPress={onPress} disabled={!onPress}>
                    <StatusIconWrapper>
                      <StatusIcon isDone={!!status} />
                    </StatusIconWrapper>
                    <InsightText>{listItem}</InsightText>
                  </ListItem>
                );
              }}
            />}
            {!!insightNumberedList && <FlatList
              data={insightNumberedList}
              extraData={props}
              keyExtractor={(item) => item}
              renderItem={({ item, index }) => {
                return (
                  <NumberedListItem>
                    <ListNumberWrapper>
                      <ListNumber>{index + 1}</ListNumber>
                    </ListNumberWrapper>
                    <TextWrapper>
                      <TextRow>
                        <NumberedListItemText>{item}</NumberedListItemText>
                      </TextRow>
                    </TextWrapper>
                  </NumberedListItem>
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

export default withTheme(Insight);
