import { useState, useCallback } from 'react';
import { useBrands, getBrandName } from '@/lib/core/category-cache';
import { Button } from '@/components/core/ui/button';
import { Input } from '@/components/core/ui/input';
import { Textarea } from '@/components/core/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/core/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/core/ui/table';
import { Plus, Search, Edit2, Trash2, Tag } from 'lucide-react';
import { apiClient } from '@/lib/core/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ConfirmDeleteDialog } from '@/components/core/ui/confirm-delete-dialog';
import { getApiErrorMessage } from '@/lib/core/error-handler';

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const BrandsPage = () => {
  const { data: brands = [], isLoading } = useBrands();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNameChange = useCallback(
    (value) => {
      setName(value);
      if (!slugManual) {
        setSlug(slugify(value));
      }
    },
    [slugManual]
  );

  const openAddDialog = () => {
    setEditingBrand(null);
    setName('');
    setSlug('');
    setSlugManual(false);
    setDescription('');
    setIsOpen(true);
  };

  const openEditDialog = (brand) => {
    setEditingBrand(brand);
    setName(brand.name);
    setSlug(brand.slug);
    setSlugManual(true);
    setDescription(brand.description || '');
    setIsOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      toast.error('Name and slug are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const body = {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim(),
      };

      if (editingBrand) {
        await apiClient.put(`/api/v1/brands/${editingBrand.did}`, body);
        toast.success('Brand updated successfully');
      } else {
        await apiClient.post('/api/v1/brands', body);
        toast.success('Brand created successfully');
      }

      queryClient.invalidateQueries({ queryKey: ['brands-cache'] });
      setIsOpen(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to save brand'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/api/v1/brands/${deleteTarget.did}`);
      toast.success('Brand deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['brands-cache'] });
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete brand'));
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredBrands = brands.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Brands</h2>
          <p className="text-sm text-muted-foreground">
            Manage your product brands settings.
          </p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" /> Add Brand
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search brands..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading brands...</div>
      ) : filteredBrands.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No brands found.</div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBrands.map((brand) => (
                <TableRow key={brand.did}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    {brand.name}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{brand.slug}</TableCell>
                  <TableCell className="font-mono text-xs">{brand.parent ? getBrandName(brand.parent) ?? brand.parent : ''}</TableCell>
                  <TableCell className="space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(brand)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget({ did: brand.did, name: brand.name })}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingBrand ? 'Edit Brand' : 'Add Brand'}</DialogTitle>
            <DialogDescription>
              Fill in the brand information below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Brand Name</label>
              <Input
                required
                placeholder="e.g. Creed"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold">Slug</label>
                <button
                  type="button"
                  className="text-[10px] text-muted-foreground underline"
                  onClick={() => setSlugManual(!slugManual)}
                >
                  {slugManual ? 'Auto-generate' : 'Edit manually'}
                </button>
              </div>
              <Input
                required
                placeholder="creed"
                value={slug}
                onChange={(e) => {
                  setSlugManual(true);
                  setSlug(e.target.value);
                }}
                disabled={!slugManual}
                className={!slugManual ? 'opacity-60' : ''}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Description</label>
              <Textarea
                placeholder="Description of the brand"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
        title="Delete Brand"
        description={`Are you sure you want to delete brand "${deleteTarget?.name ?? ''}"?`}
      />
    </div>
  );
}

export default BrandsPage;
