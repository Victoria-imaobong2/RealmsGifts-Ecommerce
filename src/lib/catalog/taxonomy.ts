import { unsplash, type ProductImage } from "./images";

export type CategorySlug =
  | "flowers"
  | "cakes"
  | "chocolates"
  | "gift-boxes"
  | "perfumes"
  | "jewelry"
  | "watches"
  | "fashion"
  | "shoes"
  | "bags"
  | "beauty"
  | "personal-care"
  | "home"
  | "personalized"
  | "electronics"
  | "baby-kids"
  | "food"
  | "american-classics";

export interface Category {
  slug: CategorySlug;
  name: string;
  description: string;
  image: ProductImage;
}

export const CATEGORIES: Category[] = [
  { slug: "flowers", name: "Flowers & Bouquets", description: "Roses, seasonal arrangements and elegant bouquets.", image: unsplash("1561729098-cbab0f7a9f7c", "A hand holding a bouquet of red roses") },
  { slug: "cakes", name: "Cakes & Desserts", description: "Birthday cakes, celebration cakes, cupcakes and dessert boxes.", image: unsplash("1605807646983-377bc5a76493", "A chocolate layer cake topped with cherries") },
  { slug: "chocolates", name: "Chocolates & Sweet Treats", description: "Premium chocolate, candy boxes, cookies and treats.", image: unsplash("1687795097254-f019f9d7fd17", "An open box of assorted chocolates") },
  { slug: "gift-boxes", name: "Gift Boxes & Hampers", description: "Curated boxes for birthdays, celebrations and appreciation.", image: unsplash("1769286145156-70a40fff80ec", "A gift basket with a book, candle and ribbon") },
  { slug: "perfumes", name: "Perfumes & Fragrances", description: "Fragrances, perfume sets and discovery collections.", image: unsplash("1615108395437-df128ad79e80", "A glass perfume bottle surrounded by soft petals") },
  { slug: "jewelry", name: "Jewelry", description: "Necklaces, bracelets, earrings and personalized pieces.", image: unsplash("1708220040824-b273dd0a17cc", "Gold hoop earrings on a white stand") },
  { slug: "watches", name: "Watches", description: "Classic watches, dress watches and gift sets.", image: unsplash("1556597130-ef7aa3c71ff5", "A silver analog watch with a brown leather strap") },
  { slug: "fashion", name: "Fashion", description: "Shirts, dresses and everyday lifestyle pieces.", image: unsplash("1602810316693-3667c854239a", "Neatly folded button-up shirts") },
  { slug: "shoes", name: "Shoes & Sneakers", description: "Casual footwear, sneakers and formal shoes.", image: unsplash("1616406432452-07bc5938759d", "Brown leather loafers on a blue textile") },
  { slug: "bags", name: "Bags & Accessories", description: "Handbags, totes, crossbody bags and accessories.", image: unsplash("1624687943971-e86af76d57de", "A brown leather handbag") },
  { slug: "beauty", name: "Beauty & Skincare", description: "Self-care sets, skincare and beauty gifts.", image: unsplash("1631729371254-42c2892f0e6e", "Minimal white skincare bottles") },
  { slug: "personal-care", name: "Personal Care", description: "Bath, body, grooming and wellness gift sets.", image: unsplash("1550623685-2227f7bbef18", "A glass jar of bath salts") },
  { slug: "home", name: "Home & Lifestyle", description: "Candles, frames and decorative pieces for the home.", image: unsplash("1612293905607-b003de9e54fb", "A candle in an amber glass jar being lit") },
  { slug: "personalized", name: "Personalized Gifts", description: "Photo gifts, engraved keepsakes and custom mugs.", image: unsplash("1672664003230-106aa4f534c7", "A carved wooden keepsake box") },
  { slug: "electronics", name: "Electronics & Gadgets", description: "Earbuds, speakers, power banks and accessories.", image: unsplash("1582978571763-2d039e56f0c3", "A small portable speaker on a wooden table") },
  { slug: "baby-kids", name: "Baby & Kids", description: "Baby hampers, soft toys and storybooks.", image: unsplash("1556012018-50c5c0da73bf", "A brown teddy bear with a red bow") },
  { slug: "food", name: "Food & Treats", description: "Snack boxes, gourmet treats and food hampers.", image: unsplash("1773450935809-512f3b662fe1", "A gourmet food gift box with fruits, cookies and cheese") },
  { slug: "american-classics", name: "American Classics", description: "Cheesecake, pecan pie, apple pie and all-American treats.", image: unsplash("1600626336477-96e4ee89a052", "A lattice-top apple pie on a wooden table") },
];

export type OccasionSlug =
  | "birthday"
  | "anniversary"
  | "valentines-day"
  | "mothers-day"
  | "fathers-day"
  | "graduation"
  | "wedding"
  | "engagement"
  | "baby-shower"
  | "new-baby"
  | "housewarming"
  | "thank-you"
  | "congratulations"
  | "get-well-soon"
  | "sympathy"
  | "christmas"
  | "just-because";

export interface Occasion {
  slug: OccasionSlug;
  name: string;
  description: string;
  image: ProductImage;
  /** Seasonal occasions are only promoted inside this window (month is 1-based). */
  season?: { from: [number, number]; to: [number, number] };
}

export const OCCASIONS: Occasion[] = [
  { slug: "birthday", name: "Birthday", description: "Make their day feel like it's all about them.", image: unsplash("1545696563-af8f6ec2295a", "Candles being lit on a birthday cake") },
  { slug: "anniversary", name: "Anniversary", description: "Celebrate the years, and everything still ahead.", image: unsplash("1616688921235-118d6ee32bdf", "A person holding a bouquet of red roses") },
  { slug: "valentines-day", name: "Valentine's Day", description: "Say it with something they'll remember.", image: unsplash("1580740132087-761c25cacbf6", "Red roses on a white surface"), season: { from: [1, 15], to: [2, 14] } },
  { slug: "mothers-day", name: "Mother's Day", description: "For the woman who gave you everything.", image: unsplash("1554356010-4488fa26bad6", "A woman holding a bouquet of pink roses"), season: { from: [4, 15], to: [5, 14] } },
  { slug: "fathers-day", name: "Father's Day", description: "Thoughtful gifts for the man who's always there.", image: unsplash("1649300892935-5bb48d057e7e", "A Father's Day sign beside two neckties"), season: { from: [5, 20], to: [6, 21] } },
  { slug: "graduation", name: "Graduation", description: "Mark the milestone they worked so hard for.", image: unsplash("1541339907198-e08756dedf3f", "Graduates throwing their caps into the air") },
  { slug: "wedding", name: "Wedding", description: "Elegant gifts to toast the happy couple.", image: unsplash("1525258946800-98cfd641d0de", "A bride holding a white and pink rose bouquet") },
  { slug: "engagement", name: "Engagement", description: "Celebrate the yes with something special.", image: unsplash("1512163143273-bde0e3cc7407", "An engagement ring in an open box") },
  { slug: "baby-shower", name: "Baby Shower", description: "Sweet gifts to welcome the newest arrival.", image: unsplash("1513780194864-9ac1138f93ac", "A pink teddy bear beside a gift box") },
  { slug: "new-baby", name: "New Baby", description: "Soft, sweet and made for little hands.", image: unsplash("1510154221590-ff63e90a136f", "A parent holding a newborn's tiny feet") },
  { slug: "housewarming", name: "Housewarming", description: "Help make their new place feel like home.", image: unsplash("1614594975525-e45190c55d0b", "Hands holding a potted plant") },
  { slug: "thank-you", name: "Thank You", description: "Gratitude, beautifully wrapped.", image: unsplash("1526614180703-827d23e7c8f2", "A hand holding a thank-you card") },
  { slug: "congratulations", name: "Congratulations", description: "Raise a toast to their big news.", image: unsplash("1580657274234-7339717f4541", "Champagne being poured into glasses") },
  { slug: "get-well-soon", name: "Get Well Soon", description: "A little comfort while they rest and recover.", image: unsplash("1523920290228-4f321a939b4c", "A cup of tea beside white flowers") },
  { slug: "sympathy", name: "Sympathy", description: "Gentle gestures for difficult moments.", image: unsplash("1567428051128-5f09a0200655", "White lilies against dark green leaves") },
  { slug: "christmas", name: "Christmas", description: "Gifts worth gathering around the tree for.", image: unsplash("1546512347-b93b3f59e231", "Wrapped gifts beneath a Christmas tree"), season: { from: [11, 1], to: [12, 25] } },
  { slug: "just-because", name: "Just Because", description: "No occasion needed to show you care.", image: unsplash("1625552187571-7ee60ac43d2b", "Two hands exchanging a wrapped gift box") },
];

export function isOccasionInSeason(occasion: Occasion, date = new Date()): boolean {
  if (!occasion.season) return true;
  const key = (m: number, d: number) => m * 100 + d;
  const today = key(date.getMonth() + 1, date.getDate());
  const from = key(...occasion.season.from);
  const to = key(...occasion.season.to);
  return from <= to ? today >= from && today <= to : today >= from || today <= to;
}

export type RecipientSlug =
  | "her"
  | "him"
  | "mom"
  | "dad"
  | "partner"
  | "friend"
  | "grandparent"
  | "coworker"
  | "kids"
  | "family"
  | "couples";

export interface Recipient {
  slug: RecipientSlug;
  name: string;
  label: string;
  image: ProductImage;
}

export const RECIPIENTS: Recipient[] = [
  { slug: "her", name: "Her", label: "Gifts for Her", image: unsplash("1615108395437-df128ad79e80", "A glass perfume bottle among petals") },
  { slug: "him", name: "Him", label: "Gifts for Him", image: unsplash("1556597130-ef7aa3c71ff5", "A silver analog watch with a leather strap") },
  { slug: "mom", name: "Mom", label: "Gifts for Mom", image: unsplash("1680563094046-5d846e2c59d1", "A bouquet of pink roses wrapped in paper") },
  { slug: "dad", name: "Dad", label: "Gifts for Dad", image: unsplash("1553265331-3032aacd1a76", "A grooming bottle beside a brush") },
  { slug: "partner", name: "Partner", label: "Gifts for Your Partner", image: unsplash("1730749387748-79e6d50a269c", "A large bouquet of red roses in a crate") },
  { slug: "friend", name: "Friend", label: "Gifts for a Friend", image: unsplash("1491821893533-80f535044695", "French macarons in a white box") },
  { slug: "grandparent", name: "Grandparent", label: "Gifts for Grandparents", image: unsplash("1611651525144-42027e7f45ba", "A blank photo frame with a copper border") },
  { slug: "coworker", name: "Coworker", label: "Gifts for Coworkers", image: unsplash("1620843437920-ead942b3abd3", "A white gift box with a thank-you note") },
  { slug: "kids", name: "Kids", label: "Gifts for Kids", image: unsplash("1455884981818-54cb785db6fc", "A pile of colorful children's storybooks") },
  { slug: "family", name: "Family", label: "Gifts for the Family", image: unsplash("1773450935809-512f3b662fe1", "A gourmet food gift box") },
  { slug: "couples", name: "Couples", label: "Gifts for Couples", image: unsplash("1612293905607-b003de9e54fb", "A candle in an amber jar being lit") },
];

export type BudgetSlug = "under-25" | "25-50" | "50-100" | "100-200" | "200-plus";

export interface BudgetOption {
  slug: string;
  label: string;
  min?: number;
  max?: number;
}

export const BUDGETS: BudgetOption[] = [
  { slug: "under-50k", label: "Under ₦50,000", max: 50000 },
  { slug: "50k-70k", label: "₦50,000 – ₦70,000", min: 50000, max: 70000 },
  { slug: "70k-100k", label: "₦70,000 – ₦100,000", min: 70000, max: 100000 },
  { slug: "over-100k", label: "Over ₦100,000", min: 100000 },
];

export const getCategory = (slug: string) => CATEGORIES.find((c) => c.slug === slug);
export const getOccasion = (slug: string) => OCCASIONS.find((o) => o.slug === slug);
export const getRecipient = (slug: string) => RECIPIENTS.find((r) => r.slug === slug);
export const getBudget = (slug: string) => BUDGETS.find((b) => b.slug === slug);
