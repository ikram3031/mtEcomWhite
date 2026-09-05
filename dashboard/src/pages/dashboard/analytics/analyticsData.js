import { clientConfig, getActiveClientKey } from '@/clientConfig';

// Retrieves persistent GA4 settings prioritizing verified client configuration over stale localStorage
export const getGA4Settings = () => {
  const clientGA = clientConfig?.googleAnalytics || {};
  const clientKey = getActiveClientKey() || 'default';
  const brandName = clientConfig?.brandName || 'Store';

  const defaults = {
    measurementId: clientGA.measurementId || 'G-XXXXXXXXXX',
    gtmId: clientGA.gtmId || '',
    streamName: clientGA.streamName || `${brandName} Web Stream`,
    propertyId: clientGA.propertyId || '',
    isVerified: clientGA.isVerified ?? true,
    enhancedMeasurement: clientGA.enhancedMeasurement ?? true,
  };

  if (typeof window === 'undefined') {
    return defaults;
  }

  try {
    localStorage.removeItem('ga4_config');
    const raw = localStorage.getItem(`ga4_config_${clientKey}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (clientGA.measurementId && parsed.measurementId && parsed.measurementId !== clientGA.measurementId) {
        localStorage.removeItem(`ga4_config_${clientKey}`);
        return defaults;
      }
      return {
        ...defaults,
        ...parsed,
        measurementId: clientGA.measurementId || parsed.measurementId || defaults.measurementId,
        streamName: defaults.streamName,
      };
    }
  } catch {
    return defaults;
  }

  return defaults;
};

// Saves persistent GA4 settings to local storage
export const saveGA4Settings = (settings) => {
  if (typeof window === 'undefined') return;
  const clientKey = getActiveClientKey() || 'default';
  try {
    localStorage.setItem(`ga4_config_${clientKey}`, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save GA4 settings', error);
  }
};

// Generates the official gtag.js script snippet for storefront implementation
export const generateGtagScript = (measurementId) => {
  return `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', '${measurementId}', {
    send_page_view: true,
    cookie_flags: 'SameSite=None;Secure'
  });
</script>`;
};

// Supplies industry-tailored sample product events, live feed, metrics, and top pages per tenant
export const getClientIndustryData = (clientKey = getActiveClientKey()) => {
  switch (clientKey) {
    case 'engulfic':
      return {
        accentColor: '#10b981',
        realtimeActive: 4,
        baseSessions: 1450,
        baseUsers: 980,
        basePageviews: 4200,
        baseRevenue: 0,
        baseTransactions: 0,
        topPages: [
          { path: '/', title: 'Engulfic Official Storefront', pageviews: 1340, uniqueViews: 920, avgTime: '1m 24s', bounceRate: '28.2%', exitRate: '19.4%' },
          { path: '/collections/streetwear', title: 'Streetwear & Oversized Apparel', pageviews: 890, uniqueViews: 610, avgTime: '2m 10s', bounceRate: '22.1%', exitRate: '14.2%' },
          { path: '/collections/all-products', title: 'All Products Catalog', pageviews: 650, uniqueViews: 480, avgTime: '2m 30s', bounceRate: '20.5%', exitRate: '15.0%' },
          { path: '/products/signature-oversized-hoodie', title: 'Signature Oversized Hoodie', pageviews: 420, uniqueViews: 310, avgTime: '2m 45s', bounceRate: '18.4%', exitRate: '12.0%' },
          { path: '/cart', title: 'Shopping Cart', pageviews: 290, uniqueViews: 190, avgTime: '1m 40s', bounceRate: '14.8%', exitRate: '21.0%' },
          { path: '/checkout', title: 'Secure Checkout', pageviews: 180, uniqueViews: 120, avgTime: '2m 10s', bounceRate: '9.1%', exitRate: '11.5%' },
          { path: '/contact', title: 'Contact & Customer Support', pageviews: 95, uniqueViews: 65, avgTime: '1m 15s', bounceRate: '31.2%', exitRate: '38.0%' },
        ],
        sampleProducts: [
          { path: '/products/signature-oversized-hoodie', title: 'Signature Oversized Hoodie' },
          { path: '/products/heavyweight-boxy-tee', title: 'Heavyweight Boxy Tee (Black)' },
          { path: '/products/vintage-cargo-trousers', title: 'Vintage Cargo Trousers' },
          { path: '/products/drop-shoulder-fleece', title: 'Drop-Shoulder Fleece' },
        ],
        liveEvents: [
          { id: 1, type: 'view_item', label: 'Viewed Product "Signature Oversized Hoodie"', location: 'Dhaka, BD', time: 'Just now', badge: 'bg-emerald-500/15 text-emerald-500' },
          { id: 2, type: 'add_to_cart', label: 'Added to Cart "Heavyweight Boxy Tee (L)"', location: 'Chittagong, BD', time: '12s ago', badge: 'bg-amber-500/15 text-amber-500' },
          { id: 3, type: 'page_view', label: 'Browsing "/collections/streetwear"', location: 'Sylhet, BD', time: '28s ago', badge: 'bg-purple-500/15 text-purple-500' },
          { id: 4, type: 'search', label: 'Searched "oversized hoodie"', location: 'Khulna, BD', time: '45s ago', badge: 'bg-sky-500/15 text-sky-500' },
          { id: 5, type: 'begin_checkout', label: 'Started Checkout step', location: 'Rajshahi, BD', time: '1m ago', badge: 'bg-amber-500/15 text-amber-500' },
          { id: 6, type: 'view_item', label: 'Viewed Product "Vintage Cargo Trousers"', location: 'Gazipur, BD', time: '2m ago', badge: 'bg-emerald-500/15 text-emerald-500' },
        ],
      };
    case 'toyoland':
      return {
        accentColor: '#3b82f6',
        realtimeActive: 8,
        baseSessions: 8200,
        baseUsers: 5900,
        basePageviews: 24000,
        baseRevenue: 120000,
        baseTransactions: 88,
        topPages: [
          { path: '/', title: 'Toyoland Storefront', pageviews: 7400, uniqueViews: 5100, avgTime: '1m 40s', bounceRate: '25.0%', exitRate: '18.0%' },
          { path: '/collections/educational-toys', title: 'Educational Toys', pageviews: 5200, uniqueViews: 3800, avgTime: '2m 20s', bounceRate: '21.0%', exitRate: '15.0%' },
          { path: '/products/rc-monster-truck', title: 'Remote Control 4WD Monster Truck', pageviews: 3100, uniqueViews: 2200, avgTime: '2m 50s', bounceRate: '19.0%', exitRate: '12.0%' },
          { path: '/cart', title: 'Shopping Cart', pageviews: 1800, uniqueViews: 1200, avgTime: '1m 45s', bounceRate: '16.0%', exitRate: '20.0%' },
          { path: '/checkout', title: 'Secure Checkout', pageviews: 1100, uniqueViews: 750, avgTime: '2m 15s', bounceRate: '8.5%', exitRate: '11.0%' },
        ],
        sampleProducts: [
          { path: '/products/rc-monster-truck', title: 'Remote Control 4WD Monster Truck' },
          { path: '/products/magnetic-blocks-set', title: 'Magnetic Building Blocks 100pcs' },
          { path: '/products/deluxe-plush-bear', title: 'Deluxe Plush Bear 40cm' },
        ],
        liveEvents: [
          { id: 1, type: 'view_item', label: 'Viewed "Remote Control 4WD Monster Truck"', location: 'Dhaka, BD', time: 'Just now', badge: 'bg-blue-500/15 text-blue-500' },
          { id: 2, type: 'add_to_cart', label: 'Added to Cart "Magnetic Building Blocks"', location: 'Chittagong, BD', time: '12s ago', badge: 'bg-amber-500/15 text-amber-500' },
          { id: 3, type: 'page_view', label: 'Browsing "/collections/educational-toys"', location: 'Sylhet, BD', time: '28s ago', badge: 'bg-purple-500/15 text-purple-500' },
          { id: 4, type: 'purchase', label: 'Completed Order (৳1,890 via Nagad)', location: 'Dhaka, BD', time: '45s ago', badge: 'bg-emerald-500/15 text-emerald-500' },
          { id: 5, type: 'begin_checkout', label: 'Started Checkout step', location: 'Rajshahi, BD', time: '1m ago', badge: 'bg-amber-500/15 text-amber-500' },
          { id: 6, type: 'search', label: 'Searched "rc cars for kids"', location: 'Khulna, BD', time: '2m ago', badge: 'bg-sky-500/15 text-sky-500' },
        ],
      };
    case 'kawaiikutir':
      return {
        accentColor: '#ec4899',
        realtimeActive: 5,
        baseSessions: 4100,
        baseUsers: 3100,
        basePageviews: 12500,
        baseRevenue: 65000,
        baseTransactions: 45,
        topPages: [
          { path: '/', title: 'Kawaii Kutir Storefront', pageviews: 3900, uniqueViews: 2800, avgTime: '1m 35s', bounceRate: '26.0%', exitRate: '19.0%' },
          { path: '/collections/stationery', title: 'Cute Japanese Stationery', pageviews: 2800, uniqueViews: 2100, avgTime: '2m 15s', bounceRate: '22.0%', exitRate: '16.0%' },
          { path: '/cart', title: 'Shopping Cart', pageviews: 950, uniqueViews: 680, avgTime: '1m 40s', bounceRate: '17.0%', exitRate: '21.0%' },
          { path: '/checkout', title: 'Secure Checkout', pageviews: 520, uniqueViews: 380, avgTime: '2m 10s', bounceRate: '9.0%', exitRate: '12.0%' },
        ],
        sampleProducts: [
          { path: '/products/pastel-gel-pens', title: 'Pastel Gel Pen Set 12 Colors' },
          { path: '/products/plushie-keychain', title: 'Anime Plushie Keychain' },
        ],
        liveEvents: [
          { id: 1, type: 'view_item', label: 'Viewed "Pastel Gel Pen Set"', location: 'Dhaka, BD', time: 'Just now', badge: 'bg-pink-500/15 text-pink-500' },
          { id: 2, type: 'add_to_cart', label: 'Added to Cart "Anime Plushie Keychain"', location: 'Chittagong, BD', time: '15s ago', badge: 'bg-purple-500/15 text-purple-500' },
        ],
      };
    default:
      return {
        accentColor: '#C5A059',
        realtimeActive: 34,
        baseSessions: 38450,
        baseUsers: 27820,
        basePageviews: 119400,
        baseRevenue: 485000,
        baseTransactions: 342,
        topPages: [
          { path: '/', title: 'Decantre Luxury Perfume House', pageviews: 38200, uniqueViews: 26500, avgTime: '1m 35s', bounceRate: '24.6%', exitRate: '18.2%' },
          { path: '/collections/all-products', title: 'All Products Catalog', pageviews: 26200, uniqueViews: 18600, avgTime: '2m 45s', bounceRate: '21.4%', exitRate: '14.8%' },
          { path: '/collections/best-sellers', title: 'Best Selling Collection', pageviews: 17900, uniqueViews: 13200, avgTime: '3m 10s', bounceRate: '19.8%', exitRate: '12.5%' },
          { path: '/cart', title: 'Shopping Cart', pageviews: 10700, uniqueViews: 7800, avgTime: '1m 50s', bounceRate: '15.2%', exitRate: '22.1%' },
          { path: '/checkout', title: 'Secure Checkout', pageviews: 7100, uniqueViews: 4800, avgTime: '2m 20s', bounceRate: '8.4%', exitRate: '11.3%' },
          { path: '/collections/new-arrivals', title: 'New Arrivals 2026', pageviews: 9500, uniqueViews: 6600, avgTime: '2m 15s', bounceRate: '23.1%', exitRate: '16.4%' },
          { path: '/contact', title: 'Contact Us & Store Locations', pageviews: 4700, uniqueViews: 3000, avgTime: '1m 12s', bounceRate: '34.5%', exitRate: '42.0%' },
        ],
        sampleProducts: [
          { path: '/products/velvet-noir-perfume', title: 'Velvet Noir Luxury Perfume' },
          { path: '/products/amber-suede-100ml', title: 'Amber Suede 100ml' },
          { path: '/products/imperial-oud-edp', title: 'Imperial Oud Eau de Parfum' },
        ],
        liveEvents: [
          { id: 1, type: 'view_item', label: 'Viewed Product "Velvet Noir Perfume"', location: 'Dhaka, BD', time: 'Just now', badge: 'bg-blue-500/15 text-blue-500' },
          { id: 2, type: 'add_to_cart', label: 'Added to Cart "Amber Suede 100ml"', location: 'Chittagong, BD', time: '12s ago', badge: 'bg-amber-500/15 text-amber-500' },
          { id: 3, type: 'page_view', label: 'Browsing "/collections/all-products"', location: 'Sylhet, BD', time: '28s ago', badge: 'bg-purple-500/15 text-purple-500' },
          { id: 4, type: 'purchase', label: 'Completed Order (৳3,450 via bKash)', location: 'Dhaka, BD', time: '45s ago', badge: 'bg-emerald-500/15 text-emerald-500' },
          { id: 5, type: 'begin_checkout', label: 'Started Checkout step', location: 'Rajshahi, BD', time: '1m ago', badge: 'bg-amber-500/15 text-amber-500' },
          { id: 6, type: 'search', label: 'Searched "oud wood luxury"', location: 'Khulna, BD', time: '2m ago', badge: 'bg-sky-500/15 text-sky-500' },
        ],
      };
  }
};

// Generates comprehensive Google Analytics dataset based on selected date range and active client
export const getAnalyticsDataForRange = (range = '30days', brandName = null, storeStats = null) => {
  const activeBrand = brandName || clientConfig?.brandName || 'Store';
  const clientKey = getActiveClientKey();
  const industry = getClientIndustryData(clientKey);
  const accentColor = industry.accentColor || '#10b981';

  let daysCount = 30;
  let multiplier = 1.0;

  if (range === 'today') {
    daysCount = 1;
    multiplier = 0.05;
  } else if (range === '7days') {
    daysCount = 7;
    multiplier = 0.28;
  } else if (range === '30days') {
    daysCount = 30;
    multiplier = 1.0;
  } else if (range === '90days') {
    daysCount = 90;
    multiplier = 2.85;
  } else if (range === 'year') {
    daysCount = 365;
    multiplier = 11.4;
  }

  const hasStoreStats = storeStats && typeof storeStats.netSales === 'number';
  const baseRevenue = hasStoreStats ? storeStats.netSales : Math.round((industry.baseRevenue || 0) * multiplier);
  const baseTransactions = hasStoreStats ? (storeStats.completedOrdersCount || 0) : Math.round((industry.baseTransactions || 0) * multiplier);
  const baseSessions = Math.round((industry.baseSessions || 1500) * multiplier);
  const baseUsers = Math.round((industry.baseUsers || 1000) * multiplier);
  const basePageviews = Math.round((industry.basePageviews || 4500) * multiplier);

  const timeline = [];
  const now = new Date();

  if (range === 'today') {
    for (let h = 0; h <= 23; h++) {
      const hourLabel = `${h % 12 === 0 ? 12 : h % 12}:00 ${h >= 12 ? 'PM' : 'AM'}`;
      const hourActivity = Math.sin((h / 24) * Math.PI) + 0.3;
      const hourlySessions = Math.max(1, Math.round(hourActivity * (baseSessions / 12) + (Math.random() * 4 - 2)));
      const hourlyUsers = Math.max(1, Math.round(hourlySessions * 0.78));
      const hourlyViews = Math.max(1, Math.round(hourlySessions * 2.8));
      const hourlyPurchases = baseTransactions > 0 && h >= 10 && h <= 22 ? Math.round(Math.random() * 2) : 0;

      timeline.push({
        date: hourLabel,
        sessions: hourlySessions,
        users: hourlyUsers,
        pageviews: hourlyViews,
        purchases: hourlyPurchases,
      });
    }
  } else {
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dayFactor = d.getDay() === 5 || d.getDay() === 6 ? 1.25 : 1.0;
      const randomNoise = 0.9 + Math.random() * 0.2;
      const dailySessions = Math.max(1, Math.round((baseSessions / daysCount) * dayFactor * randomNoise));
      const dailyUsers = Math.max(1, Math.round(dailySessions * 0.76));
      const dailyViews = Math.max(1, Math.round(dailySessions * 3.1));
      const dailyPurchases = baseTransactions > 0 ? Math.max(0, Math.round((baseTransactions / daysCount) * dayFactor * randomNoise)) : 0;

      timeline.push({
        date: dateLabel,
        sessions: dailySessions,
        users: dailyUsers,
        pageviews: dailyViews,
        purchases: dailyPurchases,
      });
    }
  }

  const channels = [
    {
      channel: 'Organic Search (Google)',
      users: Math.round(baseUsers * 0.38),
      sessions: Math.round(baseSessions * 0.36),
      engagementRate: '74.2%',
      bounceRate: '25.8%',
      avgDuration: '3m 12s',
      revenue: Math.round(baseRevenue * 0.42),
      transactions: Math.round(baseTransactions * 0.40),
      color: accentColor,
    },
    {
      channel: 'Paid Social (Meta Ads)',
      users: Math.round(baseUsers * 0.29),
      sessions: Math.round(baseSessions * 0.31),
      engagementRate: '68.5%',
      bounceRate: '31.5%',
      avgDuration: '2m 18s',
      revenue: Math.round(baseRevenue * 0.33),
      transactions: Math.round(baseTransactions * 0.35),
      color: '#3b82f6',
    },
    {
      channel: 'Direct Traffic',
      users: Math.round(baseUsers * 0.18),
      sessions: Math.round(baseSessions * 0.17),
      engagementRate: '78.9%',
      bounceRate: '21.1%',
      avgDuration: '3m 45s',
      revenue: Math.round(baseRevenue * 0.15),
      transactions: Math.round(baseTransactions * 0.16),
      color: '#6366f1',
    },
    {
      channel: 'Organic Social (FB & IG)',
      users: Math.round(baseUsers * 0.08),
      sessions: Math.round(baseSessions * 0.09),
      engagementRate: '64.1%',
      bounceRate: '35.9%',
      avgDuration: '1m 54s',
      revenue: Math.round(baseRevenue * 0.06),
      transactions: Math.round(baseTransactions * 0.05),
      color: '#8b5cf6',
    },
    {
      channel: 'Referral & Backlinks',
      users: Math.round(baseUsers * 0.04),
      sessions: Math.round(baseSessions * 0.04),
      engagementRate: '61.8%',
      bounceRate: '38.2%',
      avgDuration: '2m 05s',
      revenue: Math.round(baseRevenue * 0.03),
      transactions: Math.round(baseTransactions * 0.03),
      color: '#f59e0b',
    },
    {
      channel: 'Email Marketing & SMS',
      users: Math.round(baseUsers * 0.03),
      sessions: Math.round(baseSessions * 0.03),
      engagementRate: '82.4%',
      bounceRate: '17.6%',
      avgDuration: '4m 10s',
      revenue: Math.round(baseRevenue * 0.01),
      transactions: Math.round(baseTransactions * 0.01),
      color: '#ec4899',
    },
  ];

  const topPages = industry.topPages || [];

  const devices = [
    { name: 'Mobile (Smartphone)', value: Math.round(baseSessions * 0.74), percentage: 74, color: accentColor },
    { name: 'Desktop / PC', value: Math.round(baseSessions * 0.22), percentage: 22, color: '#3b82f6' },
    { name: 'Tablet / iPad', value: Math.round(baseSessions * 0.04), percentage: 4, color: '#6366f1' },
  ];

  const browsers = [
    { name: 'Chrome', share: '68.4%', users: Math.round(baseUsers * 0.684), color: '#3b82f6' },
    { name: 'Safari', share: '19.2%', users: Math.round(baseUsers * 0.192), color: accentColor },
    { name: 'Edge', share: '5.8%', users: Math.round(baseUsers * 0.058), color: '#f59e0b' },
    { name: 'Samsung Internet', share: '4.5%', users: Math.round(baseUsers * 0.045), color: '#8b5cf6' },
    { name: 'Firefox & Other', share: '2.1%', users: Math.round(baseUsers * 0.021), color: '#94a3b8' },
  ];

  const operatingSystems = [
    { name: 'Android', share: '58.2%', color: accentColor },
    { name: 'iOS', share: '25.6%', color: '#3b82f6' },
    { name: 'Windows', share: '13.8%', color: '#6366f1' },
    { name: 'macOS', share: '2.4%', color: '#8b5cf6' },
  ];

  const geoLocations = [
    { city: 'Dhaka', region: 'Dhaka Division', sessions: Math.round(baseSessions * 0.58), share: '58.0%' },
    { city: 'Chittagong', region: 'Chittagong Division', sessions: Math.round(baseSessions * 0.15), share: '15.0%' },
    { city: 'Sylhet', region: 'Sylhet Division', sessions: Math.round(baseSessions * 0.08), share: '8.0%' },
    { city: 'Rajshahi', region: 'Rajshahi Division', sessions: Math.round(baseSessions * 0.06), share: '6.0%' },
    { city: 'Khulna', region: 'Khulna Division', sessions: Math.round(baseSessions * 0.05), share: '5.0%' },
    { city: 'Gazipur', region: 'Dhaka Division', sessions: Math.round(baseSessions * 0.04), share: '4.0%' },
    { city: 'Cumilla', region: 'Chittagong Division', sessions: Math.round(baseSessions * 0.02), share: '2.0%' },
    { city: 'International (US, UK, UAE)', region: 'Overseas Expats', sessions: Math.round(baseSessions * 0.02), share: '2.0%' },
  ];

  const conversionRate = baseSessions > 0 && baseTransactions > 0
    ? `${((baseTransactions / baseSessions) * 100).toFixed(2)}%`
    : '0.00%';

  const funnelStages = [
    {
      stage: '1. Store Visits (session_start)',
      eventName: 'session_start',
      count: baseSessions,
      dropoffRate: '0%',
      conversionFromStart: '100%',
      color: '#3b82f6',
    },
    {
      stage: '2. Product Views (view_item)',
      eventName: 'view_item',
      count: Math.round(baseSessions * 0.62),
      dropoffRate: '38.0%',
      conversionFromStart: '62.0%',
      color: '#0ea5e9',
    },
    {
      stage: '3. Cart Additions (add_to_cart)',
      eventName: 'add_to_cart',
      count: Math.round(baseSessions * 0.21),
      dropoffRate: '66.1%',
      conversionFromStart: '21.0%',
      color: accentColor,
    },
    {
      stage: '4. Checkout Initiated (begin_checkout)',
      eventName: 'begin_checkout',
      count: Math.round(baseSessions * 0.078),
      dropoffRate: '62.8%',
      conversionFromStart: '7.8%',
      color: '#f59e0b',
    },
    {
      stage: '5. Completed Orders (purchase)',
      eventName: 'purchase',
      count: baseTransactions,
      dropoffRate: '43.2%',
      conversionFromStart: conversionRate,
      color: accentColor,
    },
  ];

  const kpis = {
    realtimeActive: industry.realtimeActive || 4,
    totalSessions: baseSessions,
    totalUsers: baseUsers,
    totalPageviews: basePageviews,
    viewsPerSession: baseSessions > 0 ? (basePageviews / baseSessions).toFixed(2) : '0.00',
    avgEngagementTime: '2m 14s',
    engagementRate: '71.4%',
    bounceRate: '28.6%',
    conversionRate,
    totalRevenue: baseRevenue,
    totalTransactions: baseTransactions,
    isStoreSynced: hasStoreStats,
    trends: {
      sessions: '+12.4%',
      users: '+10.8%',
      pageviews: '+16.5%',
      engagementRate: '+2.1%',
      revenue: '+14.2%',
      conversionRate: '+0.25%',
    },
  };

  return {
    kpis,
    timeline,
    channels,
    topPages,
    devices,
    browsers,
    operatingSystems,
    geoLocations,
    funnelStages,
    accentColor,
  };
};

// Generates real-time minute activity distribution based on active client profile
export const getRealtimeMinuteActivity = () => {
  const industry = getClientIndustryData();
  const maxRange = Math.max(2, industry.realtimeActive || 4);
  const minutes = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 60000);
    const label = `${t.getHours().toString().padStart(2, '0')}:${t.getMinutes().toString().padStart(2, '0')}`;
    const value = Math.floor(Math.random() * maxRange) + 1;
    minutes.push({
      time: label,
      activeUsers: value,
    });
  }
  return minutes;
};

// Generates simulated live real-time visitor event feed matching active tenant
export const getLiveEventFeed = () => {
  return getClientIndustryData().liveEvents;
};
