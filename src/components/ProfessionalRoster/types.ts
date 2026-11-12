export interface Professional {
  id: string
  name: string
  email: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateProfessionalInput {
  name: string
  email: string
}

export interface UpdateProfessionalInput {
  is_active?: boolean
}
