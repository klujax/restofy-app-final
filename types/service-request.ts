export interface ServiceRequest {
    id: string
    profile_id: string
    table_number: string
    status: 'pending' | 'resolved'
    created_at: string
}
