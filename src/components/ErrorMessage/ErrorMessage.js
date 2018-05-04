// @flow
import * as React from 'react';
import styled from 'styled-components/native';

type Props = {
  children: React.Node,
}

const ErrorMessageBackground = styled.View`
  width: 100%;
  padding: 20px;
  margin: 20px 0 0;
  background-color: #ff0005;
`;

const ErrorMessageText = styled.Text`
  color: #ffffff;
  font-size: 16px;
  font-weight: 700;
`;

const ErrorMessage = (props: Props) => {
  return (
    <ErrorMessageBackground>
      <ErrorMessageText>
        {props.children}
      </ErrorMessageText>
    </ErrorMessageBackground>

  );
};

export default ErrorMessage;
