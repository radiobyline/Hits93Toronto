import Foundation

class iTunesSearchService {
    static let shared = iTunesSearchService()
    
    private let session: URLSession
    
    init(session: URLSession = .shared) {
        self.session = session
    }
    
    // MARK: - Search for Track Previews
    
    /// Search iTunes for a track and return preview URL if available.
    func searchPreview(
        artist: String,
        title: String
    ) async throws -> String? {
        let searchTerm = "\(artist) \(title)".trimmingCharacters(in: .whitespaces)
        
        var components = URLComponents(string: AppConfig.iTunesSearchBaseURL)!
        components.queryItems = [
            URLQueryItem(name: "term", value: searchTerm),
            URLQueryItem(name: "entity", value: "song"),
            URLQueryItem(name: "limit", value: "\(AppConfig.iTunesSearchLimit)")
        ]
        
        guard let url = components.url else {
            throw iTunesError.invalidURL
        }
        
        let (data, response) = try await session.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw iTunesError.httpError(statusCode: (response as? HTTPURLResponse)?.statusCode ?? 0)
        }
        
        return try parsePreviewURL(from: data)
    }
    
    private func parsePreviewURL(from data: Data) throws -> String? {
        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
              let results = json["results"] as? [[String: Any]] else {
            throw iTunesError.parseError
        }
        
        if let firstResult = results.first,
           let previewUrl = firstResult["previewUrl"] as? String {
            return previewUrl
        }
        
        return nil
    }
    
    // MARK: - Batch Search
    
    /// Search previews for multiple tracks concurrently.
    func searchPreviewsBatch(
        _ tracks: [Track]
    ) async -> [String: String] {
        var results: [String: String] = [:]
        
        for track in tracks {
            do {
                if let previewURL = try await searchPreview(artist: track.author, title: track.title) {
                    results[track.id] = previewURL
                }
            } catch {
                // Silently skip failed previews
            }
        }
        
        return results
    }
    
    // MARK: - Error Handling
    
    enum iTunesError: LocalizedError {
        case invalidURL
        case httpError(statusCode: Int)
        case parseError
        
        var errorDescription: String? {
            switch self {
            case .invalidURL:
                return "Invalid URL"
            case .httpError(let code):
                return "HTTP Error \(code)"
            case .parseError:
                return "Failed to parse iTunes response"
            }
        }
    }
}
