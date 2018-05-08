// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { UIColors } from 'utils/variables';

type Props = {
  children?: React.Node;
}

const ProfileHeaderWrapper = styled.View`
`;

const ProfileHeaderInner = styled.View`
  padding: 20px;
`;

const ProfileHeaderWrapperTop = styled.View`
  background-color: #f6f6f6;
  height: 180px;
  margin-bottom: -180px;
  border-bottom-width: 1px;
  border-style: solid;
  border-color: ${UIColors.defaultBorderColor};
`;

const ProfileHeader = (props: Props) => {
  return (
    <ProfileHeaderWrapper>
      <ProfileHeaderWrapperTop />
      <ProfileHeaderInner>
        {props.children}
      </ProfileHeaderInner>
    </ProfileHeaderWrapper>

  );
};

export default ProfileHeader;
