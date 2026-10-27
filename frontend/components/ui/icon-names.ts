// Every Material Symbol the app renders. Only these glyphs are downloaded (see app/layout.tsx),
// so a new icon has to be added here; the IconName type makes TypeScript enforce it.
export const ICON_NAMES = [
  'add', 'add_comment', 'bolt', 'chat_bubble', 'key', 'more_horiz', 'settings', 'arrow_back', 'alternate_email', 'api', 'arrow_upward', 'article', 'attach_file', 'auto_fix_high',
  'badge', 'check', 'check_circle', 'chevron_right', 'close', 'cloud_upload', 'content_copy', 'database',
  'delete', 'description', 'edit', 'error', 'expand_more', 'filter_alt', 'folder_managed', 'folder_open',
  'format_quote', 'forum', 'gavel', 'help', 'image', 'info', 'lightbulb', 'lock', 'lock_reset', 'logout',
  'mail', 'menu', 'menu_book', 'person', 'picture_as_pdf', 'refresh', 'right_panel_open', 'search',
  'select_all', 'smart_toy', 'stop_circle', 'support_agent', 'table_chart', 'tune', 'upload_file', 'verified',
  'verified_user', 'visibility', 'visibility_off', 'warning',
] as const

export type IconName = typeof ICON_NAMES[number]

// Google Fonts needs icon_names sorted alphabetically
export const ICON_FONT_URL =
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,400,0..1,0'
  + `&icon_names=${[...ICON_NAMES].sort().join(',')}&display=block`
