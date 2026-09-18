import { UIQuestion, PrimaryRecommendation } from '../../src/types';

export interface Laptop {
  id: string;
  name: string;
  brand: string;
  price: number;
  processor: string;
  ramGB: number;
  storageGB: number;
  batteryHours: number;
  screenSize: string;
  weightLbs: number;
  gpu: string;
  idealFor: string;
  imageUrl: string;
}

export const LAPTOPS_DATA: Laptop[] = [
  {
    id: 'macbook-pro-14-m3',
    name: 'Apple MacBook Pro 14" (M3 Pro)',
    brand: 'Apple',
    price: 1999,
    processor: 'Apple M3 Pro (12-core CPU, 18-core GPU)',
    ramGB: 18,
    storageGB: 512,
    batteryHours: 18,
    screenSize: '14.2" Liquid Retina XDR (120Hz ProMotion)',
    weightLbs: 3.5,
    gpu: 'M3 Pro Integrated',
    idealFor: 'Software developers, UI designers, and creators who need all-day battery life and silent performance.',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80'
  },
  {
    id: 'dell-xps-14-2026',
    name: 'Dell XPS 14 (Intel Core Ultra 7)',
    brand: 'Dell',
    price: 1699,
    processor: 'Intel Core Ultra 7 155H with NPU',
    ramGB: 32,
    storageGB: 1000,
    batteryHours: 14,
    screenSize: '14.5" 3.2K OLED Touch',
    weightLbs: 3.7,
    gpu: 'NVIDIA RTX 4050 (30W)',
    idealFor: 'Business executives and power users who want a sleek aluminum chassis and vibrant OLED display.',
    imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1000&q=80'
  },
  {
    id: 'lenovo-legion-pro-7i',
    name: 'Lenovo Legion Pro 7i Gen 9',
    brand: 'Lenovo',
    price: 2299,
    processor: 'Intel Core i9-14900HX',
    ramGB: 32,
    storageGB: 2000,
    batteryHours: 5,
    screenSize: '16" WQXGA 240Hz 500 nits',
    weightLbs: 5.7,
    gpu: 'NVIDIA GeForce RTX 4080 (175W)',
    idealFor: 'Competitive gamers and 3D rendering artists who prioritize maximum framerates over battery mobility.',
    imageUrl: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1000&q=80'
  },
  {
    id: 'asus-zenbook-14-oled',
    name: 'ASUS Zenbook 14 OLED (Ryzen 8040)',
    brand: 'ASUS',
    price: 999,
    processor: 'AMD Ryzen 7 8840HS with Ryzen AI',
    ramGB: 16,
    storageGB: 1000,
    batteryHours: 15,
    screenSize: '14" 3K OLED (120Hz)',
    weightLbs: 2.8,
    gpu: 'AMD Radeon 780M',
    idealFor: 'College students and mobile professionals seeking ultraportable weight and high value under $1,000.',
    imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1000&q=80'
  }
];

export const LAPTOP_QUESTIONS: Record<string, UIQuestion> = {
  budget: {
    key: 'budget',
    type: 'budget_range',
    title: 'What is your target budget for a laptop?',
    options: [
      { label: 'Under $1,000', value: 'under_1000', icon: 'wallet', description: 'Student & everyday value' },
      { label: '$1,000 – $1,800', value: '1000_1800', icon: 'badge-percent', description: 'Premium ultraportables' },
      { label: '$1,800+', value: 'over_1800', icon: 'crown', description: 'High-end workstation & gaming' },
      { label: 'Flexible budget', value: 'flexible', icon: 'sparkles' }
    ]
  },
  usage: {
    key: 'usage',
    type: 'single_select',
    title: 'What is your primary use case?',
    options: [
      { label: 'Software Coding & Web Dev', value: 'coding', icon: 'terminal', description: 'RAM, Unix tools, fast CPU' },
      { label: 'Gaming & 3D Graphics', value: 'gaming', icon: 'gamepad-2', description: 'Dedicated RTX GPU & 240Hz screen' },
      { label: 'College & Remote Work', value: 'student', icon: 'book-open', description: 'Lightweight & 14hr+ battery' },
      { label: 'Video Editing & Creators', value: 'creator', icon: 'video', description: 'Color-accurate display & fast render' }
    ]
  },
  operatingSystem: {
    key: 'operatingSystem',
    type: 'single_select',
    title: 'Which operating system do you prefer?',
    options: [
      { label: 'macOS (Apple)', value: 'macos', icon: 'laptop', description: 'M-series battery life & trackpad' },
      { label: 'Windows 11', value: 'windows', icon: 'monitor', description: 'Maximum game & software compatibility' },
      { label: 'No preference', value: 'any', icon: 'sparkles' }
    ]
  }
};
