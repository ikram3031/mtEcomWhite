import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/core/ui/button";
import { Input } from "@/components/core/ui/input";
import { Switch } from "@/components/core/ui/switch";
import { RichTextEditor } from "@/components/core/dashboard/rich-text-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/core/ui/select";
import {
  Plus,
  UploadCloud,
  X,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import { apiClient } from "@/lib/core/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  useCategories,
  useBrands,
} from "@/lib/core/category-cache";
import { getApiErrorMessage } from '@/lib/core/error-handler';

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB limit

const emptyVariant = () => ({
  size: "",
  price: "",
  offerPrice: "",
  sku: "",
  imageUrl: "",
  imageFile: null,
  imagePreview: "",
  imageError: "",
});

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const API_BASE = (import.meta.env?.VITE_API_BASE_URL || "").replace(/\/$/, "");

const NewProductPage = () => {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);

  // Basic fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [description, setDescription] = useState("");

  // Image upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [mainImageFile, setMainImageFile] = useState(null);
  const [mainImageError, setMainImageError] = useState("");
  const fileInputRef = useRef(null);

  // Type toggle
  const [productType, setProductType] = useState("simple");

  // Simple product fields
  const [price, setPrice] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [stockStatus, setStockStatus] = useState("instock");
  const [sku, setSku] = useState("");

  // Variant product fields
  const [variants, setVariants] = useState([emptyVariant()]);
  const [attributeGroups, setAttributeGroups] = useState([]);
  const [selectedAttributeGroup, setSelectedAttributeGroup] = useState("");
  const [variantInputModes, setVariantInputModes] = useState({});

  useEffect(() => {
    const fetchAttributes = async () => {
      try {
        const res = await apiClient.get("/api/v1/dashboard/attributes");
        const rawGroups = res.data?.data || [];
        const sortedGroups = rawGroups.map((g) => ({
          ...g,
          values: Array.isArray(g.values)
            ? [...g.values].sort((a, b) => {
                const nameA = String(a.name || a.size || a || "");
                const nameB = String(b.name || b.size || b || "");
                return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: "base" });
              })
            : [],
        }));
        setAttributeGroups(sortedGroups);
      } catch (err) {
        console.error("Failed to fetch attributes", err);
      }
    };
    fetchAttributes();
  }, []);

  // Category & Brand
  const [categorySlug, setCategorySlug] = useState("");
  const [brandSlug, setBrandSlug] = useState("");
  const [parentBrandSlug, setParentBrandSlug] = useState("");

  // Season
  const [season, setSeason] = useState("All-Season");

  const queryClient = useQueryClient();
  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();

  // Resolve top-level parent brands
  const parentBrands = brands.filter((b) => !b.parent);

  // Resolve child brands based on selected parent brand
  const selectedParentObj = parentBrands.find(
    (pb) =>
      (pb.did && pb.did === parentBrandSlug) ||
      (pb.slug && pb.slug.toLowerCase() === parentBrandSlug?.toLowerCase()) ||
      (pb._id && String(pb._id) === parentBrandSlug)
  );

  const childBrands = selectedParentObj
    ? brands.filter((b) => {
        if (!b.parent) return false;
        const parentVal = typeof b.parent === 'object'
          ? (b.parent?.did || b.parent?.slug || b.parent?._id)
          : String(b.parent);
        return (
          parentVal === selectedParentObj.did ||
          parentVal === selectedParentObj.slug ||
          parentVal === selectedParentObj._id ||
          (selectedParentObj.id && parentVal === String(selectedParentObj.id))
        );
      })
    : [];

  const handleNameChange = useCallback(
    (value) => {
      setName(value);
      if (!slugManual) {
        setSlug(slugify(value));
      }
    },
    [slugManual],
  );

  const addVariant = () => {
    setVariants((prev) => [...prev, emptyVariant()]);
    const nextIndex = variants.length;
    setVariantInputModes((prev) => ({ ...prev, [nextIndex]: "preset" }));
  };

  const addAllPresets = () => {
    const activeGroup = attributeGroups.find((g) => g.slug === selectedAttributeGroup);
    if (!activeGroup) {
      toast.error("Please select a Variation Type first.");
      return;
    }
    
    const newVariants = activeGroup.values.map((val) => ({
      size: val.name,
      price: "",
      offerPrice: "",
      sku: "",
      imageUrl: "",
      imageFile: null,
      imagePreview: "",
    }));
    
    setVariants(newVariants);
    
    const modes = {};
    newVariants.forEach((_, idx) => {
      modes[idx] = "preset";
    });
    setVariantInputModes(modes);
    toast.success(`Loaded all ${newVariants.length} presets from "${activeGroup.name}".`);
  };

  const removeVariant = (index) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
    setVariantInputModes((prev) => {
      const copy = { ...prev };
      delete copy[index];
      return copy;
    });
  };

  const updateVariant = (index, field, value) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    );
  };

  const handleImageSelect = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > MAX_IMAGE_SIZE) {
      setMainImageError("Maximum size exceeded. Please upload a different image.");
      setImagePreview("");
      setMainImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setMainImageError("");
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setMainImageFile(file);
  };

  const handleVariantImageSelect = (index, e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > MAX_IMAGE_SIZE) {
      updateVariant(index, "imageError", "Maximum size exceeded. Please upload a different image.");
      updateVariant(index, "imageFile", null);
      updateVariant(index, "imagePreview", "");
      e.target.value = "";
      return;
    }

    updateVariant(index, "imageError", "");
    const previewUrl = URL.createObjectURL(file);
    updateVariant(index, "imageFile", file);
    updateVariant(index, "imagePreview", previewUrl);
  };

  const removeUploadedImage = () => {
    setImagePreview("");
    setUploadedImageUrl("");
    setMainImageFile(null);
    setMainImageError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Product name is required.");
      return;
    }
    if (!slug.trim()) {
      toast.error("Product slug is required.");
      return;
    }

    if (productType === "simple") {
      if (!price || Number(price) <= 0) {
        toast.error("Price must be greater than 0.");
        return;
      }
    } else {
      const validVariants = variants.filter((v) => v.size.trim() && v.price);
      if (validVariants.length === 0) {
        toast.error("At least one variant with size and price is required.");
        return;
      }
    }

    // Image is required
    if (!mainImageFile && !uploadedImageUrl) {
      toast.error("Product image is required. Please upload an image before saving.");
      return;
    }

    setIsCreating(true);
    try {
      let finalMainImageUrl = uploadedImageUrl || "";
      let finalThumbnailUrl = "";
      if (mainImageFile) {
        const formData = new FormData();
        formData.append("image", mainImageFile);
        formData.append("type", "product");
        formData.append("productSlug", slug.trim());
        const uploadRes = await apiClient.post(`/api/v1/images/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        finalMainImageUrl = uploadRes.data?.data?.imageUrl || uploadRes.data?.imageUrl || "";
        finalThumbnailUrl = uploadRes.data?.data?.thumbnailUrl || uploadRes.data?.thumbnailUrl || "";
      }

      const uploadedVariants = [];
      const validVariants = variants.filter((v) => v.size.trim() && v.price);

      for (let i = 0; i < validVariants.length; i++) {
        const v = validVariants[i];
        let varImageUrl = v.imageUrl || "";

        if (v.imageFile) {
          const formData = new FormData();
          formData.append("image", v.imageFile);
          formData.append("type", "product");
          formData.append("productSlug", slug.trim());
          if (v.size.trim()) {
            formData.append("variantName", v.size.trim());
          }
          const uploadRes = await apiClient.post(`/api/v1/images/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
          varImageUrl = uploadRes.data?.data?.imageUrl || "";
        }

        uploadedVariants.push({
          size: v.size.trim(),
          price: parseFloat(v.price),
          offerPrice: v.offerPrice ? parseFloat(v.offerPrice) : null,
          sku: v.sku.trim(),
          sortOrder: i,
          imageUrl: varImageUrl || null,
        });
      }

      const body = {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || name.trim(),
        type: productType,
        imageUrl: finalMainImageUrl || "",
        thumbnailUrl: finalThumbnailUrl || finalMainImageUrl || "",
        season,
        stockStatus,
      };

      if (categorySlug) body.category = categorySlug;
      if (brandSlug) body.brand = brandSlug;

      if (productType === "simple") {
        body.price = parseFloat(price);
        body.offerPrice = offerPrice ? parseFloat(offerPrice) : null;
        body.sku = sku.trim();
      } else {
        body.variants = uploadedVariants;
      }

      await apiClient.post("/api/v1/products", body);
      toast.success("Product created successfully!");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      navigate("/dashboard/products");
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to create product.'));
    } finally {
      setIsCreating(false);
    }
  };

  const getFullPreviewUrl = (url) => {
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="space-y-1">
          <Link
            to="/dashboard/products"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to products
          </Link>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Add New Product
          </h2>
          <p className="text-sm text-muted-foreground">
            Create a simple or variant product for your catalog with rich details.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6"
      >
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold border-b pb-2">
              Basic Information
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Product Name</label>
              <Input
                required
                placeholder="e.g. Oud Imperial Perfume"
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
                  {slugManual ? "Auto-generate" : "Edit manually"}
                </button>
              </div>
              <Input
                required
                placeholder="oud-imperial-perfume"
                value={slug}
                onChange={(e) => {
                  setSlugManual(true);
                  setSlug(e.target.value);
                }}
                disabled={!slugManual}
                className={!slugManual ? "opacity-60" : ""}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Description</label>
              <RichTextEditor
                placeholder="Write a description for this product..."
                value={description}
                onChange={(val) => setDescription(val)}
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-semibold">Inventory & Pricing</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Variant Mode
                </span>
                <Switch
                  checked={productType === "variant"}
                  onCheckedChange={(checked) =>
                    setProductType(checked ? "variant" : "simple")
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 pb-4 border-b">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Stock Status *</label>
                <Select value={stockStatus} onValueChange={(val) => setStockStatus(val || "instock")}>
                  <SelectTrigger className="h-9 w-full cursor-pointer">
                    <SelectValue placeholder="Select stock status" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border shadow-md">
                    <SelectItem value="instock">In Stock</SelectItem>
                    <SelectItem value="outofstock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {productType === "simple" && (
              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">Price (৳) *</label>
                    <Input
                      type="number"
                      step="0.01"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">
                      Offer Price (৳)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={offerPrice}
                      onChange={(e) => setOfferPrice(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">SKU</label>
                    <Input
                      placeholder="SKU"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {productType === "variant" && (
              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-2 gap-4 items-end">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">Variation Type (Attribute Group)</label>
                    <Select
                      value={selectedAttributeGroup}
                      onValueChange={(val) => {
                        setSelectedAttributeGroup(val || "");
                        const modes = {};
                        variants.forEach((_, idx) => {
                          modes[idx] = "preset";
                        });
                        setVariantInputModes(modes);
                      }}
                    >
                      <SelectTrigger className="h-9 w-full cursor-pointer">
                        <SelectValue placeholder="Select type (e.g. Size, Volume)" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border shadow-md" side="bottom">
                        {attributeGroups.map((group) => (
                          <SelectItem key={group.slug} value={group.slug}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    {selectedAttributeGroup && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-9 text-xs gap-1"
                        onClick={addAllPresets}
                      >
                        Add All Presets
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 text-xs gap-1"
                      onClick={addVariant}
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Variation Row
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {variants.map((v, i) => {
                    const activeGroup = attributeGroups.find(g => g.slug === selectedAttributeGroup);
                    const presetValues = activeGroup ? activeGroup.values : [];

                    return (
                      <div
                        key={i}
                        className="grid grid-cols-[auto_1.8fr_1.2fr_1.2fr_1.5fr_auto] gap-3 items-end rounded-lg border border-border/80 p-3 bg-muted/20"
                      >
                        <div className="flex flex-col items-center gap-1.5 self-center pb-0.5">
                          <span className="text-[10px] font-semibold text-muted-foreground">Image</span>
                          <div className={`relative w-9 h-9 border rounded flex items-center justify-center cursor-pointer overflow-hidden group ${
                            v.imageError ? "border-destructive bg-destructive/10 text-destructive" : "hover:border-primary"
                          }`}>
                            {v.imagePreview ? (
                              <>
                                <img src={v.imagePreview} alt="variant" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateVariant(i, "imageFile", null);
                                    updateVariant(i, "imagePreview", "");
                                    updateVariant(i, "imageError", "");
                                  }}
                                  className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-3 h-3 text-white" />
                                </button>
                              </>
                            ) : (
                              <label htmlFor={`variant-image-${i}`} className="cursor-pointer p-2 text-muted-foreground hover:text-primary flex items-center justify-center w-full h-full">
                                <UploadCloud className={`w-4 h-4 ${v.imageError ? "text-destructive" : ""}`} />
                              </label>
                            )}
                            <input
                              type="file"
                              id={`variant-image-${i}`}
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => handleVariantImageSelect(i, e)}
                            />
                          </div>
                          {v.imageError && (
                            <p className="text-[10px] font-semibold text-destructive col-span-full mt-1 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {v.imageError}
                            </p>
                          )}
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-muted-foreground">
                            {activeGroup?.name || "Variation Value"}
                          </label>
                          {variantInputModes[i] !== "custom" && presetValues.length > 0 ? (
                            <Select
                              value={v.size}
                              onValueChange={(val) => {
                                if (val === "[custom]") {
                                  setVariantInputModes((prev) => ({ ...prev, [i]: "custom" }));
                                  updateVariant(i, "size", "");
                                } else {
                                  updateVariant(i, "size", val || "");
                                }
                              }}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Select value" />
                              </SelectTrigger>
                              <SelectContent>
                                {presetValues.map((pv) => (
                                  <SelectItem key={pv.slug} value={pv.name}>
                                    {pv.name}
                                  </SelectItem>
                                ))}
                                <SelectItem value="[custom]">
                                  + Custom / Type value...
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="flex gap-1 items-center">
                              <Input
                                required
                                placeholder="e.g. 50ml"
                                value={v.size}
                                onChange={(e) =>
                                  updateVariant(i, "size", e.target.value)
                                }
                                className="h-9"
                              />
                              {presetValues.length > 0 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-9 px-1 text-[10px] text-primary"
                                  onClick={() => {
                                    setVariantInputModes((prev) => ({ ...prev, [i]: "preset" }));
                                    updateVariant(i, "size", "");
                                  }}
                                >
                                  Presets
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-muted-foreground">
                            Price (৳) *
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            required
                            value={v.price}
                            onChange={(e) =>
                              updateVariant(i, "price", e.target.value)
                            }
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-muted-foreground">
                            Offer Price
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            value={v.offerPrice}
                            onChange={(e) =>
                              updateVariant(i, "offerPrice", e.target.value)
                            }
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-muted-foreground">
                            SKU
                          </label>
                          <Input
                            placeholder="SKU"
                            value={v.sku}
                            onChange={(e) =>
                              updateVariant(i, "sku", e.target.value)
                            }
                            className="h-9"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive self-end"
                          onClick={() => removeVariant(i)}
                          disabled={variants.length <= 1}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold border-b pb-2">
              Product Image
            </h3>

            <div className="space-y-3">
              {!imagePreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[160px] ${
                    mainImageError
                      ? "border-destructive bg-destructive/5 text-destructive"
                      : "border-border/80 hover:border-primary/50 hover:bg-muted/10"
                  }`}
                >
                  <UploadCloud className={`h-10 w-10 mb-2 ${mainImageError ? "text-destructive" : "text-muted-foreground"}`} />
                  <span className="text-xs font-medium block">
                    Upload Image
                  </span>
                  <span className="text-[10px] text-muted-foreground block mt-1">
                    PNG, JPG, WEBP up to 2MB
                  </span>
                  {mainImageError && (
                    <p className="text-xs font-semibold text-destructive mt-2.5 flex items-center justify-center gap-1.5 animate-in fade-in">
                      <AlertCircle className="h-4 w-4" />
                      {mainImageError}
                    </p>
                  )}
                </div>
              ) : (
                <div className="relative rounded-xl border overflow-hidden bg-muted/10 group min-h-[160px] flex items-center justify-center">
                  <img
                    src={
                      imagePreview.startsWith("blob:")
                        ? imagePreview
                        : getFullPreviewUrl(imagePreview)
                    }
                    alt="Uploaded Product Preview"
                    className="object-contain max-h-[180px] w-full"
                  />
                  {isUploading && (
                    <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                      <span className="text-xs font-semibold">
                        Uploading...
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={removeUploadedImage}
                    className="absolute top-2 right-2 bg-background/90 border rounded-full p-1.5 shadow-sm opacity-90 hover:opacity-100 hover:text-destructive transition-all"
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
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold border-b pb-2">
              Organization
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Category
              </label>
              <Select
                value={categorySlug || "__none__"}
                onValueChange={(val) =>
                  setCategorySlug(val === "__none__" || !val ? "" : val)
                }
              >
                <SelectTrigger className="w-full cursor-pointer">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md" side="bottom">
                  <SelectItem value="__none__">None</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.did} value={cat.slug}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Brand
                  </label>
                  {parentBrandSlug && (
                    <button
                      type="button"
                      onClick={() => {
                        setParentBrandSlug("");
                        setBrandSlug("");
                      }}
                      className="text-[11px] text-destructive hover:underline flex items-center gap-1 cursor-pointer"
                      title="Clear brand selection"
                    >
                      <X className="h-3 w-3" /> Clear
                    </button>
                  )}
                </div>
                <Select
                  value={parentBrandSlug || "__none__"}
                  onValueChange={(val) => {
                    const newParent = val === "__none__" || !val ? "" : val;
                    setParentBrandSlug(newParent);
                    setBrandSlug("");
                  }}
                >
                  <SelectTrigger className="w-full cursor-pointer">
                    <SelectValue placeholder="Select Brand (Niche, Designer...)" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border shadow-md" side="bottom">
                    <SelectItem value="__none__">None</SelectItem>
                    {parentBrands.map((pb) => (
                      <SelectItem key={pb.did || pb.slug} value={pb.slug || pb.did}>
                        {pb.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {parentBrandSlug && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Sub Brand
                  </label>
                  <Select
                    value={brandSlug || "__none__"}
                    onValueChange={(val) =>
                      setBrandSlug(val === "__none__" || !val ? "" : val)
                    }
                  >
                    <SelectTrigger className="w-full cursor-pointer">
                      <SelectValue placeholder="Select Sub Brand" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border shadow-md" side="bottom">
                      <SelectItem value="__none__">None</SelectItem>
                      {childBrands.length > 0
                        ? childBrands.map((cb) => (
                            <SelectItem key={cb.did || cb.slug} value={cb.slug || cb.did}>
                              {cb.name}
                            </SelectItem>
                          ))
                        : parentBrands
                            .filter((pb) => pb.slug === parentBrandSlug || pb.did === parentBrandSlug)
                            .map((pb) => (
                              <SelectItem key={pb.did || pb.slug} value={pb.slug || pb.did}>
                                {pb.name}
                              </SelectItem>
                            ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Season
              </label>
              <Select
                value={season}
                onValueChange={(val) => setSeason(val ?? "All-Season")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Season" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All-Season">All Season</SelectItem>
                  <SelectItem value="Summer">Summer</SelectItem>
                  <SelectItem value="Winter">Winter</SelectItem>
                  <SelectItem value="Spring">Spring</SelectItem>
                  <SelectItem value="Autumn">Autumn</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              type="submit"
              className="w-full"
              disabled={isCreating || isUploading}
            >
              {isCreating ? "Creating Product..." : "Save Product"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => { window.location.href = "/dashboard/products"; }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default NewProductPage;
