import Foundation
import Combine

@MainActor
final class SettingsViewModel: ObservableObject {
    @Published var playOnLaunch: Bool
    @Published var selectedTimezoneID: String
    @Published var pushNotificationsEnabled: Bool
    @Published var appVersion: String = "\(AppConfig.appVersion) (Build \(AppConfig.appBuild))"
    
    private let storage = LocalStorageService.shared
    
    init() {
        self.playOnLaunch = storage.playOnLaunch
        self.selectedTimezoneID = storage.selectedTimezone.identifier
        self.pushNotificationsEnabled = storage.pushNotificationsEnabled
    }
    
    func updatePlayOnLaunch(_ value: Bool) {
        playOnLaunch = value
        storage.playOnLaunch = value
    }
    
    func updateTimezone(_ tzID: String) {
        selectedTimezoneID = tzID
        if let tz = TimeZone(identifier: tzID) {
            storage.selectedTimezone = tz
        }
    }
    
    func updatePushNotifications(_ value: Bool) {
        pushNotificationsEnabled = value
        storage.pushNotificationsEnabled = value
        
        // TODO: Request/revoke notification permissions
    }
    
    var availableTimezones: [String] {
        TimeZone.knownTimeZoneIdentifiers
            .filter { $0.contains("/") }  // Filter to common timezones
            .sorted()
    }
}
