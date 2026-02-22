import SwiftUI

@main
struct Hits93TorontoApp: App {
    @StateObject private var audioService = AudioService()
    @StateObject private var playerVM: PlayerViewModel
    @StateObject private var scheduleVM = ScheduleViewModel()
    @StateObject private var historyVM = HistoryViewModel()
    @StateObject private var settingsVM = SettingsViewModel()
    
    init() {
        let audio = AudioService()
        _audioService = StateObject(wrappedValue: audio)
        _playerVM = StateObject(wrappedValue: PlayerViewModel(audioService: audio))
    }
    
    @State private var selectedTab: TabDestination = .live
    @State private var showMiniPlayer = false
    @State private var miniPlayerHeight: CGFloat = AppConfig.miniPlayerHeight
    
    var body: some Scene {
        WindowGroup {
            ZStack {
                // Main Tab View
                MainTabView(
                    playerVM: playerVM,
                    scheduleVM: scheduleVM,
                    historyVM: historyVM,
                    settingsVM: settingsVM,
                    selectedTab: $selectedTab
                )
                
                // Mini Player Overlay (does not block tab bar)
                VStack {
                    Spacer()
                    
                    if let track = playerVM.nowPlayingTrack, playerVM.audioService.isPlaying {
                        MiniPlayerView(
                            track: track,
                            isPlaying: playerVM.audioService.isPlaying,
                            onPlayPauseTapped: {
                                playerVM.togglePlayPause()
                            },
                            onMiniPlayerTapped: {
                                selectedTab = .live
                            }
                        )
                        .frame(height: miniPlayerHeight)
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                    }
                }
                .ignoresSafeArea(edges: .bottom)
            }
            .environmentObject(playerVM)
            .environmentObject(scheduleVM)
            .environmentObject(historyVM)
            .environmentObject(settingsVM)
            .onAppear {
                // Load initial data
                Task {
                    await playerVM.refreshNowPlaying()
                    await playerVM.fetchCurrentAndNextProgrammes()
                    await historyVM.loadInitialHistory()
                    await scheduleVM.fetchWeeklySchedule()
                }
                
                // Auto-play on launch if enabled
                if settingsVM.playOnLaunch {
                    playerVM.play()
                }
            }
        }
    }
}

enum TabDestination {
    case live
    case recentlyPlayed
    case schedule
    case programmes
    case more
}

#Preview {
    ContentView()
}
struct ContentView: View {
    @StateObject private var audioService = AudioService()
    @StateObject private var playerVM: PlayerViewModel
    @StateObject private var scheduleVM = ScheduleViewModel()
    @StateObject private var historyVM = HistoryViewModel()
    @StateObject private var settingsVM = SettingsViewModel()
    
    init() {
        let audio = AudioService()
        _audioService = StateObject(wrappedValue: audio)
        _playerVM = StateObject(wrappedValue: PlayerViewModel(audioService: audio))
    }
    
    @State private var selectedTab: TabDestination = .live
    @State private var showMiniPlayer = false
    @State private var miniPlayerHeight: CGFloat = AppConfig.miniPlayerHeight
    
    var body: some View {
        ZStack {
            // Main Tab View
            MainTabView(
                playerVM: playerVM,
                scheduleVM: scheduleVM,
                historyVM: historyVM,
                settingsVM: settingsVM,
                selectedTab: $selectedTab
            )
            
            // Mini Player Overlay (does not block tab bar)
            VStack {
                Spacer()
                
                if let track = playerVM.nowPlayingTrack, playerVM.audioService.isPlaying {
                    MiniPlayerView(
                        track: track,
                        isPlaying: playerVM.audioService.isPlaying,
                        onPlayPauseTapped: {
                            playerVM.togglePlayPause()
                        },
                        onMiniPlayerTapped: {
                            selectedTab = .live
                        }
                    )
                    .frame(height: miniPlayerHeight)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                }
            }
            .ignoresSafeArea(edges: .bottom)
        }
        .environmentObject(playerVM)
        .environmentObject(scheduleVM)
        .environmentObject(historyVM)
        .environmentObject(settingsVM)
    }
}

