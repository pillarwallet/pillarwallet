// @flow
import * as React from 'react';
import { Wrapper } from 'components/Layout';
import { withTheme } from 'styled-components';
import Loader from 'components/Loader';
import { getThemeColors } from 'utils/themes';
import type { Theme } from 'models/Theme';

type Props = {
  theme: Theme,
}

const LogoutPending = (props: Props) => {
  const { theme } = props;
  const colors = getThemeColors(theme);
  return (
    <Wrapper fullscreen center style={{ backgroundColor: colors.surface }}>
      <Loader messages={['Deleting takes a moment', 'Sorry to see you go']} firstMessageWithoutDelay />
    </Wrapper>
  );
};

export default withTheme(LogoutPending);
