export interface CreatorChannelProfile {
  id: string;
  name: string;
  slug: string;
  bio: string;
  category: string;
  logo: string;
  banner: string;
  followersCount: number;
  totalViews: number;
  watchTimeHours: number;
  socialLinks: {
    website: string;
    youtube: string;
    twitter: string;
    instagram: string;
  };
}

export interface CreatorVideoItem {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoFileName: string;
  category: string;
  tags: string[];
  status: "PUBLISHED" | "DRAFT" | "PROCESSING";
  duration: string;
  views: number;
  likes: number;
  commentsCount: number;
  uploadDate: string;
  revenueEst: string;
}

export const INITIAL_CREATOR_CHANNEL: CreatorChannelProfile = {
  id: "chn-my-studio",
  name: "Apex Cine Labs",
  slug: "apex-cine-labs",
  bio: "Independent high-concept psychological thrillers, supernatural noir cinema, and award-winning short films crafted for curious minds.",
  category: "Psychological Thrillers",
  logo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
  banner: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80",
  followersCount: 194200,
  totalViews: 6150000,
  watchTimeHours: 42800,
  socialLinks: {
    website: "https://apexcine.io",
    youtube: "https://youtube.com/@apexcine",
    twitter: "https://twitter.com/apexcine",
    instagram: "https://instagram.com/apexcine",
  },
};

export const INITIAL_CREATOR_VIDEOS: CreatorVideoItem[] = [
  {
    id: "cr-vid-1",
    title: "SHADOWS (Official Feature Film)",
    description: "A blood-red moon unveils dark secrets buried for centuries in an isolated Gothic fortress.",
    thumbnail: "/images/shadows_poster.png",
    videoFileName: "shadows_master_4k_prores.mov",
    category: "Psychological Thrillers",
    tags: ["thriller", "mystery", "4k", "gothic"],
    status: "PUBLISHED",
    duration: "2h 08m",
    views: 2150000,
    likes: 124000,
    commentsCount: 3840,
    uploadDate: "2026-08-10",
    revenueEst: "$6,420",
  },
  {
    id: "cr-vid-2",
    title: "Echoes in the Fog — Behind the Scenes",
    description: "Director commentary and multi-camera breakdowns of atmospheric set designs.",
    thumbnail: "/images/the_last_light_poster.png",
    videoFileName: "behind_the_scenes_ep1.mp4",
    category: "Documentary & Real World",
    tags: ["bts", "filmmaking", "lighting"],
    status: "PUBLISHED",
    duration: "24m 12s",
    views: 480000,
    likes: 31200,
    commentsCount: 890,
    uploadDate: "2026-08-18",
    revenueEst: "$1,240",
  },
  {
    id: "cr-vid-3",
    title: "Project Zero Hour (Teaser Trailer)",
    description: "First look at our upcoming 2027 cosmic thriller series.",
    thumbnail: "/images/beyond_horizon_poster.jpg",
    videoFileName: "teaser_master.mov",
    category: "Sci-Fi & Cosmic",
    tags: ["trailer", "teaser", "2027"],
    status: "DRAFT",
    duration: "1m 45s",
    views: 0,
    likes: 0,
    commentsCount: 0,
    uploadDate: "2026-08-28",
    revenueEst: "$0.00",
  },
];
