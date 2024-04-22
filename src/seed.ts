import { products as productsData } from '@/data/products'
import { faker } from '@faker-js/faker'
import { OpenAIEmbeddings } from '@langchain/openai'
import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { nanoid } from 'nanoid'

dotenv.config()

const embeddings = new OpenAIEmbeddings({
  model: 'text-embedding-3-large',
  dimensions: 1536,
})

const db = new PrismaClient()

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)

async function main() {
  console.log('[INFO]: Seeding process initialized')

  const products = []

  try {
    await db.product.deleteMany()

    const { error } = await supabase.from('product_vector').delete().neq('id', 0)
    if (error) throw new Error(error.message)
    
    for (const { imageId, description } of productsData) {
      products.push({
        id: nanoid(),
        name: formatFileName(imageId),
        description,
        price: +faker.commerce.price(),
        imageId,
      })
    }

    products.forEach(async ({ id, name, description, imageId, price }) => {
      await db.product.create({ data: { id, name, description, imageId, price } })

      const vector = await embeddings.embedDocuments([`${name}: ${description}`])

      const { status, error } = await supabase.from('product_vector').insert({
        id,
        text: `${name}: ${description}`,
        metadata: { id, name, description, imageId, price },
        embedding: vector[0],
      })

      if (error) console.log(error)

      console.log(`[SUCCESS] Product ${name} has been successfully seeded!`)
    })
  } catch (error) {
    console.error(error)
  }
}

// 'dark_down_jacket_1.png' -> 'Dark Down Jacket 1'
function formatFileName(fileName: string): string {
  const nameWithoutExtension = fileName.replace(/\.\w+$/, '')
  const words = nameWithoutExtension.split('_')

  const capitalizedWords = words.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  return capitalizedWords.join(' ')
}

main()
