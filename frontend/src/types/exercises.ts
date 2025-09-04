export type SpeechItem = { id: string; target: string }
export type PrepItem   = { id: string; tokens: string[]; answer: string[] }
export type TFItem     = { id: string; passage: string; claim: string; answer: boolean }
