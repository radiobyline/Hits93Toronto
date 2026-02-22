import SwiftUI

struct MoreView: View {
    @ObservedObject var settingsVM: SettingsViewModel
    @ObservedObject var playerVM: PlayerViewModel
    
    var body: some View {
        NavigationStack {
            List {
                Section("Quick Actions") {
                    NavigationLink("Request a Song", destination: RequestView())
                    NavigationLink("Contact Us", destination: ContactView())
                }
                
                Section("Features") {
                    NavigationLink("Notifications", destination: NotificationsView())
                    NavigationLink("Games", destination: GamesView())
                    NavigationLink("Episode Archive", destination: EpisodeArchiveView())
                }
                
                Section("Settings") {
                    Toggle("Play on Launch", isOn: Binding(
                        get: { settingsVM.playOnLaunch },
                        set: { settingsVM.updatePlayOnLaunch($0) }
                    ))
                    
                    Picker("Timezone", selection: Binding(
                        get: { settingsVM.selectedTimezoneID },
                        set: { settingsVM.updateTimezone($0) }
                    )) {
                        ForEach(settingsVM.availableTimezones, id: \.self) { tz in
                            Text(tz).tag(tz)
                        }
                    }
                    
                    Toggle("Push Notifications", isOn: Binding(
                        get: { settingsVM.pushNotificationsEnabled },
                        set: { settingsVM.updatePushNotifications($0) }
                    ))
                }
                
                Section("App") {
                    NavigationLink("Diagnostics", destination: DiagnosticsView())
                    
                    HStack {
                        Text("Version")
                        Spacer()
                        Text(settingsVM.appVersion)
                            .foregroundColor(.secondary)
                    }
                    
                    Link("Privacy Policy", destination: URL(string: "https://hits93toronto.com/privacy")!)
                    Link("Terms of Service", destination: URL(string: "https://hits93toronto.com/terms")!)
                }
                
                Section("About") {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("First Nations Acknowledgement")
                            .font(.headline)
                        
                        Text("Hits 93 Toronto operates on the ancestral lands of the Haudenosaunee, Anishinaabek, and other Indigenous peoples.")
                            .font(.caption)
                            .lineLimit(5)
                    }
                }
            }
            .navigationTitle("More")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

// MARK: - Phase 4: Request & Contact

struct RequestView: View {
    @State private var artistName = ""
    @State private var songTitle = ""
    @State private var message = ""
    @State private var showSuccess = false
    
    var body: some View {
        List {
            Section("Song Details") {
                TextField("Artist", text: $artistName)
                TextField("Song Title", text: $songTitle)
            }
            
            Section("Message") {
                TextEditor(text: $message)
                    .frame(height: 100)
            }
            
            Section {
                Button("Submit Request") {
                    // TODO: Post to jukebox/request endpoint
                    showSuccess = true
                }
                .frame(maxWidth: .infinity)
                .foregroundColor(.white)
            }
        }
        .navigationTitle("Request a Song")
        .navigationBarTitleDisplayMode(.inline)
        .alert("Request Submitted", isPresented: $showSuccess) {
            Button("OK") { }
        }
    }
}

struct ContactView: View {
    @State private var name = ""
    @State private var email = ""
    @State private var subject = ""
    @State private var message = ""
    @State private var showSuccess = false
    
    var body: some View {
        List {
            Section("Contact Information") {
                TextField("Name", text: $name)
                TextField("Email", text: $email)
            }
            
            Section("Message") {
                TextField("Subject", text: $subject)
                TextEditor(text: $message)
                    .frame(height: 100)
            }
            
            Section {
                Button("Send") {
                    // TODO: Post to contact endpoint
                    showSuccess = true
                }
                .frame(maxWidth: .infinity)
                .foregroundColor(.white)
            }
        }
        .navigationTitle("Contact Us")
        .navigationBarTitleDisplayMode(.inline)
        .alert("Message Sent", isPresented: $showSuccess) {
            Button("OK") { }
        }
    }
}

// MARK: - Phase 5: Notifications

struct NotificationsView: View {
    @State private var announcementsEnabled = true
    @State private var chartsEnabled = true
    @State private var gamesEnabled = true
    @State private var specialsEnabled = true
    
    var body: some View {
        List {
            Section("Notification Categories") {
                Toggle("Announcements", isOn: $announcementsEnabled)
                Toggle("Charts", isOn: $chartsEnabled)
                Toggle("Games", isOn: $gamesEnabled)
                Toggle("Specials & Live Events", isOn: $specialsEnabled)
            }
            
            Section {
                Text("Programme starting soon reminders")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Text("New Music Friday")
                    .font(.caption)
                    .foregroundColor(.secondary)
            } header: {
                Text("Upcoming")
            }
        }
        .navigationTitle("Notifications")
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Phase 7: Games

struct GamesView: View {
    var body: some View {
        List {
            VStack(spacing: 12) {
                Image(systemName: "gamecontroller.fill")
                    .font(.system(size: 48))
                    .foregroundColor(.gray)
                
                Text("Games Coming Soon")
                    .font(.headline)
                
                Text("Interactive games and challenges will be available here")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .frame(maxWidth: .infinity)
            .padding()
        }
        .navigationTitle("Games")
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Phase 6: Episode Archive

struct EpisodeArchiveView: View {
    var body: some View {
        List {
            VStack(spacing: 12) {
                Image(systemName: "archivebox.fill")
                    .font(.system(size: 48))
                    .foregroundColor(.gray)
                
                Text("Episode Archive")
                    .font(.headline)
                
                Text("Recorded episodes and playlists coming soon")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .frame(maxWidth: .infinity)
            .padding()
        }
        .navigationTitle("Episodes")
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Phase 9: Diagnostics

struct DiagnosticsView: View {
    @State private var wifiStatus = "Connected"
    @State private var approximateLocation = "Toronto, ON"
    @State private var storageAvailable = "256 GB"
    @State private var notificationStatus = "Enabled"
    
    var body: some View {
        List {
            Section("Network") {
                HStack {
                    Label("Wi-Fi Status", systemImage: "wifi")
                    Spacer()
                    Text(wifiStatus)
                        .foregroundColor(.secondary)
                }
            }
            
            Section("Location") {
                HStack {
                    Label("Approximate Location", systemImage: "location.fill")
                    Spacer()
                    Text(approximateLocation)
                        .foregroundColor(.secondary)
                }
            }
            
            Section("Storage") {
                HStack {
                    Label("Available Storage", systemImage: "internaldrive")
                    Spacer()
                    Text(storageAvailable)
                        .foregroundColor(.secondary)
                }
            }
            
            Section("Permissions") {
                HStack {
                    Label("Notifications", systemImage: "bell.fill")
                    Spacer()
                    Text(notificationStatus)
                        .foregroundColor(.secondary)
                }
            }
        }
        .navigationTitle("Diagnostics")
        .navigationBarTitleDisplayMode(.inline)
    }
}

#Preview {
    let audioService = AudioService()
    return MoreView(
        settingsVM: SettingsViewModel(),
        playerVM: PlayerViewModel(audioService: audioService)
    )
}
