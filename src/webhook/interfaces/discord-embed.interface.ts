export interface DiscordEmbedI {
    title?: string
    description?: string
    url?: string
    color?: number
    timestamp?: string

    footer?: {
        text: string
        icon_url?: string
    }

    thumbnail?: {
        url: string
    }

    image?: {
        url: string
    }

    author?: {
        name: string
        url?: string
        icon_url?: string
    }

    fields?: Array<{
        name: string
        value: string
        inline?: boolean
    }>
}
