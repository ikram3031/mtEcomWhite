import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Sparkles, TrendingUp, Sliders, ShieldCheck, Plus, Trash2, Package, Save } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProducts } from '@/hooks/use-products';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

/**
 * Product Showcase Manager Component
 * Handles local staging of curated product collections (Featured / Best Sellers)
 * with real-time search, live table addition, and explicit Save Changes commit.
 */
function ProductShowcaseManager({ showcaseKey, title, icon: TagIcon, iconColor }) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [stagedProducts, setStagedProducts] = useState([]);

  // Fetch full store-utils data cached via TanStack Query
  const { data: storeUtilsData, isLoading: isStoreUtilsLoading } = useQuery({
    queryKey: ['store-utils'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/store-utils');
      return res.data?.data || { featured: [], bestSeller: [] };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  // Fetch all products for live search lookup
  const { data: productsResponse, isLoading: isProductsLoading } = useProducts({
    limit: 150,
    page: 1,
  });

  const allProducts = productsResponse?.data || [];

  // Initialize staged products whenever remote storeUtilsData updates
  useEffect(() => {
    if (storeUtilsData && Array.isArray(storeUtilsData[showcaseKey])) {
      setStagedProducts(storeUtilsData[showcaseKey]);
    }
  }, [storeUtilsData, showcaseKey]);

  // Compute if local staging has unsaved changes compared to server data
  const isDirty = useMemo(() => {
    const serverList = (storeUtilsData && Array.isArray(storeUtilsData[showcaseKey]))
      ? storeUtilsData[showcaseKey]
      : [];
    const serverIds = serverList.map((p) => p.id || p._id).join(',');
    const stagedIds = stagedProducts.map((p) => p.id || p._id).join(',');
    return serverIds !== stagedIds;
  }, [storeUtilsData, showcaseKey, stagedProducts]);

  // Filter available products for adding to this showcase
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    return allProducts
      .filter((p) => {
        const pId = p.id || p._id;
        const isAlreadyStaged = stagedProducts.some((sp) => (sp.id || sp._id) === pId);
        const matchesName = p.name?.toLowerCase().includes(query);
        const matchesSku = p.sku?.toLowerCase().includes(query);
        return !isAlreadyStaged && (matchesName || matchesSku);
      })
      .slice(0, 6);
  }, [allProducts, searchQuery, stagedProducts]);

  // Add product to local staging
  const handleAddProduct = (product) => {
    const pId = product.id || product._id;
    if (!stagedProducts.some((sp) => (sp.id || sp._id) === pId)) {
      setStagedProducts((prev) => [...prev, product]);
    }
    setSearchQuery('');
  };

  // Remove product from local staging
  const handleRemoveProduct = (productId) => {
    setStagedProducts((prev) => prev.filter((p) => (p.id || p._id) !== productId));
  };

  // Mutation to persist updated array of product IDs to /api/v1/store-utils
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        [showcaseKey]: stagedProducts.map((p) => p.id || p._id),
      };
      const res = await apiClient.put('/api/v1/store-utils', payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`${title} saved successfully!`);
      queryClient.setQueryData(['store-utils'], data?.data);
      queryClient.invalidateQueries({ queryKey: ['store-utils'] });
    },
    onError: () => {
      toast.error(`Failed to save ${title}. Please try again.`);
    },
  });

  return (
    <div className="space-y-6">
      <Card className="border shadow-xs w-full">
        {/* Header with Title, Count Badge, and Save Changes Button on Right */}
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <TagIcon className={`h-5 w-5 ${iconColor}`} />
              </div>
              <CardTitle className="text-xl font-bold text-foreground">{title}</CardTitle>
              <Badge variant="outline" className="px-2.5 py-0.5 text-xs font-semibold bg-muted">
                {stagedProducts.length} Products Added
              </Badge>
            </div>

            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!isDirty || saveMutation.isPending}
              className={`h-9 gap-1.5 text-xs font-semibold px-4 cursor-pointer transition-all ${
                isDirty
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md ring-2 ring-primary/30'
                  : 'bg-muted text-muted-foreground hover:bg-muted opacity-70'
              }`}
            >
              <Save className="h-4 w-4" />
              {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Add Product Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={`Search products to add to ${title.toLowerCase()}...`}
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Autocomplete Dropdown Search Results */}
          {searchResults.length > 0 && (
            <div className="rounded-lg border bg-card p-2 shadow-md divide-y divide-border">
              {searchResults.map((product) => {
                const pId = product.id || product._id;
                return (
                  <div
                    key={pId}
                    className="flex items-center justify-between py-2 px-2 hover:bg-muted/50 rounded-md transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {product.image || product.image_url || product.imageUrl ? (
                        <img
                          src={product.image || product.image_url || product.imageUrl}
                          alt={product.name}
                          className="h-8 w-8 rounded object-cover border shrink-0"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0 border">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="truncate">
                        <p className="text-xs font-semibold truncate">{product.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {product.sku || 'No SKU'} • ৳{product.price}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs font-medium gap-1 shrink-0 cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => handleAddProduct(product)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Staged Products Table */}
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[80px]">Image</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isStoreUtilsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-9 w-9 rounded" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : stagedProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      No products are currently added to {title}. Use the search bar above to add products and click &quot;Save Changes&quot;.
                    </TableCell>
                  </TableRow>
                ) : (
                  stagedProducts.map((product) => {
                    const pId = product.id || product._id;
                    const displayImage = product.image || product.image_url || product.imageUrl;
                    const stockLabel = product.stockStatus === 'outofstock' ? 'Out of Stock' : (product.status || 'In Stock');
                    const isOutOfStock = stockLabel.toLowerCase().includes('out');

                    return (
                      <TableRow key={pId}>
                        <TableCell>
                          {displayImage ? (
                            <img
                              src={displayImage}
                              alt={product.name}
                              className="h-9 w-9 rounded object-cover border"
                            />
                          ) : (
                            <div className="h-9 w-9 rounded bg-muted flex items-center justify-center border">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold text-sm">{product.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {product.sku || '—'}
                        </TableCell>
                        <TableCell className="text-sm font-medium">৳{product.price}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              isOutOfStock
                                ? 'text-destructive bg-destructive/10 border-destructive/20'
                                : 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20'
                            }
                          >
                            {stockLabel}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                            title={`Remove from ${title}`}
                            onClick={() => handleRemoveProduct(pId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('featured');

  const tabs = [
    { id: 'featured', label: 'Featured Products', icon: Sparkles, iconColor: 'text-amber-500' },
    { id: 'bestseller', label: 'Best Selling Products', icon: TrendingUp, iconColor: 'text-emerald-500' },
    { id: 'catalog-preferences', label: 'Catalog Display', icon: Sliders, iconColor: 'text-blue-500' },
    { id: 'advanced-security', label: 'Security & Access', icon: ShieldCheck, iconColor: 'text-purple-500' },
  ];

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 w-full">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Store Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure product catalog highlights, storefront showcases, and store configurations.
        </p>
      </div>

      {/* Top Horizontal Tabs */}
      <div className="border-b border-border pb-3">
        <div className="inline-flex flex-wrap items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/50">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
                }`}
              >
                <Icon className={`h-4 w-4 ${t.iconColor}`} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Tab Panel */}
      <div className="w-full">
        {activeTab === 'featured' && (
          <ProductShowcaseManager
            showcaseKey="featured"
            title="Featured Products"
            icon={Sparkles}
            iconColor="text-amber-500"
          />
        )}

        {activeTab === 'bestseller' && (
          <ProductShowcaseManager
            showcaseKey="bestSeller"
            title="Best Selling Products"
            icon={TrendingUp}
            iconColor="text-emerald-500"
          />
        )}

        {activeTab === 'catalog-preferences' && (
          <Card className="border shadow-xs w-full">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Sliders className="h-5 w-5 text-blue-500" />
                Catalog Display Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center p-12 text-center space-y-3 rounded-lg border border-dashed border-border bg-muted/20">
                <Sliders className="h-10 w-10 text-muted-foreground/50" />
                <h3 className="font-semibold text-foreground">Coming Soon</h3>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Automated sorting rules, default collection displays, and layout presets will be available in an upcoming update.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'advanced-security' && (
          <Card className="border shadow-xs w-full">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-purple-500" />
                Security & Access Policy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center p-12 text-center space-y-3 rounded-lg border border-dashed border-border bg-muted/20">
                <ShieldCheck className="h-10 w-10 text-muted-foreground/50" />
                <h3 className="font-semibold text-foreground">Coming Soon</h3>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Advanced multi-tenant security policies and audit governance configurations will be accessible here.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
