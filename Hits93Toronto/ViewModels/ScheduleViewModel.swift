import Combine
import Foundation

@MainActor
final class ScheduleViewModel: ObservableObject {
    @Published var programmes: [Programme] = []
    @Published var isLoading = false
    @Published var error: String?
    @Published var selectedDate: Date = Date()
    
    private let stationAPI = StationAPIService.shared
    private let storage = LocalStorageService.shared
    
    func fetchSchedule(for date: Date) async {
        isLoading = true
        error = nil
        
        // Check cache first
        if let cached = storage.loadSchedule(for: date) {
            self.programmes = cached
            isLoading = false
            return
        }
        
        let startOfDay = Calendar.current.startOfDay(for: date)
        let endOfDay = startOfDay.addingTimeInterval(86400)
        
        do {
            let fetched = try await stationAPI.fetchSchedule(
                startDate: startOfDay,
                endDate: endOfDay
            )
            
            self.programmes = fetched.sorted { $0.startTime < $1.startTime }
            storage.saveSchedule(programmes, for: date)
            isLoading = false
        } catch {
            self.error = error.localizedDescription
            isLoading = false
        }
    }
    
    func fetchWeeklySchedule() async {
        let today = Date()
        for i in 0..<AppConfig.scheduleGridDaysToFetch {
            let date = Calendar.current.date(byAdding: .day, value: i, to: today)!
            await fetchSchedule(for: date)
        }
    }
    
    func programmesForToday() -> [Programme] {
        let today = Date()
        let startOfDay = Calendar.current.startOfDay(for: today)
        let endOfDay = startOfDay.addingTimeInterval(86400)
        
        return programmes.filter { programme in
            let programmeStart = programme.startDate
            return programmeStart >= startOfDay && programmeStart < endOfDay
        }
    }
    
    func currentProgramme() -> Programme? {
        programmes.first { $0.isLiveNow }
    }
    
    func upcomingProgrammes() -> [Programme] {
        let now = Date().timeIntervalSince1970 * 1000
        return programmes
            .filter { Double($0.startTime) > now }
            .sorted { $0.startTime < $1.startTime }
    }
    
    func programmesGroupedByDate() -> [Date: [Programme]] {
        var grouped: [Date: [Programme]] = [:]
        
        for programme in programmes {
            let date = Calendar.current.startOfDay(for: programme.startDate)
            if grouped[date] == nil {
                grouped[date] = []
            }
            grouped[date]?.append(programme)
        }
        
        return grouped.mapValues { $0.sorted { $0.startTime < $1.startTime } }
    }
}
