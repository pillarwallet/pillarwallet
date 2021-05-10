// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/

import * as React from 'react';
import styled from 'styled-components/native';
import { Storyly } from 'storyly-react-native';
import { useDispatch } from 'react-redux';

// Components
import Text from 'components/modern/Text';

// Actions
import { logEventAction } from 'actions/analyticsActions';

// Utils
import { spacing } from 'utils/variables';
import { reportOrWarn } from 'utils/common';

// Configs
import { getEnv } from 'configs/envConfig';

type Props = {|
  renderHeader?: () => React.Node,
|};

const Stories = ({ renderHeader }: Props) => {
  const dispatch = useDispatch();
  const [storyGroupCount, setStoryGroupCount] = React.useState(0);

  const handleLoad = ({ nativeEvent }) => setStoryGroupCount(nativeEvent.storyGroupList?.length ?? 0);

  const logStorylyError = ({ nativeEvent }) =>
    reportOrWarn('Storyly error', { message: nativeEvent.errorMessage }, 'error');

  const logStoryOpen = () => dispatch(logEventAction('STORY_OPEN'));

  return (
    <Container $hide={storyGroupCount === 0}>
      {!!renderHeader && renderHeader()}

      <StorylyWithSpacing
        storylyId={getEnv().STORYLY_TOKEN}
        onLoad={handleLoad}
        onFail={logStorylyError}
        onStoryOpen={logStoryOpen}
      />
    </Container>
  );
};

export default Stories;

const Container = styled.View`
  ${({ $hide }) => $hide && 'display: none;'}
`;

const StorylyWithSpacing = styled(Storyly)`
  height: 140px;
  overflow: hidden;
  margin-left: ${spacing.layoutSides}px;
`;
