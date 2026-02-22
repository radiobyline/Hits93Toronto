import Combine
import Foundation

@MainActor
final class HistoryViewModel: ObservableObject {
    @Published var recentlyPlayed: [Track] = []
    @Published var isLoading = false
    @Published var error: String?
    
    private let stationAPI = StationAPIService.shared
    private let iTunesAPI = iTunesSearchService.shared
    private let storage = LocalStorageService.shared
    
    private var currentOffset = 0
    private var hasMore = true
    
    // MARK: - Initial Load
    
    func loadInitialHistory() async {
        isLoading = true
        error = nil
        currentOffset = 0
        hasMore = true
        
        // Check cache first
        if let cached = storage.loadRecentlyPlayed() {
            self.recentlyPlayed = cached
            isLoading = false
        }
        
        do {
            let tracks = try await stationAPI.fetchHistory(
                limit: AppConfig.historyBatchSize,
                offset: 0
            )
            
            var enrichedTracks = tracks
            
            // Load like/dislike states
            enrichedTracks = enrichedTracks.map { track in
                var t = track
                t.likeDislikeState = storage.loadLikeDislikeState(for: track.id)
                return t
            }
            
            // Fetch preview URLs concurrently
            let previews = await iTunesAPI.searchPreviewsBatch(enrichedTracks)
            enrichedTracks = enrichedTracks.map { track in
                var t = track
                t.previewURL = previews[track.id]
                return t
            }
            
            self.recentlyPlayed = enrichedTracks
            storage.saveRecentlyPlayed(enrichedTracks)
            currentOffset = tracks.count
            hasMore = tracks.count == AppConfig.historyBatchSize
            
            isLoading = false
        } catch {
            self.error = error.localizedDescription
            isLoading = false
        }
    }
    
    // MARK: - Pagination
    
    func loadMoreHistory() async {
        guard hasMore && !isLoading else { return }
        
        isLoading = true
        error = nil
        
        do {
            let tracks = try await stationAPI.fetchHistory(
                limit: AppConfig.historyBatchSize,
                offset: currentOffset
            )
            
            var enrichedTracks = tracks
            
            // Load like/dislike states
            enrichedTracks = enrichedTracks.map { track in
                var t = track
                t.likeDislikeState = storage.loadLikeDislikeState(for: track.id)
                return t
            }
            
            // Fetch preview URLs
            let previews = await iTunesAPI.searchPreviewsBatch(enrichedTracks)
            enrichedTracks = enrichedTracks.map { track in
                var t = track
                t.previewURL = previews[track.id]
                return t
            }
            
            self.recentlyPlayed.append(contentsOf: enrichedTracks)
            currentOffset += enrichedTracks.count
            hasMore = enrichedTracks.count == AppConfig.historyBatchSize
            
            isLoading = false
        } catch {
            self.error = error.localizedDescription
            isLoading = false
        }
    }
    
    // MARK: - Grouping & Filtering
    
    func trackGroupedByDate() -> [(Date, [Track])] {
        var grouped: [Date: [Track]] = [:]
        let calendar = Calendar.current
        
        for track in recentlyPlayed {
            let date = calendar.startOfDay(for: track.startDate)
            if grouped[date] == nil {
                grouped[date] = []
            }
            grouped[date]?.append(track)
        }
        
        return grouped
            .sorted { $0.key > $1.key }
            .map { ($0.key, $0.value) }
    }
    
    // MARK: - Track Interaction
    
    func toggleLike(for track: Track) {
        guard let index = recentlyPlayed.firstIndex(where: { $0.id == track.id }) else { return }
        
        var updatedTrack = recentlyPlayed[index]
        
        switch updatedTrack.likeDislikeState {
        case .liked:
            updatedTrack.likeDislikeState = .none
        case .disliked, .none:
            updatedTrack.likeDislikeState = .liked
        }
        
        storage.saveLikeDislikeState(updatedTrack.likeDislikeState, for: track.id)
        recentlyPlayed[index] = updatedTrack
    }
    
    func toggleDislike(for track: Track) {
        guard let index = recentlyPlayed.firstIndex(where: { $0.id == track.id }) else { return }
        
        var updatedTrack = recentlyPlayed[index]
        
        switch updatedTrack.likeDislikeState {
        case .disliked:
            updatedTrack.likeDislikeState = .none
        case .liked, .none:
            updatedTrack.likeDislikeState = .disliked
        }
        
        storage.saveLikeDislikeState(updatedTrack.likeDislikeState, for: track.id)
        recentlyPlayed[index] = updatedTrack
    }
}
