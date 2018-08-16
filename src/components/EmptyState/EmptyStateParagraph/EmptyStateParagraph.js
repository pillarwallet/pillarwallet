// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { baseColors, fontSizes } from 'utils/variables';

type Props = {
  title: string,
  bodyText: string,
}

const EmptySectionTextWrapper = styled.View`
  width: 232px;
  align-items: center;
  justify-content: center;
`;

const EmptySectionTitle = styled.Text`
  font-size: ${fontSizes.large};
  color: ${baseColors.slateBlack};
  margin-bottom: 6px;
`;

const EmptySectionText = styled.Text`
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
