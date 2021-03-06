declare namespace VSync {

    interface SeriesBase {
        name: string

        host: string
        pathbase: string
        protocol: Protocol

        startTime: number
        endTime: number

        currentTime: number
        currentMaxTime: number
        currentPath: string

        videoPlayerHost?: string
        nextButton?: FrameElement

        autoplay: boolean

        latestFrame?: string
    }

    interface Series extends SeriesBase {
        key: string
    }

    interface Settings {
        locale: string
        theme: string
    }

    interface FrameElement {
        host: string
        query: string
    }

    interface User {
        displayName: string
        photoURL: string
        uid: string
        role: 'user' | 'premium' | 'admin'
    }

    type Protocol = 'http' | 'https'
}