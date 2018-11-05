// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { baseColors, fontSizes, spacing, fontWeights } from 'utils/variables';
import { BoldText, BaseText } from 'components/Typography';
import Spinner from 'components/Spinner';

type Props = {
  label: string,
  value: any,
  spacedOut?: boolean,
  valueAddon?: React.Node,
  showSpinner?: boolean,
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
  align-items: flex-end;
  justify-content: flex-end;
  width: 100%;
  padding-right: ${spacing.mediumLarge}px;
  height: 50px;
`;

const ItemValue = styled(BoldText)`
  font-size: ${fontSizes.large}px;
  font-weight: ${fontWeights.bold};
  margin-bottom: ${spacing.medium}px;
  margin-top: ${props => props.spacedOut ? '8px' : '0'};
`;

const ListItemUnderlined = (props: Props) => {
  const {
    label,
    value,
    spacedOut,
    valueAddon,
    showSpinner,
  } = props;
  return (
    <ItemWrapper>
      <ItemLabel>{label}</ItemLabel>
      <ItemValueHolder>
        {valueAddon}
        <ItemValue spacedOut={spacedOut}>{value}</ItemValue>
        {!!showSpinner &&
        <Spinner width={20} height={20} style={{ marginBottom: 16, marginLeft: 10 }} />}
      </ItemValueHolder>
    </ItemWrapper>
  );
};

export default ListItemUnderlined;
