export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: "UPPER" | "LOWER" | "ACCESSORIES";
  className?: string; // For bento grid layout spans
}

export const PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "AURA MATRIX JACKET",
    price: 285.00,
    image: "/images/products/TGIS 1 (1).jpg",
    category: "UPPER",
    className: "md:col-span-2 md:row-span-2",
  },
  {
    id: "p2",
    name: "NEXUS ELITE LEGGINGS",
    price: 145.00,
    image: "/images/products/TGIS 2.jpg",
    category: "LOWER",
  },
  {
    id: "p3",
    name: "VERTEX PERFORMANCE TEE",
    price: 85.00,
    image: "/images/products/TGIS 3.jpg",
    category: "UPPER",
  },
  {
    id: "p4",
    name: "GRAVITY COMPRESSION SHORTS",
    price: 110.00,
    image: "/images/products/TGIS 4.jpg",
    category: "LOWER",
  },
  {
    id: "p5",
    name: "ION PULSE CAP",
    price: 65.00,
    image: "/images/products/TGIS 5.jpg",
    category: "ACCESSORIES",
  },
  {
    id: "p6",
    name: "PHANTOM TRAINING BAG",
    price: 185.00,
    image: "/images/products/TGIS 6.jpg",
    category: "ACCESSORIES",
  },
  {
    id: "p7",
    name: "KINETIC TENSOR HOODIE",
    price: 195.00,
    image: "/images/products/TGIS 7.jpg",
    category: "UPPER",
  },
  {
    id: "p8",
    name: "ORBITAL RUNNING PANTS",
    price: 165.00,
    image: "/images/products/TGIS 8.jpg",
    category: "LOWER",
  }
];
