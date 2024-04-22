'use client'

import { Button, buttonVariants } from '@/components/ui/Button'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { useDebouncedCallback } from '@mantine/hooks'
import { Product } from '@prisma/client'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Command } from 'cmdk'
import { Loader2, Search, X } from 'lucide-react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { FC, useEffect, useState, useTransition } from 'react'

interface SearchBarProps {}

const SearchBar: FC<SearchBarProps> = ({}) => {
  const searchParams = useSearchParams()
  const router = useRouter()

  const query = searchParams.get('query') ?? ''

  const [input, setInput] = useState(query)
  const [isTransitioning, startTransition] = useTransition()

  const search = () => startTransition(() => router.push(input ? `?query=${input}` : '/'))

  const debouncedSearch = useDebouncedCallback(() => {
    search()
  }, 500)

  const { toast } = useToast()

  const {
    data: products,
    isFetching,
    isError,
  } = useQuery({
    queryKey: ['searchQuery', query],
    queryFn: async () => {
      const { data } = await axios.get(`/api/search?query=${query}`)
      return data as Product[]
    },
    enabled: query.length > 0 ? true : false,
  })

  useEffect(() => {
    if (isError)
      toast({
        title: 'Qualcosa è andato storto',
        description: 'Non è stato possibile eseguire la ricerca. Per favore, riprova.',
        variant: 'destructive',
      })
  }, [isError, toast])

  return (
    <Command label='Command menu' shouldFilter={false}>
      <div className='relative z-10 h-14 w-full bg-white'>
        <Command.Input
          value={input}
          onValueChange={(input) => {
            setInput(input)
            debouncedSearch()
          }}
          placeholder='Cosa vuoi cercare?'
          className={
            'absolute inset-0 h-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50'
          }
        />
        <Button className='absolute inset-y-0 right-0 h-full rounded-l-none' size='sm' onClick={() => search()}>
          {isFetching ? <Loader2 className='h-6 w-6 animate-spin' /> : <Search className='h-6 w-6' />}
        </Button>
      </div>
      {query && <Command.List className={'divide-y divide-zinc-100 rounded-b-md bg-white py-4 shadow-md'}>
        {isFetching ? (
          <Command.Loading>
            <SearchResultSkeleton />
          </Command.Loading>
        ) : products?.length ? (
          <Command.List>
            {products?.map((p) => (
              <Command.Item key={p.id} value={p.id}>
                <SearchResult product={p} />
              </Command.Item>
            ))}
          </Command.List>
        ) : (
          <Command.Empty className='py-4 text-center'>
            <X className='mx-auto h-8 w-8 text-gray-400' />
            <h3 className='mt-2 text-sm font-semibold text-gray-900'>Nessun risultato</h3>
            <p className='mx-auto mt-1 max-w-prose text-sm text-gray-500'>
              Ci dispiace, non ci è stato possibile trovare nessun riscontro per <span className='font-medium text-green-600'>{query}</span>.
            </p>
          </Command.Empty>
        )}
      </Command.List>}
    </Command>
  )
}

export default SearchBar

function SearchResult({ product }: { product: Pick<Product, 'imageId' | 'name' | 'description' | 'price'> }) {
  return (
    <div className='mx-auto flex space-x-4 px-8 py-4'>
      <div className='relative flex h-40 w-40 items-center rounded-lg bg-zinc-100'>
        <Image loading='eager' fill sizes='33vw' alt='product-image' src={`/${product.imageId}`} />
      </div>

      <div className='w-full flex-1 space-y-2 py-1'>
        <h1 className='text-lg font-medium text-gray-900'>{product.name}</h1>

        <p className='prose prose-sm line-clamp-3 text-gray-500'>{product.description}</p>

        <p className='text-base font-medium text-gray-900'>${product.price.toFixed(2)}</p>
      </div>
    </div>
  )
}

function SearchResultSkeleton() {
  return (
    <div className='mx-auto flex w-full animate-pulse space-x-4 px-8 py-4'>
      <div className='h-40 w-40 rounded-lg bg-gray-300' />
      <div className='w-full flex-1 space-y-4 py-1'>
        <div className='h-10 w-full rounded bg-gray-300' />
        <div className='space-y-2'>
          <div className='h-4 w-4/5 rounded bg-gray-300' />
          <div className='h-4 w-4/5 rounded bg-gray-300' />
          <div className='h-4 w-4/5 rounded bg-gray-300' />
        </div>
      </div>
    </div>
  )
}
