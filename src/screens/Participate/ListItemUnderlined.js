// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { baseColors, fontSizes, spacing, fontWeights } from 'utils/variables';
import { BoldText, MediumText } from 'components/Typography';

type Props = {
  label: string,
  value: any,
  spacedOut?: boolean,
}

const ItemWrapper = styled.View`
  margin: ${spacing.rhythm / 2}px 0;
  flexDirection: column;
  align-items: flex-start;
  justify-content: flex-start;
  width: 100%;
`;

const ItemLabel = styled(MediumText)`
  text-align:center;
  font-size: ${fontSizes.extraExtraSmall};
  color: ${baseColors.darkGray};
`;

const ItemValueHolder = styled.View`
  padding: ${props => props.spacedOut ? '8px 10px' : '0px 10px 8px'};
  border-bottom-width: 1px;
  border-color: ${baseColors.gallery};
  align-items: flex-end;
  width: 100%;
`;

const ItemValue = styled(BoldText)`
  font-size: ${fontSizes.large};
  font-weight: ${fontWeights.bold};
`;

const ListItemUnderlined = (props: Props) => {
  const { label, value, spacedOut } = props;
  return (
    <ItemWrapper>
      <ItemLabel>{label}</ItemLabel>
      <ItemValueHolder spacedOut={spacedOut}>
        <ItemValue>{value}</ItemValue>
      </ItemValueHolder>
    </ItemWrapper>
  );
};

export default ListItemUnderlined;

