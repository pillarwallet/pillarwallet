// @flow
import * as React from 'react';
import isEqualWith from 'lodash.isequalwith';
import { baseColors, fontSizes } from 'utils/variables';
import ProfileImage from 'components/ProfileImage';
import Button from 'components/Button';
import { Shadow } from 'components/Shadow';
import { Wrapper } from 'components/Layout';

import * as styled from './styles';
import { ACTION, CHAT_ITEM, DEFAULT } from './constants';

type Props = {
  label: string,
  navigateToProfile?: ?Function,
  subtext?: string,
  paragraph?: string,
  paragraphLines?: string,
  customAddon?: React.Node,
  onPress?: Function,
  avatarUrl?: string,
  iconName?: ?string,
  itemImageUrl?: string,
  fallbackSource?: string,
  timeSent?: string,
  unreadCount?: number,
  itemValue?: string,
  itemStatusIcon?: string,
  valueColor?: ?string,
  buttonActionLabel?: string,
  labelAsButton?: boolean,
  buttonAction?: Function,
  secondaryButton?: boolean,
  actionLabel?: ?string,
  rejectInvitation?: ?Function,
  acceptInvitation?: ?Function,
  type?: string,
}

const ItemImage = (props: Props) => {
  const {
    label,
    avatarUrl,
    iconName,
    itemImageUrl,
    fallbackSource,
    navigateToProfile,
    type,
  } = props;

  if (iconName) {
    const warm = iconName === 'sent';
    return (
      <styled.IconCircle warm={warm}>
        <styled.ItemIcon name={iconName} warm={warm} />
      </styled.IconCircle>
    );
  }
  if (itemImageUrl) {
    return (
      <Shadow
        shadowColorAndroid="#38105baa"
        heightAndroid={54}
        widthAndroid={54}
        heightIOS={48}
        widthIOS={48}
        shadowRadius={24}
      >
        <styled.TokenImageWrapper>
          <styled.TokenImage source={{ uri: itemImageUrl }} fallbackSource={fallbackSource} />
        </styled.TokenImageWrapper>
      </Shadow>
    );
  }
  return (
    <ProfileImage
      onPress={navigateToProfile}
      uri={avatarUrl}
      userName={label}
      diameter={type === ACTION ? 52 : 50}
      borderWidth={type === ACTION ? 0 : 2}
      textStyle={{ fontSize: fontSizes.medium }}
      noShadow={type === ACTION}
    />
  );
};

const Addon = (props: Props) => {
  const {
    type,
    unreadCount,
    itemValue,
    itemStatusIcon,
    valueColor,
    buttonActionLabel,
    labelAsButton,
    buttonAction,
    secondaryButton,
    actionLabel,
    rejectInvitation,
    acceptInvitation,
  } = props;

  if (itemValue) {
    return (
      <Wrapper horizontal center>
        <styled.ItemValue color={valueColor}>
          {itemValue}
        </styled.ItemValue>
        {!!itemStatusIcon &&
          <styled.ItemValueStatus name={itemStatusIcon} />
        }
      </Wrapper>
    );
  }

  if (actionLabel) {
    return (
      <styled.ActionLabel button={labelAsButton}>
        <styled.ActionLabelText button={labelAsButton}>
          {actionLabel}
        </styled.ActionLabelText>
      </styled.ActionLabel>
    );
  }

  if (type !== CHAT_ITEM && unreadCount) {
    return (
      <styled.IndicatorsRow>
        <styled.ItemBadge>
          <styled.UnreadNumber>
            {unreadCount}
          </styled.UnreadNumber>
        </styled.ItemBadge>
      </styled.IndicatorsRow>
    );
  }

  if (buttonActionLabel) {
    return (
      <Button
        title={buttonActionLabel}
        onPress={buttonAction}
        small
        primaryInverted={secondaryButton}
        listItemButton
      />
    );
  }

  if (rejectInvitation && acceptInvitation) {
    return (
      <styled.ButtonIconWrapper>
        <styled.ActionCircleButton
          color={baseColors.darkGray}
          margin={0}
          icon="close"
          fontSize={fontSizes.extraSmall}
          onPress={rejectInvitation}
        />
        <styled.ActionCircleButton
          color={baseColors.white}
          margin={0}
          accept
          icon="check"
          fontSize={fontSizes.extraSmall}
          onPress={acceptInvitation}
        />
      </styled.ButtonIconWrapper>
    );
  }

  return null;
};

const getType = (props: Props) => {
  if (props.subtext || props.iconName) {
    return ACTION;
  }
  if (props.paragraph) {
    return CHAT_ITEM;
  }
  return DEFAULT;
};

class ListItemWithImage extends React.Component<Props, {}> {
  shouldComponentUpdate(nextProps: Props) {
    const isEq = isEqualWith(this.props, nextProps, (val1, val2) => {
      if (typeof val1 === 'function' && typeof val2 === 'function') return true;
      return undefined;
    });
    return !isEq;
  }

  render() {
    const {
      label,
      subtext,
      paragraph,
      paragraphLines = 2,
      customAddon,
      onPress,
      timeSent,
      unreadCount,
    } = this.props;

    const type = getType(this.props);
    return (
      <styled.ItemWrapper
        type={type}
        onPress={onPress}
        disabled={!onPress}
      >
        <styled.ImageWrapper>
          <ItemImage {...this.props} type={type} />
        </styled.ImageWrapper>
        <styled.InfoWrapper type={type}>
          <styled.Column type={type}>
            {!!label &&
              <styled.Row>
                <styled.ItemTitle type={type}>{label}</styled.ItemTitle>
                {(type === CHAT_ITEM && !!timeSent) &&
                  <styled.TimeWrapper>
                    <styled.TimeSent>{timeSent}</styled.TimeSent>
                  </styled.TimeWrapper>
                }
              </styled.Row>
            }
            {!!paragraph &&
              <styled.Row>
                <styled.ItemParagraph numberOfLines={paragraphLines}>{paragraph}</styled.ItemParagraph>
                {type === CHAT_ITEM &&
                  <styled.BadgePlacer>
                    {!!unreadCount &&
                      <styled.ItemBadge>
                        <styled.UnreadNumber>
                          {unreadCount}
                        </styled.UnreadNumber>
                      </styled.ItemBadge>
                    }
                  </styled.BadgePlacer>
                }
              </styled.Row>
            }
            {!!subtext &&
              <styled.ItemSubText numberOfLines={1}>{subtext}</styled.ItemSubText>
            }
          </styled.Column>
          <styled.Column rightColumn type={type}>
            <Addon {...this.props} type={type} />
            {customAddon}
          </styled.Column>
        </styled.InfoWrapper>
      </styled.ItemWrapper>
    );
  }
}

export default ListItemWithImage;
