import Foundation

/// Represents a scheduled programme (show) on the station.
struct Programme: Identifiable, Codable, Hashable {
    let id: String
    let name: String
    let description: String?
    let startTime: Int64  /// Unix timestamp in milliseconds
    let endTime: Int64    /// Unix timestamp in milliseconds
    let imageURL: String?
    let host: String?
    let genre: String?
    
    enum CodingKeys: String, CodingKey {
        case id
        case name
        case description
        case startTime = "start_ts"
        case endTime = "end_ts"
        case imageURL = "img_url"
        case host
        case genre
    }
    
    init(
        id: String = UUID().uuidString,
        name: String,
        description: String? = nil,
        startTime: Int64,
        endTime: Int64,
        imageURL: String? = nil,
        host: String? = nil,
        genre: String? = nil
    ) {
        self.id = id
        self.name = name
        self.description = description
        self.startTime = startTime
        self.endTime = endTime
        self.imageURL = imageURL
        self.host = host
        self.genre = genre
    }
    
    /// Defensive initializer from JSON.
    static func from(dict: [String: Any]) -> Programme? {
        let name = (dict["name"] as? String) ?? (dict["title"] as? String) ?? "Unknown Programme"
        let description = dict["description"] as? String
        
        // Timestamp safety.
        var startTime: Int64 = 0
        if let startNum = dict["start_ts"] as? NSNumber {
            startTime = startNum.int64Value
            if startTime < 1_000_000_000_000 {
                startTime = startTime * 1000
            }
        }
        
        var endTime: Int64 = 0
        if let endNum = dict["end_ts"] as? NSNumber {
            endTime = endNum.int64Value
            if endTime < 1_000_000_000_000 {
                endTime = endTime * 1000
            }
        }
        
        guard startTime > 0, endTime > startTime else {
            return nil
        }
        
        let imageURL = dict["img_url"] as? String
        let host = dict["host"] as? String
        let genre = dict["genre"] as? String
        let id = (dict["id"] as? String) ?? UUID().uuidString
        
        return Programme(
            id: id,
            name: name,
            description: description,
            startTime: startTime,
            endTime: endTime,
            imageURL: imageURL,
            host: host,
            genre: genre
        )
    }
    
    /// Start time as Date.
    var startDate: Date {
        Date(timeIntervalSince1970: Double(startTime) / 1000.0)
    }
    
    /// End time as Date.
    var endDate: Date {
        Date(timeIntervalSince1970: Double(endTime) / 1000.0)
    }
    
    /// Duration as TimeInterval.
    var duration: TimeInterval {
        Double(endTime - startTime) / 1000.0
    }
    
    /// Time remaining from now.
    var timeRemaining: TimeInterval {
        let now = Date().timeIntervalSince1970 * 1000
        let remaining = Double(endTime) - now
        return max(0, remaining / 1000.0)
    }
    
    /// Is this programme currently live?
    var isLiveNow: Bool {
        let now = Date().timeIntervalSince1970 * 1000
        return now >= Double(startTime) && now < Double(endTime)
    }
    
    /// Fallback metadata from local catalogue (Phase 2).
    static func withFallback(from dict: [String: Any], fallbackCatalogue: [String: ProgrammeFallback]) -> Programme? {
        guard let programme = Programme.from(dict: dict) else { return nil }
        
        if let fallback = fallbackCatalogue[programme.name] {
            return Programme(
                id: programme.id,
                name: programme.name,
                description: programme.description ?? fallback.description,
                startTime: programme.startTime,
                endTime: programme.endTime,
                imageURL: programme.imageURL ?? fallback.imageURL,
                host: programme.host ?? fallback.host,
                genre: programme.genre ?? fallback.genre
            )
        }
        return programme
    }
}

/// Fallback metadata for programmes (hardcoded local catalogue).
struct ProgrammeFallback: Codable {
    let name: String
    let description: String?
    let imageURL: String?
    let host: String?
    let genre: String?
    
    enum CodingKeys: String, CodingKey {
        case name
        case description
        case imageURL = "img_url"
        case host
        case genre
    }
}

/// Local catalogue of known programmes (Phase 2).
let localProgrammeCatalogue: [String: ProgrammeFallback] = [
    "Breakfast Show": ProgrammeFallback(
        name: "Breakfast Show",
        description: "Wake up with the latest hits, news, and fun.",
        imageURL: nil,
        host: "Morning Team",
        genre: "Pop"
    ),
    "Afternoon Drive": ProgrammeFallback(
        name: "Afternoon Drive",
        description: "Your afternoon soundtrack on the commute.",
        imageURL: nil,
        host: "Drive Team",
        genre: "Pop"
    ),
    // Add more as known...
]
