import Combine
import Foundation

@MainActor
final class PlayerViewModel: ObservableObject {
    @Published var audioService: AudioService
    @Published var nowPlayingTrack: Track?
    @Published var sleepTimerDuration: TimeInterval = 0
    @Published var sleepTimerActive = false
    @Published var isSleepTimerRunning = false
    
    @Published var currentProgramme: Programme?
    @Published var nextProgrammes: [Programme] = []
    
    @Published var isLoadingNowPlaying = false
    @Published var nowPlayingError: String?
    
    private let stationAPI = StationAPIService.shared
    private let iTunesAPI = iTunesSearchService.shared
    private let storage = LocalStorageService.shared
    
    private var cancellables = Set<AnyCancellable>()
    private var sleepTimerTask: Task<Void, Never>?
    
    init(audioService: AudioService) {
        self.audioService = audioService
        setupNowPlayingPolling()
        setupSleepTimer()
    }
    
    // MARK: - Playback Control
    
    func play() {
        audioService.play()
        storage.playOnLaunch = true
    }
    
    func pause() {
        audioService.pause()
    }
    
    func togglePlayPause() {
        audioService.togglePlayPause()
    }
    
    func setVolume(_ volume: Float) {
        audioService.setVolume(volume)
    }
    
    // MARK: - Now Playing Polling (Phase 3)
    
    private func setupNowPlayingPolling() {
        // Poll every 10 seconds
        Timer.publish(every: 10, on: .main, in: .common)
            .autoconnect()
            .sink { [weak self] _ in
                Task {
                    await self?.refreshNowPlaying()
                }
            }
            .store(in: &cancellables)
    }
    
    func refreshNowPlaying() async {
        guard audioService.isPlaying else { return }
        
        isLoadingNowPlaying = true
        nowPlayingError = nil
        
        do {
            let tracks = try await stationAPI.fetchHistory(
                limit: AppConfig.nowPlayingLimit,
                offset: 0
            )
            
            if let nowPlaying = tracks.first {
                var track = nowPlaying
                
                // Load like/dislike state
                track.likeDislikeState = storage.loadLikeDislikeState(for: track.id)
                
                // Fetch preview URL
                do {
                    if let previewURL = try await iTunesAPI.searchPreview(
                        artist: track.author,
                        title: track.title
                    ) {
                        track.previewURL = previewURL
                    }
                } catch {
                    // Silently continue without preview
                }
                
                nowPlayingTrack = track
                audioService.updateNowPlaying(track: track)
            }
            
            isLoadingNowPlaying = false
        } catch {
            nowPlayingError = error.localizedDescription
            isLoadingNowPlaying = false
        }
    }
    
    // MARK: - Like/Dislike
    
    func toggleLike(for track: Track) {
        var updatedTrack = track
        
        switch track.likeDislikeState {
        case .liked:
            updatedTrack.likeDislikeState = .none
        case .disliked, .none:
            updatedTrack.likeDislikeState = .liked
        }
        
        storage.saveLikeDislikeState(updatedTrack.likeDislikeState, for: track.id)
        
        if let index = nextProgrammes.firstIndex(where: { $0.id == track.id }) {
            var updated = nextProgrammes[index]
            // Update as needed
        }
    }
    
    func toggleDislike(for track: Track) {
        var updatedTrack = track
        
        switch track.likeDislikeState {
        case .disliked:
            updatedTrack.likeDislikeState = .none
        case .liked, .none:
            updatedTrack.likeDislikeState = .disliked
        }
        
        storage.saveLikeDislikeState(updatedTrack.likeDislikeState, for: track.id)
    }
    
    // MARK: - Sleep Timer (Phase 1)
    
    func setupSleepTimer() {
        // Restore saved duration
        sleepTimerDuration = storage.sleepTimerDuration
    }
    
    func startSleepTimer(duration: TimeInterval) {
        sleepTimerDuration = duration
        storage.sleepTimerDuration = duration
        sleepTimerActive = true
        isSleepTimerRunning = true
        
        sleepTimerTask?.cancel()
        sleepTimerTask = Task {
            try? await Task.sleep(nanoseconds: UInt64(duration * 1_000_000_000))
            
            if !Task.isCancelled {
                DispatchQueue.main.async {
                    self.audioService.pause()
                    self.isSleepTimerRunning = false
                }
            }
        }
    }
    
    func cancelSleepTimer() {
        sleepTimerTask?.cancel()
        sleepTimerActive = false
        isSleepTimerRunning = false
    }
    
    // MARK: - Schedule Management
    
    func fetchCurrentAndNextProgrammes() async {
        let now = Date()
        let endOfDay = Calendar.current.startOfDay(for: now).addingTimeInterval(86400)
        
        do {
            let programmes = try await stationAPI.fetchSchedule(
                startDate: now,
                endDate: endOfDay
            )
            
            if let current = programmes.first(where: { $0.isLiveNow }) {
                self.currentProgramme = current
                self.nextProgrammes = programmes.filter { !$0.isLiveNow }.prefix(5).map { $0 }
            } else if let next = programmes.first {
                self.nextProgrammes = programmes.prefix(5).map { $0 }
            }
        } catch {
            nowPlayingError = error.localizedDescription
        }
    }
    
    deinit {
        sleepTimerTask?.cancel()
    }
}
