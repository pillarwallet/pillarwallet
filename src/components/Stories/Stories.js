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

import React, { useRef } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components/native';
import { Storyly } from 'storyly-react-native';
import { useNavigation } from 'react-navigation-hooks';
import { Platform } from 'react-native';

// Actions
import { logEventAction } from 'actions/analyticsActions';

// Utils
import { reportOrWarn } from 'utils/common';
import { useThemeColors } from 'utils/themes';
import { spacing } from 'utils/variables';
import { isValidURL } from 'utils/validators';

// Configs
import { getEnv } from 'configs/envConfig';

// Constants
import * as RoutePath from 'constants/navigationConstants';
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';

// Services
import { firebaseRemoteConfig } from 'services/firebase';


const Stories = () => {
  const colors = useThemeColors();

  const [storyGroupCount, setStoryGroupCount] = React.useState(0);

  const dispatch = useDispatch();
  const navigation = useNavigation();
  const storylyRef = useRef();
  const androidStoriesHeight = parseFloat(firebaseRemoteConfig.getString(REMOTE_CONFIG.ANDROID_FEATURE_STORIES_HEIGHT));
  const androidStoriesWidth = parseFloat(firebaseRemoteConfig.getString(REMOTE_CONFIG.ANDROID_FEATURE_STORIES_WIDTH));
  const androidStoriesRadius = parseFloat(
    firebaseRemoteConfig.getString(REMOTE_CONFIG.ANDROID_FEATURE_STORIES_CORNER_RADIUS),
  );
  const iosStoriesHeight = parseFloat(firebaseRemoteConfig.getString(REMOTE_CONFIG.IOS_FEATURE_STORIES_HEIGHT));
  const iosStoriesWidth = parseFloat(firebaseRemoteConfig.getString(REMOTE_CONFIG.IOS_FEATURE_STORIES_WIDTH));
  const iosStoriesRadius = parseFloat(firebaseRemoteConfig.getString(REMOTE_CONFIG.IOS_FEATURE_STORIES_CORNER_RADIUS));

  const handleLoad = ({ nativeEvent }) => setStoryGroupCount(nativeEvent.storyGroupList?.length ?? 0);

  const logStorylyError = ({ nativeEvent }) =>
    reportOrWarn('Storyly error', { message: nativeEvent.errorMessage }, 'error');

  const logStoryOpen = () => dispatch(logEventAction('STORY_OPEN'));

  const storylyOnPressHandler = ({ nativeEvent }) => {
    if (storylyRef.current) {
      storylyRef.current.close();
    }
    const mediaURL = nativeEvent.media?.actionUrl;
    const mediaTitle = nativeEvent.title;
    const pathName = mediaURL ? mediaURL.split('://').pop() : '';
    if (mediaURL && isValidURL(mediaURL)) {
      navigation.navigate(RoutePath.WEB_VIEW, {
        title: mediaTitle,
        url: mediaURL,
      });
    } else {
      Object.keys(RoutePath).includes(pathName) ? navigation.navigate(pathName)
        : reportOrWarn(`Storyly: No navigation route was found while handling a deep link: ${pathName}`);
    }
  };

  return (
    <Container $hide={storyGroupCount === 0}>
      <StorylyWithSpacing
        storylyId={getEnv().STORYLY_TOKEN}
        onLoad={handleLoad}
        onFail={logStorylyError}
        onStoryOpen={logStoryOpen}
        storyGroupTextColor={colors.text}
        onPress={storylyOnPressHandler}
        ref={storylyRef}
        // eslint-disable-next-line i18next/no-literal-string
        storyGroupSize="custom"
        storyGroupIconWidth={Platform.OS === 'ios' ? iosStoriesHeight : androidStoriesHeight}
        storyGroupIconHeight={Platform.OS === 'ios' ? iosStoriesWidth : androidStoriesWidth}
        storyGroupIconCornerRadius={Platform.OS === 'ios' ? iosStoriesRadius : androidStoriesRadius}
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
