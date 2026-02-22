import Foundation

/// Represents a track (song) from Now Playing or History.
struct Track: Identifiable, Codable, Hashable {
    let id: String
    let title: String
    let author: String
    let album: String?
    let ts: Int64  /// Unix timestamp in milliseconds
    let length: Int64?  /// Duration in milliseconds
    let smallImageURL: String?  /// img_url
    let mediumImageURL: String?  /// img_medium_url
    let largeImageURL: String?  /// img_large_url
    
    /// iTunesSearch preview URL (not from API, fetched separately).
    var previewURL: String?
    
    /// Local like/dislike state (persisted to UserDefaults).
    var likeDislikeState: LikeDislikeState = .none
    
    enum CodingKeys: String, CodingKey {
        case id
        case title
        case author
        case album
        case ts
        case length
        case smallImageURL = "img_url"
        case mediumImageURL = "img_medium_url"
        case largeImageURL = "img_large_url"
    }
    
    init(
        id: String = UUID().uuidString,
        title: String,
        author: String,
        album: String? = nil,
        ts: Int64,
        length: Int64? = nil,
        smallImageURL: String? = nil,
        mediumImageURL: String? = nil,
        largeImageURL: String? = nil,
        previewURL: String? = nil
    ) {
        self.id = id
        self.title = title
        self.author = author
        self.album = album
        self.ts = ts
        self.length = length
        self.smallImageURL = smallImageURL
        self.mediumImageURL = mediumImageURL
        self.largeImageURL = largeImageURL
        self.previewURL = previewURL
    }
    
    /// Defensive initializer from JSON (handles variant API shapes).
    static func from(dict: [String: Any]) -> Track? {
        let title = (dict["title"] as? String) ?? "Unknown title"
        let author = (dict["author"] as? String) ?? "Unknown artist"
        let album = dict["album"] as? String
        
        // Timestamp safety: treat as milliseconds, convert from seconds if needed.
        var ts: Int64 = 0
        if let tsNum = dict["ts"] as? NSNumber {
            ts = tsNum.int64Value
            if ts < 1_000_000_000_000 {  // Likely seconds, convert to ms.
                ts = ts * 1000
            }
        }
        
        let length = (dict["length"] as? NSNumber)?.int64Value
        let smallImageURL = dict["img_url"] as? String
        let mediumImageURL = dict["img_medium_url"] as? String
        let largeImageURL = dict["img_large_url"] as? String
        let id = (dict["id"] as? String) ?? UUID().uuidString
        
        return Track(
            id: id,
            title: title,
            author: author,
            album: album,
            ts: ts,
            length: length,
            smallImageURL: smallImageURL,
            mediumImageURL: mediumImageURL,
            largeImageURL: largeImageURL
        )
    }
    
    /// Preferred image URL by context.
    func preferredImageURL(for context: ImageContext = .fullScreen) -> String? {
        switch context {
        case .miniPlayer:
            return smallImageURL ?? mediumImageURL ?? largeImageURL
        case .fullScreen:
            return largeImageURL ?? mediumImageURL ?? smallImageURL
        case .nowPlayingCenter:
            return largeImageURL ?? mediumImageURL ?? smallImageURL
        case .listItem:
            return mediumImageURL ?? smallImageURL ?? largeImageURL
        }
    }
    
    enum ImageContext {
        case miniPlayer
        case fullScreen
        case nowPlayingCenter
        case listItem
    }
    
    /// Start time as Date.
    var startDate: Date {
        Date(timeIntervalSince1970: Double(ts) / 1000.0)
    }
    
    /// Duration as TimeInterval.
    var duration: TimeInterval {
        guard let length = length else { return 0 }
        return Double(length) / 1000.0
    }
}

// MARK: - Like/Dislike State

enum LikeDislikeState: String, Codable {
    case none
    case liked
    case disliked
}
