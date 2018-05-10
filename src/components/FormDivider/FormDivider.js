// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { baseColors } from 'utils/variables';

type Props = {
  children?: React.Node,
}

const FormDividerBackground = styled.View`
  width: 100%;
  padding: 10px;
  background-color: ${baseColors.lightGray};
`;

const FormDividerText = styled.Text`
  color: ${baseColors.darkGray};
`;


const FormDivider = (props: Props) => {
  return (
    <FormDividerBackground>
      <FormDividerText>
        {props.children}
      </FormDividerText>
    </FormDividerBackground>
  );
};

export default FormDivider;
