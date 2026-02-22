import SwiftUI

struct ProgrammesView: View {
    @State private var searchText = ""
    
    var body: some View {
        NavigationStack {
            ZStack {
                LinearGradient(
                    gradient: Gradient(colors: [Color.red.opacity(0.1), Color.black.opacity(0.2)]),
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
                
                VStack(spacing: 16) {
                    // Search
                    HStack {
                        Image(systemName: "magnifyingglass")
                            .foregroundColor(.gray)
                        
                        TextField("Search programmes", text: $searchText)
                    }
                    .padding(10)
                    .background(Color(UIColor.systemBackground))
                    .cornerRadius(8)
                    .padding()
                    
                    // TODO: Implement programme list with search
                    VStack(spacing: 12) {
                        Image(systemName: "radio")
                            .font(.system(size: 48))
                            .foregroundColor(.gray)
                        
                        Text("Programmes")
                            .font(.headline)
                        
                        Text("Detailed programme directory coming soon")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    
                    Spacer()
                }
            }
            .navigationTitle("Programmes")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

#Preview {
    ProgrammesView()
}
