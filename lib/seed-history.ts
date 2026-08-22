import { db } from '@/lib/db'
import { bankAccount, transaction } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

function dateDaysAgo(days: number, hour = 12, minute = 0) {
  const d = new Date()
  d.setHours(hour, minute, 0, 0)
  d.setDate(d.getDate() - days)
  return d
}

/** Real U.S. grocery / warehouse chains */
const GROCERY_CHAINS = [
  'Walmart Supercenter',
  'Walmart Neighborhood Market',
  'Sam\'s Club',
  'Costco Wholesale',
  'Target',
  'Kroger',
  'Ralphs',
  'Fred Meyer',
  'Smith\'s Food and Drug',
  'King Soopers',
  'Harris Teeter',
  'QFC',
  'City Market',
  'Food 4 Less',
  'Albertsons',
  'Safeway',
  'Vons',
  'Jewel-Osco',
  'Acme Markets',
  'Shaw\'s',
  'Star Market',
  'Tom Thumb',
  'United Supermarkets',
  'Randalls',
  'Publix',
  'H-E-B',
  'Central Market',
  'Meijer',
  'Wegmans',
  'Trader Joe\'s',
  'Whole Foods Market',
  'Aldi',
  'Lidl',
  'Food Lion',
  'Hannaford',
  'Stop & Shop',
  'Giant Food',
  'Giant Eagle',
  'Hy-Vee',
  'WinCo Foods',
  'Sprouts Farmers Market',
  'Natural Grocers',
  'Market Basket',
  'ShopRite',
  'Price Chopper',
  'Weis Markets',
  'Ingles Markets',
  'Brookshire\'s',
  'Rouses Markets',
  'Winn-Dixie',
  'Save-A-Lot',
  'Grocery Outlet',
  'Smart & Final',
  'Bristol Farms',
  'Gelson\'s',
  'The Fresh Market',
  'Earth Fare',
  'Lucky California',
  'Foodtown',
  'Key Food',
  'Fairway Market',
  'Stew Leonard\'s',
  'Woodman\'s Market',
  'Festival Foods',
  'Piggly Wiggly',
  'Ike\'s Food and Fuel',
  'Fareway Stores',
  'Coborn\'s',
  'Cash Wise',
  'County Market',
  'Bi-Lo',
  'Food City',
  'Lowes Foods',
  'Bashas\'',
  'AJ\'s Fine Foods',
  'Fry\'s Food Stores',
  'Dillons',
  'Baker\'s',
  'Mariano\'s',
  'Pick \'n Save',
  'Metro Market',
  'Roundy\'s',
  'Schnucks',
  'Dierbergs',
  'Straub\'s',
  'Harmons',
  'Associated Supermarket',
  'C-Town',
  'Bravo Supermarket',
  'Compare Foods',
  'El Super',
  'Northgate Market',
  'Superior Grocers',
  'Vallarta Supermarkets',
  'Cardenas Markets',
  '99 Ranch Market',
  'H Mart',
  'Mitsuwa Marketplace',
  'Nijiya Market',
  'Seafood City',
  'Patel Brothers',
]

const GAS_CHAINS = [
  'Shell',
  'Chevron',
  'Exxon',
  'Mobil',
  'BP',
  'Marathon',
  'Speedway',
  'Circle K',
  '7-Eleven',
  'QuikTrip',
  'Wawa',
  'Sheetz',
  'RaceTrac',
  'Casey\'s',
  'Kum & Go',
  'Murphy USA',
  'ARCO',
  'Valero',
  'Sunoco',
  'CITGO',
  'Phillips 66',
  'Conoco',
  'Sinclair',
  'Thorntons',
  'GetGo',
  'Kwik Trip',
  'Maverik',
  'Love\'s Travel Stops',
  'Pilot Stop',
  'Pilot Centers of America',
]

const DINING_CHAINS = [
  'McDonald\'s',
  'Starbucks',
  'Chipotle',
  'Panera Bread',
  'Chick-fil-A',
  'Subway',
  'Taco Bell',
  'Wendy\'s',
  'Burger King',
  'Dunkin\'',
  'Domino\'s Pizza',
  'Pizza Hut',
  'Papa John\'s',
  'Olive Garden',
  'Applebee\'s',
  'Chili\'s',
  'Outback Steakhouse',
  'Red Lobster',
  'IHOP',
  'Denny\'s',
  'Cracker Barrel',
  'Texas Roadhouse',
  'Buffalo Wild Wings',
  'Five Guys',
  'In-N-Out Burger',
  'Shake Shack',
  'Whataburger',
  'Culver\'s',
  'Raising Cane\'s',
  'Popeyes',
  'KFC',
  'Arby\'s',
  'Sonic Drive-In',
  'Jack in the Box',
  'Carl\'s Jr.',
  'Hardee\'s',
  'Jimmy John\'s',
  'Firehouse Subs',
  'Jersey Mike\'s',
  'Panda Express',
  'Pei Wei',
  'PF Chang\'s',
  'Cheesecake Factory',
  'BJ\'s Restaurant',
  'Yard House',
  'Buffalo Wild Wings',
  'Wingstop',
  'Dutch Bros Coffee',
  'Peet\'s Coffee',
  'Tim Hortons',
  'Cava',
  'Sweetgreen',
  'Noodles & Company',
  'Zaxby\'s',
  'Bojangles',
  'Cook Out',
  'White Castle',
  'Steak \'n Shake',
]

const RETAIL_CHAINS = [
  'Amazon',
  'Amazon Marketplace',
  'Best Buy',
  'Apple Store',
  'Microsoft Store',
  'Home Depot',
  'Lowe\'s',
  'Menards',
  'Ace Hardware',
  'Harbor Freight',
  'Walgreens',
  'CVS Pharmacy',
  'Rite Aid',
  'Macy\'s',
  'Nordstrom',
  'Nordstrom Rack',
  'Kohl\'s',
  'JCPenney',
  'Ross Dress for Less',
  'TJ Maxx',
  'Marshalls',
  'Homegoods',
  'Burlington',
  'Old Navy',
  'Gap',
  'Banana Republic',
  'Nike',
  'Adidas',
  'Dick\'s Sporting Goods',
  'Academy Sports',
  'REI',
  'Bass Pro Shops',
  'Cabela\'s',
  'Ulta Beauty',
  'Sephora',
  'Bath & Body Works',
  'Bed Bath & Beyond',
  'IKEA',
  'Wayfair',
  'Overstock',
  'eBay',
  'Etsy',
  'Office Depot',
  'Staples',
  'GameStop',
  'Barnes & Noble',
  'Petco',
  'PetSmart',
  'AutoZone',
  'O\'Reilly Auto Parts',
  'Advance Auto Parts',
  'NAPA Auto Parts',
  'Dollar General',
  'Dollar Tree',
  'Family Dollar',
  'Five Below',
  'Big Lots',
  'Tractor Supply Co.',
  'Harbor Freight Tools',
]

const SERVICES = [
  'Netflix',
  'Spotify',
  'Hulu',
  'Disney+',
  'HBO Max',
  'Paramount+',
  'Apple Music',
  'YouTube Premium',
  'Adobe Creative Cloud',
  'Microsoft 365',
  'Google One',
  'iCloud+',
  'Dropbox',
  'Zoom',
  'Verizon Wireless',
  'AT&T Wireless',
  'T-Mobile',
  'Comcast Xfinity',
  'Spectrum',
  'Cox Communications',
  'Frontier',
  'PG&E',
  'Con Edison',
  'Duke Energy',
  'Southern Company',
  'National Grid',
  'SoCal Edison',
  'Florida Power & Light',
  'State Farm Insurance',
  'GEICO',
  'Progressive Insurance',
  'Allstate',
  'USAA',
  'Liberty Mutual',
  'Chase Credit Card',
  'Amex',
  'Capital One',
  'Discover',
  'Citi Card',
  'Uber',
  'Lyft',
  'Uber Eats',
  'DoorDash',
  'Grubhub',
  'Instacart',
  'USPS',
  'UPS Store',
  'FedEx Office',
  'Planet Fitness',
  'LA Fitness',
  'Equinox',
  'Anytime Fitness',
  'H&R Block',
  'TurboTax',
  'Intuit QuickBooks',
]

const EMPLOYERS = [
  'Northline Staffing',
  'Apex Payroll Services',
  'Summit Consulting Group',
  'Blue Ridge Analytics',
  'Harbor Logistics LLC',
  'Pacific Crest Tech',
  'Midwest Industrial Supply',
  'Atlantic Digital Media',
  'Great Lakes Manufacturing',
  'Cascade Software Solutions',
]

function expandStoreNames(base: string[], targetCount: number): string[] {
  const out: string[] = []
  let i = 0
  while (out.length < targetCount) {
    const chain = base[i % base.length]
    const storeNum = 1000 + ((i * 37) % 8900)
    const cityHints = [
      'Austin',
      'Dallas',
      'Houston',
      'Phoenix',
      'Seattle',
      'Denver',
      'Atlanta',
      'Chicago',
      'Miami',
      'Boston',
      'NYC',
      'LA',
      'San Diego',
      'Portland',
      'Nashville',
      'Charlotte',
      'Orlando',
      'Tampa',
      'Minneapolis',
      'Detroit',
      'Columbus',
      'Indianapolis',
      'Kansas City',
      'St Louis',
      'Salt Lake',
      'Las Vegas',
      'Sacramento',
      'Raleigh',
      'Richmond',
      'Philadelphia',
    ]
    const city = cityHints[i % cityHints.length]
    out.push(`${chain} #${storeNum} ${city}`)
    i += 1
  }
  return out
}

const GROCERY_STORES = expandStoreNames(GROCERY_CHAINS, 420)
const GAS_STORES = expandStoreNames(GAS_CHAINS, 180)
const DINING_STORES = expandStoreNames(DINING_CHAINS, 220)
const RETAIL_STORES = expandStoreNames(RETAIL_CHAINS, 220)

const ALL_COUNTERPARTIES = Array.from(
  new Set([
    ...GROCERY_STORES,
    ...GAS_STORES,
    ...DINING_STORES,
    ...RETAIL_STORES,
    ...SERVICES,
    ...EMPLOYERS,
  ])
)

type SeedTx = {
  description: string
  category: string
  counterparty: string
  amountCents: number
  createdAt: Date
}

function pick<T>(arr: T[], index: number): T {
  return arr[index % arr.length]
}

function spendAmount(seed: number, min: number, max: number) {
  const span = max - min
  return -(min + ((seed * 97) % (span + 1)))
}

/**
 * Build >= 4000 transactions across ~2 years.
 * Net cash flow is strongly positive so ending balance is high.
 */
export function buildTwoYearPersonalHistory(): SeedTx[] {
  const rows: SeedTx[] = []
  let seq = 0

  // ~5–6 txs/day across 730 days => 4000+
  for (let day = 0; day < 730; day++) {
    const baseDate = dateDaysAgo(729 - day)

    // Morning coffee / transit (~daily)
    {
      const store = pick(DINING_STORES, seq++)
      rows.push({
        description: `Purchase · ${store}`,
        category: 'Dining',
        counterparty: store,
        amountCents: spendAmount(seq, 350, 1800),
        createdAt: new Date(baseDate.getTime() + 7 * 60 * 60 * 1000),
      })
    }

    // Grocery 4–5x per week
    if (day % 7 !== 0 && day % 7 !== 6) {
      const store = pick(GROCERY_STORES, seq++)
      rows.push({
        description: `Groceries · ${store}`,
        category: 'Groceries',
        counterparty: store,
        amountCents: spendAmount(seq, 1800, 14500),
        createdAt: new Date(baseDate.getTime() + 11 * 60 * 60 * 1000),
      })
    } else {
      // Weekend big shop
      const store = pick(GROCERY_STORES, seq++)
      rows.push({
        description: `Groceries · ${store}`,
        category: 'Groceries',
        counterparty: store,
        amountCents: spendAmount(seq, 6500, 22000),
        createdAt: new Date(baseDate.getTime() + 12 * 60 * 60 * 1000),
      })
    }

    // Gas ~every 4 days
    if (day % 4 === 0) {
      const store = pick(GAS_STORES, seq++)
      rows.push({
        description: `Fuel · ${store}`,
        category: 'Transport',
        counterparty: store,
        amountCents: spendAmount(seq, 2800, 7200),
        createdAt: new Date(baseDate.getTime() + 16 * 60 * 60 * 1000),
      })
    }

    // Retail / shopping ~every other day
    if (day % 2 === 1) {
      const store = pick(RETAIL_STORES, seq++)
      rows.push({
        description: `Purchase · ${store}`,
        category: 'Shopping',
        counterparty: store,
        amountCents: spendAmount(seq, 900, 18500),
        createdAt: new Date(baseDate.getTime() + 15 * 60 * 60 * 1000),
      })
    }

    // Subscription / utility style charge a few times per week
    if (day % 3 === 2) {
      const svc = pick(SERVICES, seq++)
      rows.push({
        description: `Payment · ${svc}`,
        category: 'Bills',
        counterparty: svc,
        amountCents: spendAmount(seq, 499, 18999),
        createdAt: new Date(baseDate.getTime() + 9 * 60 * 60 * 1000),
      })
    }

    // Dinner out ~3x week
    if (day % 7 === 1 || day % 7 === 3 || day % 7 === 5) {
      const store = pick(DINING_STORES, seq++)
      rows.push({
        description: `Dining · ${store}`,
        category: 'Dining',
        counterparty: store,
        amountCents: spendAmount(seq, 1200, 9800),
        createdAt: new Date(baseDate.getTime() + 19 * 60 * 60 * 1000),
      })
    }

    // Biweekly payroll (large credit) — keeps balance climbing
    if (day % 14 === 0) {
      const employer = pick(EMPLOYERS, day / 14)
      const basePay = 485000 // $4,850
      const bonus = ((day * 13) % 35) * 1000
      rows.push({
        description: `Payroll deposit · ${employer}`,
        category: 'Income',
        counterparty: employer,
        amountCents: basePay + bonus,
        createdAt: new Date(baseDate.getTime() + 6 * 60 * 60 * 1000),
      })
    }

    // Monthly rent on the 1st-ish of each ~30 day block
    if (day % 30 === 2) {
      rows.push({
        description: 'Monthly rent · Harbor Court Residences',
        category: 'Housing',
        counterparty: 'Harbor Court Residences',
        amountCents: -195000,
        createdAt: new Date(baseDate.getTime() + 8 * 60 * 60 * 1000),
      })
    }

    // Occasional refunds / cashback
    if (day % 17 === 0) {
      const store = pick(RETAIL_STORES, seq++)
      rows.push({
        description: `Refund · ${store}`,
        category: 'Refund',
        counterparty: store,
        amountCents: 1500 + ((seq * 11) % 12000),
        createdAt: new Date(baseDate.getTime() + 14 * 60 * 60 * 1000),
      })
    }
  }

  // Ensure hard floor of 4000
  while (rows.length < 4000) {
    const store = pick(GROCERY_STORES, rows.length)
    rows.push({
      description: `Groceries · ${store}`,
      category: 'Groceries',
      counterparty: store,
      amountCents: spendAmount(rows.length, 1200, 9000),
      createdAt: dateDaysAgo(rows.length % 700),
    })
  }

  return rows
}

export function merchantUniverseSize() {
  return ALL_COUNTERPARTIES.length
}

export async function applyTwoYearPersonalHistory(
  userId: string,
  checkingId: number
) {
  const existingTx = await db
    .select({ id: transaction.id })
    .from(transaction)
    .where(and(eq(transaction.userId, userId), eq(transaction.accountId, checkingId)))

  // Already fully seeded
  if (existingTx.length >= 4000) return

  // Replace partial / old sample history so the ledger is consistent
  if (existingTx.length > 0) {
    await db
      .delete(transaction)
      .where(and(eq(transaction.userId, userId), eq(transaction.accountId, checkingId)))
  }

  const history = buildTwoYearPersonalHistory()
  let checkingBalance = 0

  // Batch inserts to stay within serverless limits
  const BATCH = 250
  for (let i = 0; i < history.length; i += BATCH) {
    const slice = history.slice(i, i + BATCH)
    const values = slice.map((t) => {
      checkingBalance += t.amountCents
      return {
        userId,
        accountId: checkingId,
        amountCents: t.amountCents,
        type: t.amountCents >= 0 ? 'credit' : 'debit',
        description: t.description,
        category: t.category,
        counterparty: t.counterparty,
        createdAt: t.createdAt,
      }
    })
    await db.insert(transaction).values(values)
  }

  // Force a healthy high balance if math somehow undershot
  if (checkingBalance < 75_000_00) {
    // $75,000 floor
    const topUp = 95_000_00 - checkingBalance
    checkingBalance += topUp
    await db.insert(transaction).values({
      userId,
      accountId: checkingId,
      amountCents: topUp,
      type: 'credit',
      description: 'Opening balance adjustment · Apex Bank',
      category: 'Income',
      counterparty: 'Apex Bank',
      createdAt: dateDaysAgo(729),
    })
  }

  await db
    .update(bankAccount)
    .set({ balanceCents: checkingBalance })
    .where(and(eq(bankAccount.id, checkingId), eq(bankAccount.userId, userId)))
}
