import { GU } from '@aragon/ui'

export const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

export const APPS_MENU_PANEL = [
  'blossom-token-wrapper',
  'blossom-tao-voting',
  'delay',
  'finance',
  'an-delay',
]

export const APPS_ROUTING = new Map([
  ['blossom-token-wrapper', 'wrapper'],
  ['blossom-tao-voting', 'voting'],
  ['delay', 'delay'],
  ['finance', 'finance'],
  ['an-delay', 'delay'],
])

export const APPS_ROUTING_TO_NAME = new Map([
  ['wrapper', 'blossom-token-wrapper'],
  ['voting', 'blossom-tao-voting'],
  ['delay', 'delay'],
  ['finance', 'finance'],
])

export const APP_CUSTOM_NAME = new Map([['Tao Voting', 'Delegate Voting']])

export const MAIN_HEADER_HEIGHT = 8 * GU
