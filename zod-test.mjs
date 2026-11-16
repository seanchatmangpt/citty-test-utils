import { z } from 'zod'

try {
  const schema = z.object({
    name: z.string().min(1, "Name cannot be empty")
  })
  console.log('Schema created')
  schema.parse({ name: '' })
} catch (err) {
  console.log('Caught error:', err)
}
