// @flow
import { v4 as uuid } from 'uuid';

export function generateAccessKey(): string {
  return uuid();
}
