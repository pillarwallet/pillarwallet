// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { baseColors, fontSizes } from 'utils/variables';
import { BaseText } from 'components/Typography';

type Props = {
  title: string,
  bodyText: string,
}

const EmptySectionTextWrapper = styled.View`
  width: 234px;
  align-items: center;
  justify-content: center;
`;

const EmptySectionTitle = styled(BaseText)`
  font-size: ${fontSizes.large};
  color: ${baseColors.slateBlack};
  margin-bottom: 6px;
`;

const EmptySectionText = styled(BaseText)`
  font-size: ${fontSizes.small};
  color: ${baseColors.darkGray};
  text-align: center;
`;

const EmptyStateParagraph = (props: Props) => {
  const {
    title,
    bodyText,
  } = props;

  return (
    <EmptySectionTextWrapper>
      <EmptySectionTitle>{title}</EmptySectionTitle>
      <EmptySectionText>{bodyText}</EmptySectionText>
    </EmptySectionTextWrapper>
  );
};

export default EmptyStateParagraph;
