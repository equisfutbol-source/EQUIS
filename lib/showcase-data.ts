export interface ClientLogo {
  name: string;
  image?: string;
}

export const CLIENT_LOGOS: ClientLogo[] = [
  { name: "Balboa Academy", image: "/balboa-academy.png" },
  { name: "C.D Plaza Amador", image: "/cd-plaza-amador.png" },
  { name: "Kings College School", image: "/kings-college-school.png" },
  { name: "Victor Suarez", image: "/victor-suarez.png" },
  { name: "MET Jaguars", image: "/met.png" },
  { name: "Sports Nexus", image: "/s-n.png" },
];

export interface GalleryItem {
  id: string;
  teamName: string;
  equipmentSpec: string;
  quote?: string;
  quoteAuthor?: string;
  image?: string;
}

export const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: "sports-nexus-1",
    teamName: "Sports Nexus",
    equipmentSpec: "Entrenamiento con equipamiento EQUIS",
    image: "/sports-nexus/sports-nexus-1.jpg",
  },
  {
    id: "sports-nexus-2",
    teamName: "Sports Nexus",
    equipmentSpec: "Entrenamiento con equipamiento EQUIS",
    image: "/sports-nexus/sports-nexus-2.jpg",
  },
  {
    id: "sports-nexus-3",
    teamName: "Sports Nexus",
    equipmentSpec: "Entrenamiento con equipamiento EQUIS",
    image: "/sports-nexus/sports-nexus-3.jpg",
  },
  {
    id: "sports-nexus-4",
    teamName: "Sports Nexus",
    equipmentSpec: "Entrenamiento con equipamiento EQUIS",
    image: "/sports-nexus/sports-nexus-4.jpg",
  },
  {
    id: "sports-nexus-5",
    teamName: "Sports Nexus",
    equipmentSpec: "Entrenamiento con equipamiento EQUIS",
    image: "/sports-nexus/sports-nexus-5.jpg",
  },
  {
    id: "sports-nexus-6",
    teamName: "Sports Nexus",
    equipmentSpec: "Entrenamiento con equipamiento EQUIS",
    image: "/sports-nexus/sports-nexus-6.jpg",
  },
];
