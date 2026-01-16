export interface ServiceRequest {
    id: string
    cafe_id: string
    table_no: string
    status: 'pending' | 'resolved'
    created_at: string
}
