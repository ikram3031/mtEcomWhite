import { clientConfig, getActiveClientKey } from '@/clientConfig';

// Retrieves the persistent GA4 settings for the active client or config defaults
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
    const raw = localStorage.getItem(`ga4_config_${clientKey}`);
    if (raw) {
      return { ...defaults, ...JSON.parse(raw) };
    }
  } catch {
    // fallback to defaults on storage access error
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

// Generates comprehensive Google Analytics dataset based on selected date range
export const getAnalyticsDataForRange = (range = '30days', _brandName = 'Decantre') => {
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

  const baseSessions = Math.round(38450 * multiplier);
  const baseUsers = Math.round(27820 * multiplier);
  const basePageviews = Math.round(119400 * multiplier);
  const baseRevenue = Math.round(485000 * multiplier);
  const baseTransactions = Math.round(342 * multiplier);

  const timeline = [];
  const now = new Date();

  if (range === 'today') {
    for (let h = 0; h <= 23; h++) {
      const hourLabel = `${h % 12 === 0 ? 12 : h % 12}:00 ${h >= 12 ? 'PM' : 'AM'}`;
      const hourActivity = Math.sin((h / 24) * Math.PI) + 0.3;
      const hourlySessions = Math.max(8, Math.round(hourActivity * 120 + (Math.random() * 30 - 15)));
      const hourlyUsers = Math.round(hourlySessions * 0.78);
      const hourlyViews = Math.round(hourlySessions * 2.8);
      const hourlyPurchases = h >= 10 && h <= 22 ? Math.round(Math.random() * 4) : 0;

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
      const dailySessions = Math.round((baseSessions / daysCount) * dayFactor * randomNoise);
      const dailyUsers = Math.round(dailySessions * 0.76);
      const dailyViews = Math.round(dailySessions * 3.1);
      const dailyPurchases = Math.max(1, Math.round((baseTransactions / daysCount) * dayFactor * randomNoise));

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
      color: '#10b981',
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
      color: '#C5A059',
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

  const topPages = [
    {
      path: '/',
      title: 'Store Homepage',
      pageviews: Math.round(basePageviews * 0.32),
      uniqueViews: Math.round(baseUsers * 0.44),
      avgTime: '1m 35s',
      bounceRate: '24.6%',
      exitRate: '18.2%',
    },
    {
      path: '/collections/all-products',
      title: 'All Products Catalog',
      pageviews: Math.round(basePageviews * 0.22),
      uniqueViews: Math.round(baseUsers * 0.31),
      avgTime: '2m 45s',
      bounceRate: '21.4%',
      exitRate: '14.8%',
    },
    {
      path: '/collections/best-sellers',
      title: 'Best Selling Collection',
      pageviews: Math.round(basePageviews * 0.15),
      uniqueViews: Math.round(baseUsers * 0.22),
      avgTime: '3m 10s',
      bounceRate: '19.8%',
      exitRate: '12.5%',
    },
    {
      path: '/cart',
      title: 'Shopping Cart',
      pageviews: Math.round(basePageviews * 0.09),
      uniqueViews: Math.round(baseUsers * 0.13),
      avgTime: '1m 50s',
      bounceRate: '15.2%',
      exitRate: '22.1%',
    },
    {
      path: '/checkout',
      title: 'Secure Checkout',
      pageviews: Math.round(basePageviews * 0.06),
      uniqueViews: Math.round(baseUsers * 0.08),
      avgTime: '2m 20s',
      bounceRate: '8.4%',
      exitRate: '11.3%',
    },
    {
      path: '/collections/new-arrivals',
      title: 'New Arrivals 2026',
      pageviews: Math.round(basePageviews * 0.08),
      uniqueViews: Math.round(baseUsers * 0.11),
      avgTime: '2m 15s',
      bounceRate: '23.1%',
      exitRate: '16.4%',
    },
    {
      path: '/contact',
      title: 'Contact Us & Store Locations',
      pageviews: Math.round(basePageviews * 0.04),
      uniqueViews: Math.round(baseUsers * 0.05),
      avgTime: '1m 12s',
      bounceRate: '34.5%',
      exitRate: '42.0%',
    },
  ];

  const devices = [
    { name: 'Mobile (Smartphone)', value: Math.round(baseSessions * 0.74), percentage: 74, color: '#C5A059' },
    { name: 'Desktop / PC', value: Math.round(baseSessions * 0.22), percentage: 22, color: '#3b82f6' },
    { name: 'Tablet / iPad', value: Math.round(baseSessions * 0.04), percentage: 4, color: '#10b981' },
  ];

  const browsers = [
    { name: 'Chrome', share: '68.4%', users: Math.round(baseUsers * 0.684), color: '#3b82f6' },
    { name: 'Safari', share: '19.2%', users: Math.round(baseUsers * 0.192), color: '#10b981' },
    { name: 'Edge', share: '5.8%', users: Math.round(baseUsers * 0.058), color: '#f59e0b' },
    { name: 'Samsung Internet', share: '4.5%', users: Math.round(baseUsers * 0.045), color: '#8b5cf6' },
    { name: 'Firefox & Other', share: '2.1%', users: Math.round(baseUsers * 0.021), color: '#94a3b8' },
  ];

  const operatingSystems = [
    { name: 'Android', share: '58.2%', color: '#10b981' },
    { name: 'iOS', share: '25.6%', color: '#3b82f6' },
    { name: 'Windows', share: '13.8%', color: '#C5A059' },
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
      color: '#C5A059',
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
      conversionFromStart: `${((baseTransactions / baseSessions) * 100).toFixed(2)}%`,
      color: '#10b981',
    },
  ];

  const kpis = {
    realtimeActive: 34,
    totalSessions: baseSessions,
    totalUsers: baseUsers,
    totalPageviews: basePageviews,
    viewsPerSession: (basePageviews / baseSessions).toFixed(2),
    avgEngagementTime: '2m 48s',
    engagementRate: '71.4%',
    bounceRate: '28.6%',
    conversionRate: `${((baseTransactions / baseSessions) * 100).toFixed(2)}%`,
    totalRevenue: baseRevenue,
    totalTransactions: baseTransactions,
    trends: {
      sessions: '+16.8%',
      users: '+14.2%',
      pageviews: '+22.5%',
      engagementRate: '+3.4%',
      revenue: '+18.9%',
      conversionRate: '+0.35%',
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
  };
};

// Generates real-time 30-minute minute-by-minute activity distribution
export const getRealtimeMinuteActivity = () => {
  const minutes = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 60000);
    const label = `${t.getHours().toString().padStart(2, '0')}:${t.getMinutes().toString().padStart(2, '0')}`;
    const value = Math.floor(Math.random() * 12) + 2;
    minutes.push({
      time: label,
      activeUsers: value,
    });
  }
  return minutes;
};

// Generates simulated live real-time visitor event feed
export const getLiveEventFeed = () => {
  const events = [
    { id: 1, type: 'view_item', label: 'Viewed Product "Velvet Noir Perfume"', location: 'Dhaka, BD', time: 'Just now', badge: 'bg-blue-500/15 text-blue-500' },
    { id: 2, type: 'add_to_cart', label: 'Added to Cart "Amber Suede 100ml"', location: 'Chittagong, BD', time: '12s ago', badge: 'bg-amber-500/15 text-amber-500' },
    { id: 3, type: 'page_view', label: 'Browsing "/collections/all-products"', location: 'Sylhet, BD', time: '28s ago', badge: 'bg-purple-500/15 text-purple-500' },
    { id: 4, type: 'purchase', label: 'Completed Order (৳3,450 via bKash)', location: 'Dhaka, BD', time: '45s ago', badge: 'bg-emerald-500/15 text-emerald-500' },
    { id: 5, type: 'begin_checkout', label: 'Started Checkout step', location: 'Rajshahi, BD', time: '1m ago', badge: 'bg-amber-500/15 text-amber-500' },
    { id: 6, type: 'search', label: 'Searched "oud wood luxury"', location: 'Khulna, BD', time: '2m ago', badge: 'bg-sky-500/15 text-sky-500' },
  ];
  return events;
};
