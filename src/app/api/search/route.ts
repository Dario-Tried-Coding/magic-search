import { Product } from '@prisma/client'
import z from 'zod'
import { SupabaseHybridSearch } from '@langchain/community/retrievers/supabase'
import { OpenAIEmbeddings } from '@langchain/openai'
import { supabase } from '@/lib/supabase'

export async function GET(req: Request) {
  const url = new URL(req.url)

  const unsafeQuery = url.searchParams.get('query')

  try {
    const { query } = z.object({ query: z.string() }).parse({ query: unsafeQuery })

    const embeddings = new OpenAIEmbeddings()

    const retriever = new SupabaseHybridSearch(embeddings, {
      client: supabase,
      tableName: 'product_vector',
      similarityQueryName: 'match_products',
      keywordQueryName: 'kw_match_products',
      similarityK: 3
    })

    const prods = await retriever.getRelevantDocuments(query)

    return new Response(JSON.stringify(prods.map(p => p.metadata)))
  } catch (error) {
    console.log(error)
    return new Response('Could not query products', { status: 500 })
  }
}

function andSqlQuery(query: string) {
  return query.split(' ').join(' & ')
}