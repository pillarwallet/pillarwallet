// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { baseColors, fontSizes, spacing, fontWeights, UIColors } from 'utils/variables';
import { BaseText } from 'components/Typography';
import { ScrollView, TouchableWithoutFeedback } from 'react-native';
import { CustomParsedText } from 'components/CustomParsedText';

type Props = {
  label: string,
  value: any,
}

const ItemWrapper = styled.View`
  margin-top: ${spacing.mediumLarge}px;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  width: 100%;
`;

const ItemLabel = styled(BaseText)`
  text-align:center;
  font-size: ${fontSizes.extraExtraSmall}px;
  color: ${baseColors.darkGray};
  font-weight: ${fontWeights.medium};
`;

const ItemValueHolder = styled.View`
  border-bottom-width: 1px;
  border-color: ${baseColors.gallery};
  flex-direction: row;
  align-items: flex-start;
  justify-content: flex-start;
  width: 100%;
  padding-right: ${spacing.mediumLarge}px;
  height: 50px;
`;

const StyledBaseText = styled(CustomParsedText)`
  font-size: ${fontSizes.small}px;
  color: ${UIColors.defaultTextColor};
`;

const ListItemParagraph = (props: Props) => {
  const {
    label,
    value,
  } = props;
  return (
    <ItemWrapper>
      <ItemLabel>{label}</ItemLabel>
      <ItemValueHolder>
        <ScrollView>
          <TouchableWithoutFeedback>
            <StyledBaseText text={value} />
          </TouchableWithoutFeedback>
        </ScrollView>
      </ItemValueHolder>
    </ItemWrapper>
  );
};

export default ListItemParagraph;
