import Foundation

final class LocalStorageService {
    static let shared = LocalStorageService()
    
    private let defaults = UserDefaults(suiteName: AppConfig.userDefaultsSuite) ?? UserDefaults.standard
    
    // MARK: - Like/Dislike Persistence
    
    func saveLikeDislikeState(_ state: LikeDislikeState, for trackID: String) {
        let key = AppConfig.trackLikeDislikeKeyPrefix + trackID
        defaults.set(state.rawValue, forKey: key)
    }
    
    func loadLikeDislikeState(for trackID: String) -> LikeDislikeState {
        let key = AppConfig.trackLikeDislikeKeyPrefix + trackID
        guard let rawValue = defaults.string(forKey: key),
              let state = LikeDislikeState(rawValue: rawValue) else {
            return .none
        }
        return state
    }
    
    // MARK: - Recently Played Cache
    
    func saveRecentlyPlayed(_ tracks: [Track]) {
        let encoder = JSONEncoder()
        if let data = try? encoder.encode(tracks) {
            defaults.set(data, forKey: "recently_played_cache")
        }
    }
    
    func loadRecentlyPlayed() -> [Track]? {
        guard let data = defaults.data(forKey: "recently_played_cache") else {
            return nil
        }
        let decoder = JSONDecoder()
        return try? decoder.decode([Track].self, from: data)
    }
    
    // MARK: - Schedule Cache
    
    func saveSchedule(_ programmes: [Programme], for date: Date) {
        let encoder = JSONEncoder()
        let dayKey = Calendar.current.component(.day, from: date)
        let cacheKey = "schedule_cache_day_\(dayKey)"
        
        if let data = try? encoder.encode(programmes) {
            defaults.set(data, forKey: cacheKey)
        }
    }
    
    func loadSchedule(for date: Date) -> [Programme]? {
        let dayKey = Calendar.current.component(.day, from: date)
        let cacheKey = "schedule_cache_day_\(dayKey)"
        
        guard let data = defaults.data(forKey: cacheKey) else {
            return nil
        }
        let decoder = JSONDecoder()
        return try? decoder.decode([Programme].self, from: data)
    }
    
    // MARK: - Settings
    
    var playOnLaunch: Bool {
        get { defaults.bool(forKey: "play_on_launch") }
        set { defaults.set(newValue, forKey: "play_on_launch") }
    }
    
    var selectedTimezone: TimeZone {
        get {
            if let tzID = defaults.string(forKey: "selected_timezone"),
               let tz = TimeZone(identifier: tzID) {
                return tz
            }
            return AppConfig.defaultTimezone
        }
        set {
            defaults.set(newValue.identifier, forKey: "selected_timezone")
        }
    }
    
    var pushNotificationsEnabled: Bool {
        get { defaults.bool(forKey: "push_notifications_enabled") }
        set { defaults.set(newValue, forKey: "push_notifications_enabled") }
    }
    
    var preferredAirPlayDevice: String? {
        get { defaults.string(forKey: "preferred_airplay_device") }
        set { defaults.set(newValue, forKey: "preferred_airplay_device") }
    }
    
    // MARK: - Sleep Timer
    
    var sleepTimerDuration: TimeInterval {
        get { defaults.double(forKey: "sleep_timer_duration") }
        set { defaults.set(newValue, forKey: "sleep_timer_duration") }
    }
    
    // MARK: - Last Playback Position
    
    var lastStreamURL: String {
        get { defaults.string(forKey: "last_stream_url") ?? AppConfig.primaryStreamURL }
        set { defaults.set(newValue, forKey: "last_stream_url") }
    }
    
    // MARK: - Acceptance Flags
    
    var hasAcceptedPrivacyPolicy: Bool {
        get { defaults.bool(forKey: "accepted_privacy_policy") }
        set { defaults.set(newValue, forKey: "accepted_privacy_policy") }
    }
    
    var hasSeenOnboarding: Bool {
        get { defaults.bool(forKey: "seen_onboarding") }
        set { defaults.set(newValue, forKey: "seen_onboarding") }
    }
}
