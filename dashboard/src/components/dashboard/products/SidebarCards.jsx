import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, UploadCloud, X, Tag, Check } from "lucide-react";
import { toast } from "sonner";

const COMMON_TAG_SUGGESTIONS = [
  "featured",
  "new-arrival",
  "best-seller",
  "popular",
  "sale",
  "trending",
  "premium",
  "limited-edition",
  "organic",
  "handmade",
  "luxury",
  "exclusive",
];

export const SidebarCards = ({
  isActive,
  setIsActive,
  imagePreview,
  mainImageError,
  fileInputRef,
  handleImageSelect,
  removeUploadedImage,
  galleryImages,
  galleryInputRef,
  handleGalleryImageSelect,
  removeGalleryImage,
  categorySlug,
  setCategorySlug,
  categories = [],
  parentBrandSlug,
  setParentBrandSlug,
  brandSlug,
  setBrandSlug,
  parentBrands = [],
  childBrands = [],
  brands = [],
  season,
  setSeason,
  tags = [],
  setTags,
  clientConfig,
  getFullPreviewUrl,
}) => {
  const [tagInput, setTagInput] = useState("");
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const tagDropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        tagDropdownRef.current &&
        !tagDropdownRef.current.contains(e.target)
      ) {
        setIsTagDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddTag = (rawTag) => {
    const formatted = rawTag
      .trim()
      .toLowerCase()
      .replace(/[\s,]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!formatted) return;

    if (tags.includes(formatted)) {
      toast.info(`Tag "${formatted}" is already added.`);
      setTagInput("");
      setIsTagDropdownOpen(false);
      return;
    }

    if (tags.length >= 10) {
      toast.error("Maximum 10 tags limit reached per product.");
      setTagInput("");
      setIsTagDropdownOpen(false);
      return;
    }

    setTags([...tags, formatted]);
    setTagInput("");
    setIsTagDropdownOpen(false);
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag(tagInput);
    }
  };

  const filteredSuggestions = COMMON_TAG_SUGGESTIONS.filter(
    (item) =>
      item.toLowerCase().includes(tagInput.trim().toLowerCase()) &&
      !tags.includes(item)
  );

  return (
    <div className="space-y-6">
      {/* 1. Status Card (Boolean isActive Switch) */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-bold border-b pb-2 text-foreground">
          Status
        </h3>
        <div className="flex items-center justify-between pt-1">
          <div>
            <label className="text-xs font-semibold block text-foreground">
              {isActive ? "🟢 Active / Published" : "⚪ Inactive / Draft"}
            </label>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {isActive
                ? "Product is visible on public store."
                : "Product is hidden from customer catalog."}
            </p>
          </div>
          <Switch
            checked={Boolean(isActive)}
            onCheckedChange={(checked) => setIsActive(checked)}
          />
        </div>
      </div>

      {/* 2. Featured Image Card */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-bold border-b pb-2 text-foreground">
          Featured Image *
        </h3>

        {!imagePreview ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px] ${
              mainImageError
                ? "border-destructive bg-destructive/5 text-destructive"
                : "border-border/80 hover:border-primary/50 hover:bg-muted/10"
            }`}
          >
            <UploadCloud
              className={`h-8 w-8 mb-1.5 ${
                mainImageError ? "text-destructive" : "text-muted-foreground"
              }`}
            />
            <span className="text-xs font-semibold block text-foreground">
              Upload Main Image
            </span>
            <span className="text-[10px] text-muted-foreground block mt-0.5">
              PNG, JPG, WEBP up to 2MB
            </span>
            {mainImageError && (
              <p className="text-[11px] font-semibold text-destructive mt-2">
                {mainImageError}
              </p>
            )}
          </div>
        ) : (
          <div className="relative rounded-lg border overflow-hidden group bg-muted/10">
            <img
              src={
                imagePreview.startsWith("blob:") ||
                imagePreview.startsWith("http")
                  ? imagePreview
                  : getFullPreviewUrl(imagePreview)
              }
              alt="Featured preview"
              className="w-full h-44 object-cover"
            />
            <button
              type="button"
              onClick={removeUploadedImage}
              className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 shadow-sm hover:bg-destructive/90 transition-colors cursor-pointer"
              title="Remove image"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageSelect}
          accept="image/*"
          className="hidden"
        />
      </div>

      {/* 3. Gallery Images Card */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="text-sm font-bold text-foreground">
            Product Gallery ({galleryImages.length}/5)
          </h3>
          {galleryImages.length < 5 && (
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
            >
              + Add Image
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {galleryImages.map((img) => (
            <div
              key={img.id}
              className="relative rounded-lg border bg-muted/10 overflow-hidden group aspect-square flex items-center justify-center"
            >
              <img
                src={
                  img.preview.startsWith("http") ||
                  img.preview.startsWith("blob:")
                    ? img.preview
                    : getFullPreviewUrl(img.preview)
                }
                alt="Gallery preview"
                className="object-cover w-full h-full"
              />
              <button
                type="button"
                onClick={() => removeGalleryImage(img.id)}
                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 shadow-sm hover:bg-destructive/90 transition-colors"
                title="Remove gallery image"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}

          {galleryImages.length < 5 && (
            <div
              onClick={() => galleryInputRef.current?.click()}
              className="border-2 border-dashed border-border/80 hover:border-primary/50 hover:bg-muted/10 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all aspect-square min-h-[70px]"
            >
              <Plus className="h-5 w-5 text-muted-foreground" />
              <span className="text-[9px] font-semibold text-muted-foreground mt-0.5">
                Add
              </span>
            </div>
          )}
        </div>

        <input
          type="file"
          ref={galleryInputRef}
          onChange={handleGalleryImageSelect}
          accept="image/*"
          multiple
          className="hidden"
        />
      </div>

      {/* 4. Categories Card */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3.5">
        <h3 className="text-sm font-bold border-b pb-2 text-foreground">
          Categories
        </h3>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground block">
            Category
          </label>
          <div className="flex gap-2">
            <Select
              value={categorySlug || "__none__"}
              onValueChange={(val) =>
                setCategorySlug(val === "__none__" ? "" : val)
              }
            >
              <SelectTrigger className="flex-1 cursor-pointer h-9">
                <SelectValue placeholder="Select a category">
                  {categorySlug && categorySlug !== "__none__" ? (() => {
                    const found = categories.find(
                      (c) =>
                        c.slug === categorySlug ||
                        c.did === categorySlug ||
                        c._id === categorySlug ||
                        String(c._id) === String(categorySlug) ||
                        c.id === categorySlug
                    );
                    if (!found) return categorySlug;
                    if (found.parent) {
                      const pName =
                        typeof found.parent === "object"
                          ? found.parent.name
                          : categories.find(
                              (c) =>
                                c.did === found.parent ||
                                c.id === found.parent ||
                                c._id === found.parent ||
                                String(c._id) === String(found.parent)
                            )?.name;
                      return pName ? `${pName} › ${found.name}` : found.name;
                    }
                    return found.name;
                  })() : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-popover border shadow-md max-h-72">
                <SelectItem value="__none__">None</SelectItem>
                {(() => {
                  const rootCats = categories.filter((c) => !c.parent);
                  const subCats = categories.filter((c) => !!c.parent);

                  const renderedDids = new Set();

                  const trees = rootCats.map((root) => {
                    const rootVal = root.did || root.slug || String(root._id);
                    renderedDids.add(root.did || String(root._id));
                    const children = subCats.filter((sub) => {
                      const p = sub.parent;
                      const pId =
                        typeof p === "object" && p !== null
                          ? p.did || p._id || p.id
                          : p;
                      const matches =
                        pId === root.did ||
                        pId === root.id ||
                        pId === root._id ||
                        pId === root.slug ||
                        String(pId) === String(root._id);
                      if (matches) {
                        renderedDids.add(sub.did || String(sub._id));
                      }
                      return matches;
                    });

                    return (
                      <div key={root.did || root.slug || root._id}>
                        {/* Parent Category Option */}
                        <SelectItem
                          value={rootVal}
                          className="font-semibold text-foreground"
                        >
                          📁 {root.name}
                        </SelectItem>

                        {/* Child Categories indented with arrow */}
                        {children.map((child) => {
                          const childVal = child.did || child.slug || String(child._id);
                          renderedDids.add(child.did || String(child._id));
                          return (
                            <SelectItem
                              key={child.did || child.slug || child._id}
                              value={childVal}
                              className="pl-6 text-xs text-muted-foreground font-normal"
                            >
                              └─ {child.name}
                            </SelectItem>
                          );
                        })}
                      </div>
                    );
                  });

                  // Handle any categories that were not rendered as part of a tree
                  const remainingCats = categories.filter(
                    (c) => !renderedDids.has(c.did || String(c._id))
                  );
                  const remainingElements = remainingCats.map((cat) => (
                    <SelectItem
                      key={cat.did || cat.slug || cat._id}
                      value={cat.did || cat.slug || String(cat._id)}
                      className="font-semibold text-foreground"
                    >
                      📁 {cat.name}
                    </SelectItem>
                  ));

                  return [...trees, ...remainingElements];
                })()}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 5. Brands Section (Conditionally rendered) */}
        {clientConfig?.features?.brand !== false && (
          <div className="space-y-3 pt-2.5 border-t">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground block">
                Brand
              </label>
              <Select
                value={parentBrandSlug || "__none__"}
                onValueChange={(val) => {
                  setParentBrandSlug(val === "__none__" ? "" : val);
                  setBrandSlug("");
                }}
              >
                <SelectTrigger className="w-full cursor-pointer h-9">
                  <SelectValue placeholder="Select Brand">
                    {parentBrandSlug && parentBrandSlug !== "__none__" ? (() => {
                      const allBrandList = brands.length > 0 ? brands : parentBrands;
                      const found = allBrandList.find(
                        (b) =>
                          b.did === parentBrandSlug ||
                          b.slug === parentBrandSlug ||
                          b._id === parentBrandSlug ||
                          String(b._id) === String(parentBrandSlug) ||
                          (b.slug && b.slug.toLowerCase() === parentBrandSlug.toLowerCase())
                      );
                      return found ? found.name : parentBrandSlug;
                    })() : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md">
                  <SelectItem value="__none__">None</SelectItem>
                  {parentBrands.map((pb) => (
                    <SelectItem
                      key={pb.did || pb.slug || pb._id}
                      value={pb.did || pb.slug || String(pb._id)}
                    >
                      {pb.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {parentBrandSlug && (
              <div className="space-y-2 animate-in fade-in">
                <label className="text-xs font-semibold text-muted-foreground block">
                  Sub Brand
                </label>
                <Select
                  value={brandSlug || "__none__"}
                  onValueChange={(val) =>
                    setBrandSlug(val === "__none__" ? "" : val)
                  }
                >
                  <SelectTrigger className="w-full cursor-pointer h-9">
                    <SelectValue placeholder="Select Sub Brand">
                      {brandSlug && brandSlug !== "__none__" ? (() => {
                        const allBrandList = brands.length > 0 ? brands : [...childBrands, ...parentBrands];
                        const found = allBrandList.find(
                          (b) =>
                            b.did === brandSlug ||
                            b.slug === brandSlug ||
                            b._id === brandSlug ||
                            String(b._id) === String(brandSlug) ||
                            (b.slug && b.slug.toLowerCase() === brandSlug.toLowerCase())
                        );
                        return found ? found.name : brandSlug;
                      })() : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-popover border shadow-md">
                    <SelectItem value="__none__">None</SelectItem>
                    {childBrands.length > 0
                      ? childBrands.map((cb) => (
                          <SelectItem
                            key={cb.did || cb.slug || cb._id}
                            value={cb.did || cb.slug || String(cb._id)}
                          >
                            {cb.name}
                          </SelectItem>
                        ))
                      : parentBrands
                          .filter(
                            (pb) =>
                              pb.slug === parentBrandSlug ||
                              pb.did === parentBrandSlug ||
                              pb._id === parentBrandSlug ||
                              String(pb._id) === String(parentBrandSlug)
                          )
                          .map((pb) => (
                            <SelectItem
                              key={pb.did || pb.slug || pb._id}
                              value={pb.did || pb.slug || String(pb._id)}
                            >
                              {pb.name}
                            </SelectItem>
                          ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        {/* 6. Season Section (Conditionally rendered) */}
        {clientConfig?.features?.season !== false && (
          <div className="space-y-2 pt-2.5 border-t">
            <label className="text-xs font-semibold text-muted-foreground block">
              Season
            </label>
            <Select
              value={season}
              onValueChange={(val) => setSeason(val ?? "All-Season")}
            >
              <SelectTrigger className="w-full h-9 cursor-pointer">
                <SelectValue placeholder="Season" />
              </SelectTrigger>
              <SelectContent className="bg-popover border shadow-md">
                <SelectItem value="All-Season">All Season</SelectItem>
                <SelectItem value="Summer">Summer</SelectItem>
                <SelectItem value="Winter">Winter</SelectItem>
                <SelectItem value="Spring">Spring</SelectItem>
                <SelectItem value="Autumn">Autumn</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* 7. Tags Card (Chip UI + Search & Add) */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center gap-1.5">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-bold text-foreground">Tags</h3>
          </div>
          <span className="text-[10px] font-semibold text-muted-foreground">
            {tags.length}/10
          </span>
        </div>

        {/* Tag Input & Search Dropdown */}
        <div className="relative" ref={tagDropdownRef}>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground block">
              Add or Search Tags
            </label>
            <Input
              placeholder={
                tags.length >= 10
                  ? "Max 10 tags reached"
                  : "e.g. nice, luxury, oud..."
              }
              value={tagInput}
              disabled={tags.length >= 10}
              onChange={(e) => {
                setTagInput(e.target.value);
                setIsTagDropdownOpen(true);
              }}
              onFocus={() => setIsTagDropdownOpen(true)}
              onKeyDown={handleTagKeyDown}
              className="h-9"
            />
          </div>

          {/* Autocomplete / Create dropdown */}
          {isTagDropdownOpen && tagInput.trim() && (
            <div className="absolute top-full mt-1 left-0 right-0 z-50 rounded-lg border border-border bg-popover shadow-lg py-1 max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-1">
              {/* Option 1: Add custom tag */}
              <button
                type="button"
                onClick={() => handleAddTag(tagInput)}
                className="w-full px-3 py-2 text-left text-xs font-semibold text-primary hover:bg-muted/50 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add tag "{tagInput.trim()}"
              </button>

              {/* Suggestions */}
              {filteredSuggestions.length > 0 && (
                <div className="border-t mt-1 pt-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground px-3 py-1 block">
                    Suggestions
                  </span>
                  {filteredSuggestions.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => handleAddTag(sug)}
                      className="w-full px-3 py-1.5 text-left text-xs text-foreground hover:bg-muted/50 flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <span>{sug}</span>
                      <Plus className="h-3 w-3 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected Tags Chips */}
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border shadow-xs animate-in fade-in"
              >
                #{t}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(t)}
                  className="hover:text-destructive transition-colors p-0.5 rounded-full"
                  title={`Remove ${t}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground italic">
            No tags added yet. Type a name and press Enter.
          </p>
        )}
      </div>
    </div>
  );
};
