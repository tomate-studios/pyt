export type TheoryStatus = 'draft' | 'pending' | 'rejected' | 'published'
export type Verdict = 'approved' | 'review' | 'rejected' | 'clean'

export interface FlaggedClaim {
  fragment: string
  type: string
  reason: string
  established?: string
}

export interface DisinformationResult {
  detector: string
  verdict: 'approved' | 'review' | 'rejected'
  classification: string
  riskScore: number
  flaggedClaims: FlaggedClaim[]
  reasons: string[]
  confidence: string
  sourcesConsulted: string[]
  notVerifiable: boolean
  limitations: string
  suggestion: string | null
}

export interface ProfanityMatch {
  fragment: string
  context: string
  severity: 'high' | 'medium'
  category: string
}

export interface ProfanityResult {
  detector: string
  verdict: 'clean' | 'review' | 'rejected'
  matches: ProfanityMatch[]
  explanation: string
  suggestion: string | null
  confidence: string
  limitations: string
}

export interface Review {
  pipelineVersion: string
  steps: { step: number; detector: string; verdict: string }[]
  disinformation: DisinformationResult
  profanity: ProfanityResult
  decidedAt: string
}

export interface Theory {
  id: number
  title: string
  category: string
  summary: string
  content: string
  sources: string
  author: string
  status: TheoryStatus
  review: Review | null
  isExample: boolean
  likes: number
  likedByMe: boolean
  mine: boolean
  createdAt: string
  updatedAt: string
}

export interface Comment {
  id: number
  author: string
  content: string
  createdAt: string
}

export interface LabResult {
  wouldBe: TheoryStatus
  review: Review
}

export interface TheoryInput {
  title: string
  category: string
  summary: string
  content: string
  sources: string
  author: string
}
