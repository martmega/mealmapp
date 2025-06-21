import { z } from 'zod';

const schema = z.object({
  name: z.string(),
  calories: z.number().min(0),
});

console.log(schema.parse({ name: 'test', calories: 42 }));
