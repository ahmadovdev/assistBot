/**
 * Named queues for the generation pipeline.
 * Each stage is its own queue so they can scale / be monitored independently.
 */
export const QUEUES = {
  OUTLINE: 'outline',
  CARDS: 'cards',
  IMAGES: 'images',
  RENDER: 'render',
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];
