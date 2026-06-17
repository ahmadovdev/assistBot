/** Payloads carried on each named queue. Kept here so bot and generation
 *  modules share the contract without importing each other. */
export interface OutlineJobData {
  presentationId: string;
}
