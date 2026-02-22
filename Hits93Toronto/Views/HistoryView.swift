import SwiftUI

struct HistoryView: View {
    @ObservedObject var historyVM: HistoryViewModel
    @ObservedObject var playerVM: PlayerViewModel
    
    var body: some View {
        NavigationStack {
            ZStack {
                if historyVM.recentlyPlayed.isEmpty && !historyVM.isLoading {
                    VStack(spacing: 16) {
                        Image(systemName: "clock.badge.xmark")
                            .font(.system(size: 48))
                            .foregroundColor(.gray)
                        
                        Text("No Recently Played")
                            .font(.headline)
                        
                        Text("Tracks you listen to will appear here")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Color(UIColor.systemBackground))
                } else {
                    List {
                        ForEach(historyVM.trackGroupedByDate(), id: \.0) { date, tracks in
                            Section {
                                ForEach(tracks, id: \.id) { track in
                                    TrackRowView(
                                        track: track,
                                        onLikeTapped: { historyVM.toggleLike(for: track) },
                                        onDislikeTapped: { historyVM.toggleDislike(for: track) }
                                    )
                                }
                            } header: {
                                Text(formatDateHeader(date))
                            }
                        }
                        
                        if historyVM.recentlyPlayed.count >= AppConfig.historyBatchSize && !historyVM.isLoading {
                            HStack {
                                Spacer()
                                Button("Load More") {
                                    Task {
                                        await historyVM.loadMoreHistory()
                                    }
                                }
                                .foregroundColor(.red)
                                Spacer()
                            }
                            .padding()
                        }
                        
                        if historyVM.isLoading {
                            HStack {
                                Spacer()
                                ProgressView()
                                Spacer()
                            }
                            .padding()
                        }
                    }
                }
            }
            .navigationTitle("Recently Played")
            .navigationBarTitleDisplayMode(.inline)
            .onAppear {
                if historyVM.recentlyPlayed.isEmpty {
                    Task {
                        await historyVM.loadInitialHistory()
                    }
                }
            }
            .overlay(alignment: .bottom) {
                if let error = historyVM.error {
                    VStack {
                        Text(error)
                            .font(.caption)
                            .foregroundColor(.white)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.red)
                }
            }
        }
    }
    
    private func formatDateHeader(_ date: Date) -> String {
        let calendar = Calendar.current
        let today = Date()
        
        if calendar.isDateInToday(date) {
            return "Today"
        } else if calendar.isDateInYesterday(date) {
            return "Yesterday"
        } else {
            return date.formatted(date: .abbreviated, time: .omitted)
        }
    }
}

struct TrackRowView: View {
    let track: Track
    let onLikeTapped: () -> Void
    let onDislikeTapped: () -> Void
    
    var body: some View {
        HStack(spacing: 12) {
            // Artwork
            if let imageURLString = track.preferredImageURL(for: .listItem),
               let imageURL = URL(string: imageURLString) {
                AsyncImage(url: imageURL) { phase in
                    switch phase {
                    case .success(let image):
                        image
                            .resizable()
                            .scaledToFill()
                    case .failure:
                        Image(systemName: "music.note")
                            .foregroundColor(.gray)
                    case .empty:
                        ProgressView()
                    @unknown default:
                        EmptyView()
                    }
                }
                .frame(width: 50, height: 50)
                .cornerRadius(4)
            } else {
                Image(systemName: "music.note")
                    .frame(width: 50, height: 50)
                    .background(Color.gray.opacity(0.3))
                    .cornerRadius(4)
            }
            
            // Track Info
            VStack(alignment: .leading, spacing: 4) {
                Text(track.title)
                    .font(.body)
                    .lineLimit(1)
                    .fontWeight(.semibold)
                
                Text(track.author)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .lineLimit(1)
                
                if let duration = track.length {
                    Text(formatDuration(Double(duration) / 1000.0))
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
            
            // Like/Dislike Buttons
            HStack(spacing: 8) {
                Button(action: onLikeTapped) {
                    Image(systemName: track.likeDislikeState == .liked ? "hand.thumbsup.fill" : "hand.thumbsup")
                        .font(.caption)
                        .foregroundColor(track.likeDislikeState == .liked ? .red : .gray)
                }
                
                Button(action: onDislikeTapped) {
                    Image(systemName: track.likeDislikeState == .disliked ? "hand.thumbsdown.fill" : "hand.thumbsdown")
                        .font(.caption)
                        .foregroundColor(track.likeDislikeState == .disliked ? .blue : .gray)
                }
            }
        }
    }
    
    private func formatDuration(_ seconds: TimeInterval) -> String {
        let mins = Int(seconds) / 60
        let secs = Int(seconds) % 60
        return String(format: "%d:%02d", mins, secs)
    }
}

#Preview {
    let audioService = AudioService()
    return HistoryView(
        historyVM: HistoryViewModel(),
        playerVM: PlayerViewModel(audioService: audioService)
    )
}
