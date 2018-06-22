// @flow
import * as React from 'react';
import { HelpText } from 'components/Typography';
import styled from 'styled-components/native';

type Props = {
  title: string,
};

const DividerContainer = styled.View`
    flex-direction: row;
    justifyContent: space-between;
    alignItems: center;
    padding-left: 20px;
    padding-right: 20px;
`;

const ViewBorder = styled.View`
    height: 1px;
    flex: 1;
    background-color: lightgrey;
`;

const HelpTextDivider = (props: Props) => {
  return (
    <DividerContainer>
      <ViewBorder />
      <HelpText>{ props.title }</HelpText>
      <ViewBorder />
    </DividerContainer>
  );
};


export default HelpTextDivider;
