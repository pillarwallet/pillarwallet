// @flow

export type Badge = {
  id: number,
  badgeId: string,
  balance: number,
  name?: string,
  imageUrl?: string,
  subtitle?: string,
  description?: string,
  createdAt?: number,
  updatedAt?: number,
  receivedAt?: number,
};

export type Badges = Badge[];

export type UserBadgesResponse = Array<{
  id: number,
  name: string,
  imageUrl: string,
  subtitle?: string,
  description?: string,
  createdAt: number,
  updatedAt: number,
  receivedAt: number,
}>;

export type SelfAwardBadgeResponse = {
  result: string,
  message: string,
};

export type BadgeRewardEvent = {
  id: string,
  type: string,
  name: string,
  createdAt: number,
  badgeId: string,
  imageUrl: string,
  badgeType: string,
};
