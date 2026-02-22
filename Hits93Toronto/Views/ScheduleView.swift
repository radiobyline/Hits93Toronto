import SwiftUI

struct ScheduleView: View {
    @ObservedObject var scheduleVM: ScheduleViewModel
    @ObservedObject var playerVM: PlayerViewModel
    @State private var selectedDate = Date()
    
    var body: some View {
        NavigationStack {
            ZStack {
                if scheduleVM.programmes.isEmpty && !scheduleVM.isLoading {
                    VStack(spacing: 16) {
                        Image(systemName: "calendar.badge.exclamationmark")
                            .font(.system(size: 48))
                            .foregroundColor(.gray)
                        
                        Text("No Schedule Available")
                            .font(.headline)
                        
                        Text("Check back later")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Color(UIColor.systemBackground))
                } else {
                    VStack {
                        // Date Picker
                        DatePicker(
                            "Select Date",
                            selection: $selectedDate,
                            displayedComponents: .date
                        )
                        .datePickerStyle(.graphical)
                        .padding()
                        .onChange(of: selectedDate) { newDate in
                            Task {
                                await scheduleVM.fetchSchedule(for: newDate)
                            }
                        }
                        
                        // Schedule List for Selected Date
                        List {
                            let programmesForDate = scheduleVM.programmes.filter { programme in
                                let calendar = Calendar.current
                                let programmeDate = calendar.startOfDay(for: programme.startDate)
                                let selectedDateStart = calendar.startOfDay(for: selectedDate)
                                return programmeDate == selectedDateStart
                            }
                            
                            if programmesForDate.isEmpty {
                                HStack {
                                    Spacer()
                                    Text("No programmes scheduled")
                                        .foregroundColor(.secondary)
                                    Spacer()
                                }
                            } else {
                                ForEach(programmesForDate, id: \.id) { programme in
                                    NavigationLink(destination: ProgrammeDetailView(programme: programme)) {
                                        ProgrammeListRow(programme: programme)
                                    }
                                }
                            }
                        }
                    }
                }
            }
            .navigationTitle("Schedule")
            .navigationBarTitleDisplayMode(.inline)
            .onAppear {
                if scheduleVM.programmes.isEmpty {
                    Task {
                        await scheduleVM.fetchWeeklySchedule()
                    }
                }
            }
            .overlay(alignment: .bottom) {
                if let error = scheduleVM.error {
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
}

struct ProgrammeListRow: View {
    let programme: Programme
    
    var body: some View {
        HStack(spacing: 12) {
            // Time indicator
            VStack(alignment: .center, spacing: 2) {
                Text(programme.startDate.formatted(date: .omitted, time: .shortened))
                    .font(.caption)
                    .fontWeight(.semibold)
                
                if programme.isLiveNow {
                    Label("LIVE", systemImage: "dot.radiowaves.left.and.right")
                        .font(.caption2)
                        .foregroundColor(.red)
                }
            }
            .frame(width: 50)
            
            Divider()
            
            // Programme Info
            VStack(alignment: .leading, spacing: 4) {
                Text(programme.name)
                    .font(.body)
                    .fontWeight(.semibold)
                    .lineLimit(1)
                
                if let host = programme.host {
                    Text(host)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }
                
                HStack(spacing: 8) {
                    Text(programme.endDate.formatted(date: .omitted, time: .shortened))
                        .font(.caption2)
                        .foregroundColor(.secondary)
                    
                    if let genre = programme.genre {
                        Text("• \(genre)")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                }
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}

// MARK: - Programme Detail View

struct ProgrammeDetailView: View {
    let programme: Programme
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                // Header
                HStack {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(programme.name)
                            .font(.title2)
                            .fontWeight(.bold)
                        
                        if let host = programme.host {
                            Label(host, systemImage: "person.fill")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        
                        HStack(spacing: 8) {
                            Label(programme.startDate.formatted(date: .omitted, time: .shortened),
                                  systemImage: "clock")
                            
                            Label(programme.endDate.formatted(date: .omitted, time: .shortened),
                                  systemImage: "clock.badge.checkmark")
                        }
                        .font(.caption)
                        .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                    
                    if programme.isLiveNow {
                        Label("LIVE", systemImage: "dot.radiowaves.left.and.right")
                            .font(.caption)
                            .foregroundColor(.white)
                            .padding(8)
                            .background(Color.red)
                            .cornerRadius(4)
                    }
                }
                
                if let description = programme.description {
                    Text(description)
                        .font(.body)
                        .lineLimit(10)
                }
                
                if let genre = programme.genre {
                    Label(genre, systemImage: "music.note")
                        .font(.caption)
                        .padding(8)
                        .background(Color.gray.opacity(0.2))
                        .cornerRadius(4)
                }
                
                Spacer()
            }
            .padding()
        }
        .navigationBarTitleDisplayMode(.inline)
        .navigationBarBackButtonHidden(false)
    }
}

#Preview {
    let audioService = AudioService()
    return ScheduleView(
        scheduleVM: ScheduleViewModel(),
        playerVM: PlayerViewModel(audioService: audioService)
    )
}
