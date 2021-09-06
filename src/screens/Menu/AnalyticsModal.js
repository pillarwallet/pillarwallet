// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

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
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components/native';
import t from 'translations/translate';

import { saveOptOutTrackingAction } from 'actions/appSettingsActions';

import SlideModal from 'components/Modals/SlideModal';
import { Wrapper } from 'components/legacy/Layout';
import { BaseText } from 'components/legacy/Typography';
import Checkbox from 'components/legacy/Checkbox';

import { spacing, fontStyles, fontTrackings } from 'utils/variables';

import type { RootReducerState } from 'reducers/rootReducer';

const optOutTrackingSelector = ({
  appSettings: {
    data: {
      optOutTracking = false,
    },
  },
}: RootReducerState) => optOutTracking;

const StyledWrapper = styled(Wrapper)`
  justify-content: space-between;
  padding-bottom: ${spacing.rhythm}px;
  margin-top: ${spacing.medium}px;
`;

const SmallText = styled(BaseText)`
  ${fontStyles.regular};
  margin-top: 2px;
  letter-spacing: ${fontTrackings.small}px;
`;

const CheckboxText = styled(BaseText)`
  ${fontStyles.medium};
  margin-top: 2px;
  letter-spacing: ${fontTrackings.small}px;
  margin-bottom: ${spacing.medium}px;
`;

const AnalyticsModal = () => {
  const dispatch = useDispatch();
  const optOutTracking = useSelector(optOutTrackingSelector);
  const toggleOptOutTracking = () => dispatch(saveOptOutTrackingAction(!optOutTracking));

  const modalRef = useRef();

  return (
    <SlideModal
      ref={modalRef}
      fullScreen
      showHeader
      avoidKeyboard
      title={t('settingsContent.settingsItem.analytics.title')}
      insetTop
    >
      <Wrapper regularPadding flex={1}>
        <StyledWrapper>
          <Checkbox
            checked={!optOutTracking}
            onPress={toggleOptOutTracking}
            wrapperStyle={{ marginBottom: spacing.large }}
          >
            <CheckboxText>
              {t('settingsContent.settingsItem.analytics.paragraph.agreeSharingInfo')}
            </CheckboxText>
          </Checkbox>
          <SmallText>
            {t('settingsContent.settingsItem.analytics.paragraph.legal')}
          </SmallText>
        </StyledWrapper>
      </Wrapper>
    </SlideModal>
  );
};

export default AnalyticsModal;
