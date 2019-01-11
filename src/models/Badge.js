// @flow

export type UserBadgesResponse = {
  [string]: number, // badgeId: balance
};

export type Badge = {
  id: number,
  balance: number,
  name?: string,
  imageUrl?: string,
  subtitle?: string,
  description?: string,
  createdAt?: number,
  updatedAt?: number,
  receivedAt?: number
};

export type Badges = Badge[];

export type BadgesInfoResponse = {
  [string]: { // badgeId
    id: number,
    name: string,
    imageUrl: string,
    subtitle?: string,
    description?: string,
    createdAt: number,
    updatedAt: number,
    receivedAt: number
  },
};
