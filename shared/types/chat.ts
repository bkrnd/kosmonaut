export type TimelineType = 'message' | 'user_joined' | 'user_left'

export type UserId = string

export interface TimelineEntryBase {
    id: string
    createdAt: Date
    type: TimelineType
    userId: UserId
}

export interface MessageEntry extends TimelineEntryBase {
    type: 'message'
    text: string
}

export interface UserJoinedEntry extends TimelineEntryBase {
    type: 'user_joined'
}

export interface UserLeftEntry extends TimelineEntryBase {
    type: 'user_left'
}

export type TimelineEntry = MessageEntry | UserJoinedEntry | UserLeftEntry


export type ClientEvent =
    | { type: 'send_message'; text: string }
    | { type: 'typing'; isTyping: boolean }

export type ServerEvent =
    | { type: 'welcome'; userId: UserId }
    | { type: 'timeline'; entries: TimelineEntry[] }
    | { type: 'entry_created'; entry: TimelineEntry }
    | { type: 'typing'; userId: UserId; isTyping: boolean }