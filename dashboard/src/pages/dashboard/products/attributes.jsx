import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/core/ui/button';
import { Input } from '@/components/core/ui/input';
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
import { Plus, Search, Edit2, Trash2, Sliders, X } from 'lucide-react';
import { apiClient } from '@/lib/core/api-client';
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

function sortAttributeValues(vals = []) {
  if (!Array.isArray(vals)) return [];
  return [...vals].sort((a, b) => {
    const valA = typeof a === "string" ? a : (a?.name || a?.size || "");
    const valB = typeof b === "string" ? b : (b?.name || b?.size || "");
    return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: "base" });
  });
}

const AttributesPage = () => {
  const [attributes, setAttributes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [values, setValues] = useState([]);
  const [newValueName, setNewValueName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAttributes = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/api/v1/dashboard/attributes');
      const raw = res.data?.data || [];
      const sortedData = raw.map((attr) => ({
        ...attr,
        values: sortAttributeValues(attr.values || []),
      }));
      setAttributes(sortedData);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to fetch attributes'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttributes();
  }, []);

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
    setEditingAttribute(null);
    setName('');
    setSlug('');
    setSlugManual(false);
    setValues([]);
    setNewValueName('');
    setIsOpen(true);
  };

  const openEditDialog = (attr) => {
    setEditingAttribute(attr);
    setName(attr.name);
    setSlug(attr.slug);
    setSlugManual(true);
    setValues(sortAttributeValues(attr.values || []));
    setNewValueName('');
    setIsOpen(true);
  };

  const addValue = () => {
    const trimmed = newValueName.trim();
    if (!trimmed) return;
    const valueSlug = slugify(trimmed);
    
    if (values.some((v) => v.slug === valueSlug)) {
      toast.error('Value already exists in this group');
      return;
    }

    setValues((prev) => sortAttributeValues([...prev, { name: trimmed, slug: valueSlug }]));
    setNewValueName('');
  };

  const removeValue = (index) => {
    setValues((prev) => prev.filter((_, i) => i !== index));
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
        values,
      };

      if (editingAttribute) {
        await apiClient.put(`/api/v1/dashboard/attributes/${editingAttribute._id}`, body);
        toast.success('Attribute updated successfully');
      } else {
        await apiClient.post('/api/v1/dashboard/attributes', body);
        toast.success('Attribute created successfully');
      }

      fetchAttributes();
      setIsOpen(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to save attribute'));
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
      await apiClient.delete(`/api/v1/dashboard/attributes/${deleteTarget._id}`);
      toast.success('Attribute deleted successfully');
      fetchAttributes();
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete attribute'));
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredAttributes = attributes.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Product Attributes</h2>
            <p className="text-sm text-muted-foreground">Manage variation groups (e.g. Size, Volume, Color) for your products.</p>
          </div>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Attribute
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search attributes..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-card text-card-foreground shadow-sm border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading attributes...</div>
        ) : filteredAttributes.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No attributes found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Values</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAttributes.map((attr) => (
                <TableRow key={attr._id}>
                  <TableCell className="font-medium">{attr.name}</TableCell>
                  <TableCell className="text-muted-foreground">{attr.slug}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {attr.values?.map((val) => (
                        <span
                          key={val.slug}
                          className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground font-medium border border-border"
                        >
                          {val.name}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(attr)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget({ _id: attr._id, name: attr.name })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAttribute ? 'Edit Attribute' : 'Add New Attribute'}</DialogTitle>
            <DialogDescription>Define attribute group name, slug, and variations.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">Attribute Name</label>
              <Input
                id="name"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Volume"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="slug" className="text-sm font-medium">Slug</label>
                <button
                  type="button"
                  onClick={() => setSlugManual(!slugManual)}
                  className="text-xs text-primary hover:underline"
                >
                  {slugManual ? 'Auto-generate' : 'Edit manually'}
                </button>
              </div>
              <Input
                id="slug"
                required
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                disabled={!slugManual}
                placeholder="e.g. volume"
              />
            </div>

            <div className="space-y-2 border-t pt-4">
              <label className="text-sm font-medium">Attribute Values / Variations</label>
              <div className="flex gap-2">
                <Input
                  value={newValueName}
                  onChange={(e) => setNewValueName(e.target.value)}
                  placeholder="e.g. 50ml"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addValue();
                    }
                  }}
                />
                <Button type="button" variant="secondary" onClick={addValue}>
                  Add
                </Button>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-2">
                {values.map((val, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground font-medium border border-border"
                  >
                    {val.name}
                    <button
                      type="button"
                      onClick={() => removeValue(index)}
                      className="text-muted-foreground hover:text-foreground ml-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingAttribute ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Attribute"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        isDeleting={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default AttributesPage;
