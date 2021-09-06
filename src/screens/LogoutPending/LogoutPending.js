// @flow
import * as React from 'react';
import { withTheme } from 'styled-components/native';
import t from 'translations/translate';

import Loader from 'components/Loader';
import { Wrapper } from 'components/legacy/Layout';
import { getThemeColors } from 'utils/themes';
import type { Theme } from 'models/Theme';

type Props = {
  theme: Theme,
}

const LogoutPending = (props: Props) => {
  const { theme } = props;
  const colors = getThemeColors(theme);
  return (
    <Wrapper fullscreen center style={{ backgroundColor: colors.basic070 }}>
      <Loader
        messages={[t('paragraph.loggingOutFirstMessage'), t('paragraph.loggingOutSecondMessage')]}
        firstMessageWithoutDelay
      />
    </Wrapper>
  );
};

export default withTheme(LogoutPending);
