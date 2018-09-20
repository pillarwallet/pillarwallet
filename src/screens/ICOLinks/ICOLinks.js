// @flow
import * as React from 'react';
import {
  View,
  TouchableNativeFeedback,
  TouchableOpacity,
  Platform,
  Linking,
} from 'react-native';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { baseColors, fontSizes, spacing, fontTrackings } from 'utils/variables';
import { BaseText } from 'components/Typography';
import Icon from 'components/Icon';
import Header from 'components/Header';
import { Container, Wrapper } from 'components/Layout';

type Props = {
  navigation: NavigationScreenProp<*>,
}
type State = {};

const StyledFlatList = styled.FlatList`
  margin-bottom: ${spacing.rhythm}px;
  border-top-width: 1px;
  border-bottom-width: 1px;
  border-color: ${baseColors.lightGray};
`;

const ListRow = styled(View)`
  width: 100%;
  padding: 22px ${spacing.rhythm}px;
  flex-direction: row;
  background-color: ${baseColors.white};
  align-items: center;
  justify-content: space-between;
`;

const ListRowItem = styled(BaseText)`
  width: 50%;
  padding-right: ${spacing.rhythm}px;
  font-size: ${fontSizes.small}px;
  letter-spacing: ${fontTrackings.tiny}px;
  line-height: ${fontSizes.medium}px;
  color: ${props => props.label ? baseColors.slateBlack : baseColors.darkGray};
`;

const SeparatorWrapper = styled(View)`
  width: 100%;
  padding-left: ${props => props.horizonalPadding ? spacing.rhythm : 0}px;
  padding-right: ${props => props.horizonalPadding ? spacing.rhythm : 0}px;
  flex-direction: row;
`;

const Separator = styled(View)`
  width: 100%;
  height: 1px;
  background-color: ${baseColors.lightGray}
`;

class ICOLinks extends React.Component<Props, State> {
  navigateBack = () => {
    this.props.navigation.goBack();
  };

  openLink = (address: string) => {
    Linking.openURL(address).catch(() => {});
  };

  renderExternalLinksItem = ({ item: link }: Object) => {
    if (Platform.OS === 'android') {
      return (
        <TouchableNativeFeedback
          onPress={() => this.openLink(link.link)}
          background={TouchableNativeFeedback.Ripple()}
        >
          <ListRow>
            <ListRowItem label>
              {link.label}
            </ListRowItem>
            <Icon
              name="chevron-right"
              style={{
                fontSize: fontSizes.tiny,
                color: baseColors.coolGrey,
              }}
            />
          </ListRow>
        </TouchableNativeFeedback>
      );
    }
    return (
      <TouchableOpacity
        onPress={() => this.openLink(link.link)}
        underlayColor={baseColors.lightGray}
      >
        <ListRow>
          <ListRowItem label>
            {link.label}
          </ListRowItem>
          <Icon
            name="chevron-right"
            style={{
              fontSize: fontSizes.tiny,
              color: baseColors.coolGrey,
            }}
          />
        </ListRow>
      </TouchableOpacity>
    );
  };

  renderSeparator = () => {
    return (
      <SeparatorWrapper>
        <Separator />
      </SeparatorWrapper>
    );
  };

  render() {
    // const { navigation } = this.props;
    // const { links } = navigation.state.params;

    const externalLinks = [
      {
        label: 'Link 1',
        link: 'https://pillarproject.io/',
      },
      {
        label: 'Link 2',
        link: 'https://pillarproject.io/wallet',
      },
    ];

    // TODO: change StyledFlatList data to passed links
    return (
      <Container color={baseColors.snowWhite}>
        <Header onBack={this.navigateBack} title="links" />
        <Wrapper>
          <StyledFlatList
            keyExtractor={item => item.label}
            data={externalLinks}
            extraData={this.state}
            renderItem={this.renderExternalLinksItem}
            ItemSeparatorComponent={() => this.renderSeparator()}
            contentContainerStyle={{
              flexGrow: 1,
              backgroundColor: baseColors.white,
            }}
            refreshing={false}
          />
        </Wrapper>
      </Container>
    );
  }
}

export default ICOLinks;
