export type ProfessionalTier = 'in_depth' | 'general'

export interface Professional {
  id: string
  name: string
  email: string
  tier: ProfessionalTier
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateProfessionalInput {
  name: string
  email: string
  tier?: ProfessionalTier
}

export interface UpdateProfessionalInput {
  tier?: ProfessionalTier
  is_active?: boolean
}
