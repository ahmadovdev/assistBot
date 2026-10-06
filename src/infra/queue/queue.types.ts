/** Payloads carried on each named queue. Kept here so bot and generation
 *  modules share the contract without importing each other. */
export interface OutlineJobData {
  presentationId: string;
}

export interface CardsJobData {
  presentationId: string;
  /** Optional title-page (1-bet) metadata; when absent/disabled, slide 1 shows only the topic. */
  titul?: {
    enabled: boolean;
    university?: string;
    faculty?: string;
    student?: string;
  };
  /** Card-based points/bullets (default when absent) vs one flowing paragraph
   *  — see card.prompt.prose.ts. Only affects types with a prose variant. */
  contentMode?: 'cards' | 'prose';
  /** Admin QA mode: preserve every forced slide type for visual review. */
  fullTypesShowcase?: boolean;
}

export interface RenderJobData {
  presentationId: string;
}
