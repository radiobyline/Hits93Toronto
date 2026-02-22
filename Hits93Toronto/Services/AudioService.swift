import AVFoundation
import MediaPlayer
import Combine

@MainActor
final class AudioService: NSObject, ObservableObject {
    @Published var isPlaying = false
    @Published var currentVolume: Float = 0.5
    @Published var bufferingProgress: Double = 0.0
    @Published var playbackError: String?
    @Published var nowPlayingTrack: Track?
    
    private var player: AVPlayer?
    private var timeObserver: Any?
    private let commandCenter = MPRemoteCommandCenter.shared()
    private let nowPlayingCenter = MPNowPlayingInfoCenter.default()
    
    private var currentStreamURL: String = AppConfig.primaryStreamURL
    
    override init() {
        super.init()
        setupRemoteTransportControls()
        setupAudioSession()
    }
    
    // MARK: - Setup
    
    private func setupAudioSession() {
        do {
            let audioSession = AVAudioSession.sharedInstance()
            try audioSession.setCategory(
                .playback,
                mode: .default,
                options: [.duckOthers, .defaultToSpeaker]
            )
            try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
        } catch {
            playbackError = "Audio session setup failed: \(error.localizedDescription)"
        }
    }
    
    private func setupRemoteTransportControls() {
        commandCenter.playCommand.addTarget { [weak self] event in
            self?.play()
            return .success
        }
        
        commandCenter.pauseCommand.addTarget { [weak self] event in
            self?.pause()
            return .success
        }
        
        commandCenter.togglePlayPauseCommand.addTarget { [weak self] event in
            self?.togglePlayPause()
            return .success
        }
    }
    
    // MARK: - Playback Control
    
    func play() {
        if player == nil {
            initializePlayer()
        }
        player?.play()
        isPlaying = true
        playbackError = nil
    }
    
    func pause() {
        player?.pause()
        isPlaying = false
    }
    
    func togglePlayPause() {
        if isPlaying {
            pause()
        } else {
            play()
        }
    }
    
    func stop() {
        player?.pause()
        player = nil
        timeObserver = nil
        isPlaying = false
    }
    
    private func initializePlayer() {
        guard let url = URL(string: currentStreamURL) else {
            playbackError = "Invalid stream URL"
            return
        }
        
        let asset = AVAsset(url: url)
        let playerItem = AVPlayerItem(asset: asset)
        
        player = AVPlayer(playerItem: playerItem)
        attachTimeObserver()
        addPlayerObservers()
    }
    
    private func attachTimeObserver() {
        guard let player = player else { return }
        
        if let observer = timeObserver {
            player.removeTimeObserver(observer)
        }
        
        timeObserver = player.addPeriodicTimeObserver(
            forInterval: CMTime(seconds: 0.5, preferredTimescale: CMTimeScale(NSEC_PER_SEC)),
            queue: .main
        ) { [weak self] _ in
            // Update buffering if available
            if let asset = player.currentItem?.asset {
                var total: CMTimeRange?
                if asset.statusOfValue(forKey: "duration", error: nil) == .loaded {
                    // Track loaded duration for stream buffering progress
                }
            }
        }
    }
    
    private func addPlayerObservers() {
        guard let player = player else { return }
        
        NotificationCenter.default.addObserver(
            forName: .AVPlayerItemDidPlayToEndTime,
            object: player.currentItem,
            queue: .main
        ) { [weak self] _ in
            self?.isPlaying = false
        }
        
        NotificationCenter.default.addObserver(
            forName: .AVPlayerItemFailedToPlayToEndTime,
            object: player.currentItem,
            queue: .main
        ) { [weak self] notification in
            if let error = notification.userInfo?[AVPlayerItemFailedToPlayToEndTimeErrorKey] as? NSError {
                self?.playbackError = "Playback failed: \(error.localizedDescription)"
                self?.isPlaying = false
            }
        }
    }
    
    // MARK: - Volume Control
    
    func setVolume(_ volume: Float) {
        let clamped = max(0, min(1, volume))
        currentVolume = clamped
        player?.volume = clamped
    }
    
    // MARK: - Stream Management
    
    func switchStream(to streamURL: String) {
        currentStreamURL = streamURL
        let wasPlaying = isPlaying
        stop()
        if wasPlaying {
            play()
        }
    }
    
    // MARK: - Now Playing Metadata
    
    func updateNowPlaying(track: Track) {
        nowPlayingTrack = track
        
        var nowPlayingInfo = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [String: Any]()
        
        nowPlayingInfo[MPMediaItemPropertyTitle] = track.title
        nowPlayingInfo[MPMediaItemPropertyArtist] = track.author
        nowPlayingInfo[MPMediaItemPropertyAlbumTitle] = track.album ?? ""
        
        if let imageURLString = track.preferredImageURL(for: .nowPlayingCenter),
           let imageURL = URL(string: imageURLString) {
            URLSession.shared.dataTask(with: imageURL) { [weak self] data, _, _ in
                guard let data = data,
                      let uiImage = UIImage(data: data) else { return }
                
                DispatchQueue.main.async {
                    var info = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [String: Any]()
                    info[MPMediaItemPropertyArtwork] = MPMediaItemArtwork(boundsSize: uiImage.size) { _ in uiImage }
                    MPNowPlayingInfoCenter.default().nowPlayingInfo = info
                }
            }.resume()
        }
        
        nowPlayingInfo[MPMediaItemPropertyPlaybackDuration] = track.duration
        nowPlayingInfo[MPNowPlayingInfoPropertyIsLiveStream] = true
        nowPlayingInfo[MPNowPlayingInfoPropertyDefaultPlaybackRate] = 1.0
        
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nowPlayingInfo
    }
    
    func clearNowPlaying() {
        nowPlayingTrack = nil
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
    }
    
    deinit {
        if let observer = timeObserver, let player = player {
            player.removeTimeObserver(observer)
        }
        NotificationCenter.default.removeObserver(self)
    }
}
