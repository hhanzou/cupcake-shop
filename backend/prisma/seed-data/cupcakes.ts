export type SeedCupcake = {
  name: string
  description: string
  flavor: string
  price: string
  /** Slugs de categorias cadastradas no seed. */
  categories: string[]
  /** Arquivo dentro de prisma/seed-data/images/. */
  image: string
}

export const CUPCAKES: SeedCupcake[] = [
  {
    name: 'Chocolate',
    description: 'Cupcake de chocolate, o clássico que todo mundo gosta.',
    flavor: 'Chocolate',
    price: '10.00',
    categories: ['tradicional'],
    image: 'chocolate.webp',
  },
  {
    name: 'Chocolate Vegano',
    description: 'Cupcake de chocolate feito sem ingredientes de origem animal.',
    flavor: 'Chocolate',
    price: '12.00',
    categories: ['vegano'],
    image: 'chocolatevegano.webp',
  },
  {
    name: 'Aniversário',
    description: 'Cupcake festivo, perfeito para comemorar.',
    flavor: 'Aniversário',
    price: '15.00',
    categories: ['sazonal'],
    image: 'cupcakeaniversario.webp',
  },
  {
    name: 'Doce de Leite',
    description: 'Cupcake de doce de leite.',
    flavor: 'Doce de leite',
    price: '10.00',
    categories: ['tradicional'],
    image: 'docedeleite.webp',
  },
  {
    name: 'Frutas Vermelhas',
    description: 'Cupcake com frutas vermelhas.',
    flavor: 'Frutas vermelhas',
    price: '20.00',
    categories: ['gourmet'],
    image: 'frutasvermelhas.webp',
  },
  {
    name: 'Limão',
    description: 'Cupcake de limão, leve e refrescante.',
    flavor: 'Limão',
    price: '10.00',
    categories: ['tradicional'],
    image: 'limao.webp',
  },
  {
    name: 'Língua de Gato',
    description: 'Cupcake inspirado no tradicional biscoito língua de gato.',
    flavor: 'Língua de Gato',
    price: '20.00',
    categories: ['gourmet'],
    image: 'linguadegato.webp',
  },
  {
    name: 'Maracujá',
    description: 'Cupcake de maracujá.',
    flavor: 'Maracujá',
    price: '10.00',
    categories: ['tradicional'],
    image: 'maracuja.webp',
  },
  {
    name: 'Morango',
    description: 'Cupcake de morango.',
    flavor: 'Morango',
    price: '10.00',
    categories: ['tradicional'],
    image: 'morango.webp',
  },
  {
    name: 'Natalino',
    description: 'Cupcake temático para o Natal.',
    flavor: 'Natalino',
    price: '15.00',
    categories: ['sazonal'],
    image: 'natalino.webp',
  },
  {
    name: 'Pistache',
    description: 'Cupcake de pistache.',
    flavor: 'Pistache',
    price: '20.00',
    categories: ['gourmet'],
    image: 'pistache.webp',
  },
  {
    name: 'Red Velvet',
    description: 'Cupcake red velvet.',
    flavor: 'Red Velvet',
    price: '20.00',
    categories: ['gourmet'],
    image: 'redvelvet.webp',
  },
]
