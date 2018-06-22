// @flow
import * as React from 'react';
import styled from 'styled-components/native';

type Props = {
  children?: React.Node;
}

const ProfileHeaderWrapper = styled.View`
  padding: 30px;
`;

const ProfileHeader = (props: Props) => {
  return (
    <ProfileHeaderWrapper>
      {props.children}
    </ProfileHeaderWrapper>
  );
};

export default ProfileHeader;
