import SwiftUI

struct MainTabView: View {
    @ObservedObject var playerVM: PlayerViewModel
    @ObservedObject var scheduleVM: ScheduleViewModel
    @ObservedObject var historyVM: HistoryViewModel
    @ObservedObject var settingsVM: SettingsViewModel
    @Binding var selectedTab: TabDestination
    
    var body: some View {
        TabView(selection: $selectedTab) {
            // Live Player
            LivePlayerView(playerVM: playerVM)
                .tabItem {
                    Label("Live", systemImage: "play.circle.fill")
                }
                .tag(TabDestination.live)
            
            // Recently Played
            HistoryView(historyVM: historyVM, playerVM: playerVM)
                .tabItem {
                    Label("Played", systemImage: "clock.fill")
                }
                .tag(TabDestination.recentlyPlayed)
            
            // Schedule
            ScheduleView(scheduleVM: scheduleVM, playerVM: playerVM)
                .tabItem {
                    Label("Schedule", systemImage: "calendar")
                }
                .tag(TabDestination.schedule)
            
            // Programmes (Stub for Phase 4)
            ProgrammesView()
                .tabItem {
                    Label("Programmes", systemImage: "radio")
                }
                .tag(TabDestination.programmes)
            
            // Settings & More
            MoreView(settingsVM: settingsVM, playerVM: playerVM)
                .tabItem {
                    Label("More", systemImage: "ellipsis")
                }
                .tag(TabDestination.more)
        }
        .accentColor(.red)
    }
}

#Preview {
    let audioService = AudioService()
    return MainTabView(
        playerVM: PlayerViewModel(audioService: audioService),
        scheduleVM: ScheduleViewModel(),
        historyVM: HistoryViewModel(),
        settingsVM: SettingsViewModel(),
        selectedTab: .constant(.live)
    )
}
