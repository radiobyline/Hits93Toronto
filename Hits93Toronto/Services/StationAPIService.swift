import Foundation

class StationAPIService {
    static let shared = StationAPIService()
    
    private let session: URLSession
    
    init(session: URLSession = .shared) {
        self.session = session
    }
    
    // MARK: - Schedule Grid
    
    /// Fetch programme schedule for a date range.
    func fetchSchedule(
        startDate: Date,
        endDate: Date
    ) async throws -> [Programme] {
        let startTs = Int64(startDate.timeIntervalSince1970) * 1000
        let endTs = Int64(endDate.timeIntervalSince1970) * 1000
        
        var components = URLComponents(string: "\(AppConfig.stationAPIBaseURL)/grid/")!
        components.queryItems = [
            URLQueryItem(name: "start_ts", value: "\(startTs)"),
            URLQueryItem(name: "end_ts", value: "\(endTs)"),
            URLQueryItem(name: "server", value: AppConfig.serverParam),
            URLQueryItem(name: "utc", value: "1")
        ]
        
        guard let url = components.url else {
            throw APIError.invalidURL
        }
        
        let (data, response) = try await session.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw APIError.httpError(statusCode: (response as? HTTPURLResponse)?.statusCode ?? 0)
        }
        
        return try parseScheduleResponse(data)
    }
    
    private func parseScheduleResponse(_ data: Data) throws -> [Programme] {
        // Try direct array first
        if let array = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] {
            return array.compactMap { Programme.withFallback(from: $0, fallbackCatalogue: localProgrammeCatalogue) }
        }
        
        // Try wrapped response
        if let wrapper = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
            let keys = ["grid", "schedule", "programmes", "items", "data", "results"]
            for key in keys {
                if let array = wrapper[key] as? [[String: Any]] {
                    return array.compactMap { Programme.withFallback(from: $0, fallbackCatalogue: localProgrammeCatalogue) }
                }
            }
        }
        
        throw APIError.parseError
    }
    
    // MARK: - History (Now Playing + Recently Played)
    
    /// Fetch history/now playing tracks.
    func fetchHistory(
        limit: Int,
        offset: Int
    ) async throws -> [Track] {
        var components = URLComponents(string: "\(AppConfig.stationAPIBaseURL)/history/")!
        components.queryItems = [
            URLQueryItem(name: "limit", value: "\(limit)"),
            URLQueryItem(name: "offset", value: "\(offset)"),
            URLQueryItem(name: "server", value: AppConfig.serverParam)
        ]
        
        guard let url = components.url else {
            throw APIError.invalidURL
        }
        
        let (data, response) = try await session.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw APIError.httpError(statusCode: (response as? HTTPURLResponse)?.statusCode ?? 0)
        }
        
        return try parseHistoryResponse(data)
    }
    
    private func parseHistoryResponse(_ data: Data) throws -> [Track] {
        // Try direct array first
        if let array = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] {
            return array.compactMap { Track.from(dict: $0) }
        }
        
        // Try wrapped response
        if let wrapper = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
            let keys = ["history", "results", "items", "data", "tracks", "songs"]
            for key in keys {
                if let array = wrapper[key] as? [[String: Any]] {
                    return array.compactMap { Track.from(dict: $0) }
                }
            }
        }
        
        throw APIError.parseError
    }
    
    // MARK: - Error Handling
    
    enum APIError: LocalizedError {
        case invalidURL
        case httpError(statusCode: Int)
        case parseError
        case networkError(Error)
        
        var errorDescription: String? {
            switch self {
            case .invalidURL:
                return "Invalid URL"
            case .httpError(let code):
                return "HTTP Error \(code)"
            case .parseError:
                return "Failed to parse response"
            case .networkError(let error):
                return error.localizedDescription
            }
        }
    }
}
