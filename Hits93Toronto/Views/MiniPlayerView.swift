import SwiftUI

struct MiniPlayerView: View {
    let track: Track
    let isPlaying: Bool
    let onPlayPauseTapped: () -> Void
    let onMiniPlayerTapped: () -> Void
    
    var body: some View {
        VStack(spacing: 0) {
            Divider()
            
            HStack(spacing: 12) {
                // Artwork
                if let imageURLString = track.preferredImageURL(for: .miniPlayer),
                   let imageURL = URL(string: imageURLString) {
                    AsyncImage(url: imageURL) { phase in
                        switch phase {
                        case .success(let image):
                            image
                                .resizable()
                                .scaledToFill()
                                .frame(width: 44, height: 44)
                                .cornerRadius(4)
                        case .failure:
                            Image(systemName: "music.note")
                                .frame(width: 44, height: 44)
                                .background(Color.gray.opacity(0.3))
                                .cornerRadius(4)
                        case .empty:
                            ProgressView()
                                .frame(width: 44, height: 44)
                        @unknown default:
                            ProgressView()
                                .frame(width: 44, height: 44)
                        }
                    }
                } else {
                    Image(systemName: "music.note")
                        .frame(width: 44, height: 44)
                        .background(Color.gray.opacity(0.3))
                        .cornerRadius(4)
                }
                
                // Track Info
                VStack(alignment: .leading, spacing: 2) {
                    Text(track.title)
                        .font(.system(.caption, design: .default))
                        .lineLimit(1)
                        .fontWeight(.semibold)
                    
                    Text(track.author)
                        .font(.system(.caption2, design: .default))
                        .lineLimit(1)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                // Play/Pause
                Button(action: onPlayPauseTapped) {
                    Image(systemName: isPlaying ? "pause.fill" : "play.fill")
                        .font(.system(size: 16))
                        .foregroundColor(.white)
                        .frame(width: 36, height: 36)
                        .background(Color.red)
                        .cornerRadius(18)
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(Color(UIColor.systemBackground))
            .onTapGesture(perform: onMiniPlayerTapped)
        }
    }
}

#Preview {
    MiniPlayerView(
        track: Track(
            title: "Blinding Lights",
            author: "The Weeknd",
            ts: Int64(Date().timeIntervalSince1970 * 1000)
        ),
        isPlaying: true,
        onPlayPauseTapped: {},
        onMiniPlayerTapped: {}
    )
}
