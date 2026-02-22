import SwiftUI

struct LivePlayerView: View {
    @ObservedObject var playerVM: PlayerViewModel
    @State private var showSchedule = false
    @State private var showMore = false
    @State private var selectedSleepDuration: TimeInterval = 300
    
    var body: some View {
        NavigationStack {
            ZStack {
                // Background gradient
                LinearGradient(
                    gradient: Gradient(colors: [Color.red.opacity(0.2), Color.black.opacity(0.5)]),
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
                
                VStack(spacing: 0) {
                    // Header
                    HStack {
                        Text("Hits 93 Toronto")
                            .font(.title3)
                            .fontWeight(.bold)
                        
                        Spacer()
                        
                        Button(action: { showMore.toggle() }) {
                            Image(systemName: "ellipsis.circle")
                                .font(.title2)
                        }
                    }
                    .padding()
                    
                    // Current Programme
                    if let programme = playerVM.currentProgramme {
                        VStack(spacing: 8) {
                            Text("NOW")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            
                            Text(programme.name)
                                .font(.title2)
                                .fontWeight(.bold)
                            
                            if let host = programme.host {
                                Text("with \(host)")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                            }
                            
                            Text("⏱ \(formatTimeRemaining(programme.timeRemaining))")
                                .font(.caption)
                                .foregroundColor(.orange)
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.white.opacity(0.1))
                        .cornerRadius(8)
                        .padding()
                    }
                    
                    // Artwork (Now Playing)
                    if let track = playerVM.nowPlayingTrack,
                       let imageURLString = track.preferredImageURL(for: .fullScreen),
                       let imageURL = URL(string: imageURLString) {
                        AsyncImage(url: imageURL) { phase in
                            switch phase {
                            case .success(let image):
                                image
                                    .resizable()
                                    .scaledToFill()
                            case .failure:
                                Image(systemName: "music.note")
                                    .font(.system(size: 60))
                                    .foregroundColor(.gray)
                            case .empty:
                                ProgressView()
                            @unknown default:
                                EmptyView()
                            }
                        }
                        .frame(height: 280)
                        .clipped()
                        .cornerRadius(12)
                        .padding()
                    } else {
                        Image(systemName: "music.note")
                            .font(.system(size: 80))
                            .frame(height: 280)
                            .padding()
                    }
                    
                    Spacer(minLength: 20)
                    
                    // Now Playing Text
                    if let track = playerVM.nowPlayingTrack {
                        VStack(alignment: .center, spacing: 4) {
                            Text(track.title)
                                .font(.headline)
                                .lineLimit(2)
                            
                            Text(track.author)
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                                .lineLimit(1)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.horizontal)
                    }
                    
                    Spacer(minLength: 20)
                    
                    // Playback Controls
                    HStack(spacing: 30) {
                        // Like/Dislike
                        if let track = playerVM.nowPlayingTrack {
                            VStack(spacing: 4) {
                                Button(action: { playerVM.toggleLike(for: track) }) {
                                    Image(systemName: track.likeDislikeState == .liked ? "hand.thumbsup.fill" : "hand.thumbsup")
                                        .font(.title3)
                                        .foregroundColor(track.likeDislikeState == .liked ? .red : .white)
                                }
                                
                                Text("Like")
                                    .font(.caption2)
                            }
                        }
                        
                        // Play/Pause
                        Button(action: { playerVM.togglePlayPause() }) {
                            Image(systemName: playerVM.audioService.isPlaying ? "pause.circle.fill" : "play.circle.fill")
                                .font(.system(size: 60))
                                .foregroundColor(.red)
                        }
                        
                        // Dislike
                        if let track = playerVM.nowPlayingTrack {
                            VStack(spacing: 4) {
                                Button(action: { playerVM.toggleDislike(for: track) }) {
                                    Image(systemName: track.likeDislikeState == .disliked ? "hand.thumbsdown.fill" : "hand.thumbsdown")
                                        .font(.title3)
                                        .foregroundColor(track.likeDislikeState == .disliked ? .blue : .white)
                                }
                                
                                Text("Dislike")
                                    .font(.caption2)
                            }
                        }
                    }
                    .padding()
                    
                    // Volume Slider
                    HStack(spacing: 8) {
                        Image(systemName: "speaker.fill")
                            .font(.caption)
                        
                        Slider(value: Binding(
                            get: { Double(playerVM.audioService.currentVolume) },
                            set: { playerVM.setVolume(Float($0)) }
                        ), in: 0...1)
                        
                        Image(systemName: "speaker.wave.3.fill")
                            .font(.caption)
                    }
                    .foregroundColor(.white)
                    .padding()
                    
                    // Quick Actions
                    HStack(spacing: 12) {
                        Button(action: { showSchedule = true }) {
                            Label("Schedule", systemImage: "calendar")
                                .font(.caption)
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.bordered)
                        
                        Button(action: {}) {
                            Label("Request", systemImage: "heart.fill")
                                .font(.caption)
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.bordered)
                        
                        Button(action: {}) {
                            Label("Share", systemImage: "square.and.arrow.up")
                                .font(.caption)
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.bordered)
                    }
                    .padding()
                    
                    Spacer(minLength: 20)
                }
                .foregroundColor(.white)
            }
            .sheet(isPresented: $showSchedule) {
                ScheduleDetailView(playerVM: playerVM)
            }
            .actionSheet(isPresented: $showMore) {
                ActionSheet(
                    title: Text("More Options"),
                    buttons: [
                        .default(Text("Sleep Timer")) { showSleepTimerSheet() },
                        .default(Text("Equalizer")) { /* Phase 1 stub */ },
                        .default(Text("Record")) { /* Phase 1 stub */ },
                        .default(Text("Lyrics")) { /* Phase 1 stub */ },
                        .default(Text("Learn More")) { /* Phase 1 stub */ },
                        .cancel()
                    ]
                )
            }
        }
    }
    
    private func formatTimeRemaining(_ seconds: TimeInterval) -> String {
        let hours = Int(seconds) / 3600
        let minutes = (Int(seconds) % 3600) / 60
        
        if hours > 0 {
            return "\(hours)h \(minutes)m"
        } else {
            return "\(minutes)m"
        }
    }
    
    private func showSleepTimerSheet() {
        playerVM.startSleepTimer(duration: selectedSleepDuration)
    }
}

// MARK: - Schedule Detail View

struct ScheduleDetailView: View {
    @ObservedObject var playerVM: PlayerViewModel
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        NavigationStack {
            List {
                if let current = playerVM.currentProgramme {
                    Section("Now") {
                        ProgrammeRow(programme: current)
                    }
                }
                
                Section("Next") {
                    ForEach(playerVM.nextProgrammes.prefix(5), id: \.id) { programme in
                        ProgrammeRow(programme: programme)
                    }
                }
            }
            .navigationTitle("Schedule")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }
}

struct ProgrammeRow: View {
    let programme: Programme
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(programme.name)
                .fontWeight(.semibold)
            
            HStack(spacing: 12) {
                Text(programme.startDate.formatted(date: .omitted, time: .shortened))
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                if let host = programme.host {
                    Text("•")
                    Text(host)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
    }
}

#Preview {
    let audioService = AudioService()
    return LivePlayerView(playerVM: PlayerViewModel(audioService: audioService))
}
