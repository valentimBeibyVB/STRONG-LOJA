import { Product, StoreConfig } from '../types';

export const DEFAULT_STORE_CONFIG: StoreConfig = {
  storeName: 'STRONG',
  tagline: 'STREETWEAR & ESSENTIAL APPAREL',
  whatsappNumber: '244923456789', // default phone (editable in admin)
  countryCode: '+244',
  currencySymbol: 'Kz',
  currencyPosition: 'suffix',
  welcomeMessage: 'Olá Strong! Vim através da vossa loja online e gostaria de finalizar a seguinte encomenda:',
  instagramHandle: '@strong.brand',
  address: 'Luanda, Angola | Entregas para todo o país',
  adminPassword: 'admin',
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'strong-tshirt-heavyweight',
    name: 'T-shirt Oversized Strong Heavyweight',
    category: 'tshirts',
    price: 16000,
    originalPrice: 19500,
    description: 'T-shirt com corte oversized streetwear premium em algodão penteado 240g/m². Gola canelada encorpada de 3cm com logotipo STRONG bordado minimalista.',
    details: [
      '100% Algodão Premium Heavyweight 240g',
      'Corte solto contemporâneo (Oversized fit)',
      'Gola reforçada de 3cm que não laceia',
      'Costuras duplas reforçadas nos ombros e barra'
    ],
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80',
    colors: [
      { name: 'Preto Profundo', hex: '#111111', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80' },
      { name: 'Branco Puro', hex: '#f8fafc', image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=1000&q=80' },
      { name: 'Cinzento Grafite', hex: '#4b5563', image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1000&q=80' },
      { name: 'Verde Militar', hex: '#3f4f34', image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=1000&q=80' },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    inStock: true,
    badge: 'Bestseller',
  },
  {
    id: 'strong-bucket-hat-street',
    name: 'Chapéu Bucket Hat Strong Street',
    category: 'chapeus',
    price: 9500,
    originalPrice: 12000,
    description: 'Bucket Hat icónico da Strong em sarja de alta gramatura com etiqueta emborrachada frontal. Design resistente e respirável ideal para compor o look streetwear diário.',
    details: [
      'Tecido em Sarja 100% Algodão resistente',
      'Ilhoses bordados para ventilação térmica',
      'Aba maleável com costuras concêntricas',
      'Circunferência padrão com ajuste anatómico'
    ],
    image: 'https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?auto=format&fit=crop&w=1000&q=80',
    colors: [
      { name: 'Preto Matte', hex: '#171717', image: 'https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?auto=format&fit=crop&w=1000&q=80' },
      { name: 'Bege Areia', hex: '#d6c7b2', image: 'https://images.unsplash.com/photo-1596455607563-ad6193f76b17?auto=format&fit=crop&w=1000&q=80' },
      { name: 'Verde Tático', hex: '#2e3a29', image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=1000&q=80' },
      { name: 'Azul Navy', hex: '#1e293b', image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=1000&q=80' },
    ],
    sizes: ['Tamanho Único'],
    inStock: true,
    badge: 'Destaque',
  },
  {
    id: 'strong-tshirt-signature-box',
    name: 'T-shirt Strong Signature Boxy',
    category: 'tshirts',
    price: 15000,
    description: 'Modelagem boxy moderna com ombros caídos e caimento estruturado. Estampa serigráfica em alto relevo com o lema "BUILT STRONG" nas costas.',
    details: [
      'Algodão Sustentável toque aveludado',
      'Ombros ligeiramente caídos (Drop shoulder)',
      'Estampa serigráfica resistente a lavagens',
      'Etiqueta interna em termotransferência antialérgica'
    ],
    image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1000&q=80',
    colors: [
      { name: 'Branco Neve', hex: '#ffffff', image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1000&q=80' },
      { name: 'Preto Total', hex: '#0f0f0f', image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=1000&q=80' },
      { name: 'Castanho Terra', hex: '#78350f', image: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=1000&q=80' },
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    inStock: true,
    badge: 'Novo',
  },
  {
    id: 'strong-bone-trucker',
    name: 'Boné Strong Trucker Curved Visor',
    category: 'chapeus',
    price: 8500,
    originalPrice: 11000,
    description: 'Boné estilo Trucker com traseira em malha respirável, fecho snapback regulável e patch frontal bordado com relevo de alta definição.',
    details: [
      'Frente em Sarja premium estruturada',
      'Traseira em tela mesh para ventilação máxima',
      'Fecho regulável snapback de 7 pinos',
      'Aba curva com 6 costuras de sustentação'
    ],
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=1000&q=80',
    colors: [
      { name: 'Black on Black', hex: '#121212', image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=1000&q=80' },
      { name: 'Preto & Branco', hex: '#e2e8f0', image: 'https://images.unsplash.com/photo-1534215754734-18e55d13e346?auto=format&fit=crop&w=1000&q=80' },
      { name: 'Carmesim & Preto', hex: '#991b1b', image: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=1000&q=80' },
    ],
    sizes: ['Ajustável (Snapback)'],
    inStock: true,
    badge: 'Popular',
  },
  {
    id: 'strong-bone-strapback',
    name: 'Boné Strong 5-Panel Strapback',
    category: 'chapeus',
    price: 9000,
    description: 'Boné contemporâneo 5-Panel com aba semi-reta, tira traseira em tecido ajustável com fivela metálica personalizada STRONG.',
    details: [
      'Construção 5-Panel de perfil baixo',
      'Fita de ajuste traseira com fecho de fivela metálica',
      'Forro interno anti-suor e costuras de alta precisão',
      'Design clean urbano e minimalista'
    ],
    image: 'https://images.unsplash.com/photo-1534215754734-18e55d13e346?auto=format&fit=crop&w=1000&q=80',
    colors: [
      { name: 'Grafite Fosco', hex: '#334155', image: 'https://images.unsplash.com/photo-1534215754734-18e55d13e346?auto=format&fit=crop&w=1000&q=80' },
      { name: 'Preto Puro', hex: '#18181b', image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=1000&q=80' },
      { name: 'Bege Cáqui', hex: '#d4b996', image: 'https://images.unsplash.com/photo-1596455607563-ad6193f76b17?auto=format&fit=crop&w=1000&q=80' },
    ],
    sizes: ['Ajustável (Strapback)'],
    inStock: true,
  },
  {
    id: 'strong-tshirt-acid-wash',
    name: 'T-shirt Strong Acid Wash Vintage',
    category: 'tshirts',
    price: 17500,
    description: 'Lavagem especial estonada acid wash que confere a cada peça uma tonalidade única. Confeccionada com gola grossa vintage e toque ultra macio.',
    details: [
      'Algodão 100% amaciado com lavagem estonada manual',
      'Padrão marmorizado exclusivo por peça',
      'Gramatura 220g/m² com caimento impecável',
      'Ribana reforçada e acabamento premium'
    ],
    image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1000&q=80',
    colors: [
      { name: 'Chumbo Estonado', hex: '#374151', image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1000&q=80' },
      { name: 'Castanho Vintage', hex: '#573d2f', image: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=1000&q=80' },
      { name: 'Verde Washed', hex: '#3d4d3d', image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=1000&q=80' },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    inStock: true,
    badge: 'Edição Limitada',
  },
  {
    id: 'strong-hoodie-heavy-fleece',
    name: 'Moletom Hoodie Strong Heavy Fleece',
    category: 'hoodies',
    price: 26000,
    originalPrice: 32000,
    description: 'Casaco Moletom com capuz duplo estruturado e bolso canguru. Interior peluciado ultra macio para máxima proteção e presença estética inconfundível.',
    details: [
      'Moletom 3 cabos 380g/m² com felpa interna pesada',
      'Capuz duplo estruturado sem cordões para visual clean',
      'Punhos e barra com ribana canelada 2x1',
      'Logo STRONG bordado tom-sobre-tom'
    ],
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1000&q=80',
    colors: [
      { name: 'Preto Carvão', hex: '#171717', image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1000&q=80' },
      { name: 'Cinzento Mescla', hex: '#9ca3af', image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1000&q=80' },
      { name: 'Off-White Areia', hex: '#e5e5e5', image: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1000&q=80' },
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    inStock: true,
    badge: 'Inverno',
  }
];
