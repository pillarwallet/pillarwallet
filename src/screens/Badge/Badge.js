// @flow
import * as React from 'react';
import { Platform } from 'react-native';
import { connect } from 'react-redux';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import t from 'translations/translate';

import { fontStyles, spacing } from 'utils/variables';
import { ScrollWrapper } from 'components/Layout';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import BadgeImage from 'components/BadgeImage';
import { MediumText, Paragraph } from 'components/Typography';
import type { Badges } from 'models/Badge';

type Props = {
  badges: Badges,
  navigation: NavigationScreenProp<*>,
};

const BadgeWrapper = styled.View`
  position: relative;
  justify-content: center;
  align-items: center;
  margin: 5px 20px 20px;
  padding-top: ${Platform.select({
    ios: '20px',
    android: '14px',
  })};
`;

const Image = styled(BadgeImage)`
  margin-bottom: ${spacing.rhythm / 2};
`;

const Subtitle = styled(MediumText)`
  padding-top: 40px;
  ${fontStyles.large};
  text-align: center;
`;

const Description = styled(Paragraph)`
  padding-top: 40px;
`;

class Badge extends React.Component<Props, {}> {
  shouldComponentUpdate(nextProps: Props) {
    const { navigation } = this.props;
    const oldBadgeId = navigation.getParam('badgeId', null);
    const newBadgeId = nextProps.navigation.getParam('badgeId', null);
    return oldBadgeId !== newBadgeId;
  }

  render() {
    const { navigation, badges } = this.props;
    const badgeId = navigation.getParam('badgeId', null);
    const passedBadge = navigation.getParam('badge', null);
    const hideDescription = navigation.getParam('hideDescription', false);
    const badge = passedBadge || badges.find(({ badgeId: _badgeId }) => _badgeId === badgeId) || {};
    return (
      <ContainerWithHeader
        headerProps={{
          centerItems: [{ title: badge.name || t('badgesContent.title.unknownBadge') }],
        }}
      >
        <ScrollWrapper>
          <BadgeWrapper>
            <Image data={badge} size="184" />
            {!!badge.subtitle && (
            <Subtitle>
              {badge.subtitle}
            </Subtitle>
            )}
            {!!(badge.description && !hideDescription) && (
            <Description small light>
              {badge.description}
            </Description>
            )}
          </BadgeWrapper>
        </ScrollWrapper>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({ badges: { data: badges } }) => ({ badges });

export default connect(mapStateToProps)(Badge);
