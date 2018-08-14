// @flow
import * as React from 'react';
import { Image } from 'react-native';
import styled from 'styled-components/native';
import { Wrapper } from 'components/Layout';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import { spacing } from 'utils/variables';

const EmptyStateBGWrapper = styled.View`
  flex-direction: row;
  justify-content: space-between;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  padding: 8px ${spacing.rhythm}px 0;
`;

type Props = {
  title: string,
  bodyText: string,
}

const esLeft = require('assets/images/esLeftLong.png');

const EmptyChat = (props: Props) => {
  const {
    title,
    bodyText,
  } = props;

  return (
    <Wrapper
      fullScreen
      style={{
        paddingTop: 90,
        paddingBottom: 90,
        alignItems: 'center',
      }}
    >
      <EmptyStateBGWrapper>
        <Image source={esLeft} resizeMode="contain" />
      </EmptyStateBGWrapper>
      <EmptyStateParagraph
        title={title}
        bodyText={bodyText}
      />
    </Wrapper>
  );
};

export default EmptyChat;
