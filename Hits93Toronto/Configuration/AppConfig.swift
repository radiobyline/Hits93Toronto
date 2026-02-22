import Foundation

/// Centralized app configuration: endpoints, feature flags, defaults.
struct AppConfig {
    // MARK: - API Endpoints
    
    static let stationAPIBaseURL = "https://hits93toronto.com:2490/api/v2"
    static let iTunesSearchBaseURL = "https://itunes.apple.com/search"
    static let episodeArchiveBaseURL = "https://hits93-episode-archive.viktor-elias.workers.dev"
    
    // MARK: - Stream Configuration
    
    /// Primary Icecast stream URL. Replace with actual stream endpoint.
    static let primaryStreamURL = "https://hits93toronto.com:2955/stream"
    
    /// Available streams for multi-stream support (Phase 1+).
    static let availableStreams: [StreamConfiguration] = [
        StreamConfiguration(
            name: "Hits 93 Toronto",
            url: AppConfig.primaryStreamURL,
            isDefault: true
        )
    ]
    
    // MARK: - Feature Flags
    
    /// Enable/disable live player features.
    static let enableLivePlayer = true
    
    /// Enable/disable schedule grid.
    static let enableScheduleGrid = true
    
    /// Enable/disable recently played history.
    static let enableHistoryTracking = true
    
    /// Enable/disable AI features (Phase 8).
    static let enableAIFeatures = false
    
    /// Enable/disable episode archive integration (Phase 6).
    static let enableEpisodeArchive = true
    
    // MARK: - API Defaults
    
    /// All station API calls include server=1 parameter.
    static let serverParam = "1"
    
    /// Default timezone for schedule and time display.
    static let defaultTimezone = TimeZone(identifier: "America/Toronto") ?? TimeZone.current
    
    /// History fetch batch size.
    static let historyBatchSize = 50
    
    /// Now Playing poll batch size.
    static let nowPlayingLimit = 8
    
    /// iTunes Search preview fetch limit per track.
    static let iTunesSearchLimit = 1
    
    // MARK: - UI Defaults
    
    /// Mini-player height in points.
    static let miniPlayerHeight: CGFloat = 60
    
    /// Schedule grid days to fetch on load.
    static let scheduleGridDaysToFetch = 7
    
    /// Recently Played items shown in main view before "show more".
    static let recentlyPlayedPreviewCount = 10
    
    // MARK: - Persistence
    
    /// UserDefaults suite name for app data.
    static let userDefaultsSuite = "com.hits93toronto.app"
    
    /// Local like/dislike storage key prefix.
    static let trackLikeDislikeKeyPrefix = "track_interaction_"
    
    // MARK: - Version & Branding
    
    static let appName = "Hits 93 Toronto"
    static let appVersion = "1.0"
    static let appBuild = "1"
    
    // MARK: - Timeouts
    
    static let defaultAPITimeout: TimeInterval = 10.0
    static let streamConnectTimeout: TimeInterval = 15.0
    
    // MARK: - Helper: Active Stream
    
    static func activeStream() -> StreamConfiguration {
        availableStreams.first(where: { $0.isDefault }) ?? availableStreams.first ?? StreamConfiguration.default()
    }
}

// MARK: - StreamConfiguration

struct StreamConfiguration: Identifiable, Codable {
    let id: UUID
    let name: String
    let url: String
    let isDefault: Bool
    
    init(id: UUID = UUID(), name: String, url: String, isDefault: Bool = false) {
        self.id = id
        self.name = name
        self.url = url
        self.isDefault = isDefault
    }
    
    static func `default`() -> StreamConfiguration {
        StreamConfiguration(
            name: "Hits 93 Toronto",
            url: AppConfig.primaryStreamURL,
            isDefault: true
        )
    }
}
