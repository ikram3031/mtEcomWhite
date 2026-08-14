import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, UploadCloud, X, Layers } from "lucide-react";

export const ProductDataCard = ({
  productType,
  setProductType,
  price,
  setPrice,
  offerPrice,
  setOfferPrice,
  chargeTax,
  setChargeTax,
  taxRate,
  setTaxRate,
  variants,
  attributeGroups,
  selectedAttributeGroup,
  setSelectedAttributeGroup,
  addAllPresets,
  addVariant,
  removeVariant,
  updateVariant,
  handleVariantImageSelect,
  getFullPreviewUrl,
}) => {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3.5">
        <div>
          <h3 className="text-sm font-bold text-foreground">Product Data</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Configure pricing, tax, and variation modes for this product.
          </p>
        </div>

        <div className="w-full sm:w-52">
          <Select
            value={productType || "__none__"}
            onValueChange={(val) =>
              setProductType(val === "__none__" ? "" : val)
            }
          >
            <SelectTrigger className="h-9 w-full cursor-pointer bg-background">
              <SelectValue placeholder="Product Type" />
            </SelectTrigger>
            <SelectContent className="bg-popover border shadow-md">
              <SelectItem value="__none__">Select Product Type</SelectItem>
              <SelectItem value="simple">Simple Product</SelectItem>
              <SelectItem value="variant">Variable Product</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Empty State / Unselected Placeholder */}
      {(!productType || productType === "__none__") && (
        <div className="border-2 border-dashed border-border/80 rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[140px] bg-muted/10">
          <Layers className="h-8 w-8 text-muted-foreground/60 mb-2" />
          <span className="text-xs font-semibold text-foreground block">
            No Product Type Selected
          </span>
          <span className="text-[11px] text-muted-foreground block mt-1 max-w-sm">
            Please choose <strong>Simple Product</strong> or{" "}
            <strong>Variable Product</strong> from the dropdown above to setup
            prices and inventory.
          </span>
        </div>
      )}

      {/* Accordion Content: Simple Product */}
      {productType === "simple" && (
        <div className="space-y-4 pt-1 animate-in fade-in slide-in-from-top-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2.5">
              <label className="text-xs font-semibold text-muted-foreground block">
                Base Price (৳) *
              </label>
              <Input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="space-y-2.5">
              <label className="text-xs font-semibold text-muted-foreground block">
                Discounted Price (৳)
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="chargeTax"
                checked={chargeTax || false}
                onChange={(e) => setChargeTax(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
              />
              <label
                htmlFor="chargeTax"
                className="text-xs font-semibold text-foreground cursor-pointer"
              >
                Charge tax on this product
              </label>
            </div>

            {chargeTax && (
              <div className="space-y-2.5 max-w-xs pl-6 animate-in fade-in">
                <label className="text-xs font-semibold text-muted-foreground block">
                  Tax Rate (%)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 5 or 7.5"
                  value={taxRate || ""}
                  onChange={(e) => setTaxRate(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Accordion Content: Variable Product */}
      {productType === "variant" && (
        <div className="space-y-5 pt-1 animate-in fade-in slide-in-from-top-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end bg-muted/20 p-4 rounded-lg border border-border/80">
            <div className="space-y-2.5">
              <label className="text-xs font-semibold text-foreground block">
                Variation Type (Attribute Group)
              </label>
              <Select
                value={selectedAttributeGroup}
                onValueChange={(val) => setSelectedAttributeGroup(val || "")}
              >
                <SelectTrigger className="h-9 w-full cursor-pointer bg-background">
                  <SelectValue placeholder="Select type (e.g. Size)" />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md">
                  {attributeGroups.map((group) => (
                    <SelectItem key={group.slug} value={group.slug}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
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
                className="h-9 text-xs gap-1 bg-background"
                onClick={addVariant}
              >
                <Plus className="h-3.5 w-3.5" /> Add Variation Row
              </Button>
            </div>
          </div>

          {/* Formatted Variation Rows */}
          <div className="space-y-4">
            {variants.map((v, i) => (
              <div
                key={i}
                className="relative rounded-xl border border-border bg-card p-4 shadow-sm space-y-3.5 transition-all hover:border-primary/40"
              >
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-xs font-bold text-foreground">
                    Variation #{i + 1} {v.size ? `(${v.size})` : ""}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeVariant(i)}
                    disabled={variants.length <= 1}
                    title="Remove variation"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Row 1: Size & SKU */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-muted-foreground block">
                      Size / Option Value *
                    </label>
                    <Input
                      placeholder="e.g. 50ml, Medium, Red"
                      value={v.size}
                      onChange={(e) => updateVariant(i, "size", e.target.value)}
                      className="h-9"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-muted-foreground block">
                      SKU
                    </label>
                    <Input
                      placeholder="e.g. OUD-50ML"
                      value={v.sku}
                      onChange={(e) => updateVariant(i, "sku", e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>

                {/* Row 2: Price & Offer Price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-muted-foreground block">
                      Regular Price (৳) *
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={v.price}
                      onChange={(e) => updateVariant(i, "price", e.target.value)}
                      className="h-9"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-muted-foreground block">
                      Offer Price (৳)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={v.offerPrice}
                      onChange={(e) =>
                        updateVariant(i, "offerPrice", e.target.value)
                      }
                      className="h-9"
                    />
                  </div>
                </div>

                {/* Row 3: Image Thumbnail */}
                <div className="space-y-2 pt-2 border-t">
                  <label className="text-[11px] font-semibold text-muted-foreground block">
                    Variation Image (Optional, Max 2MB)
                  </label>
                  <div className="flex items-center gap-3">
                    <div
                      className={`relative w-12 h-12 border rounded-lg flex items-center justify-center cursor-pointer overflow-hidden group bg-muted/10 ${
                        v.imageError
                          ? "border-destructive bg-destructive/10 text-destructive"
                          : "hover:border-primary"
                      }`}
                    >
                      {v.imagePreview ? (
                        <>
                          <img
                            src={
                              v.imagePreview.startsWith("http") ||
                              v.imagePreview.startsWith("blob:")
                                ? v.imagePreview
                                : getFullPreviewUrl(v.imagePreview)
                            }
                            alt="variant"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              updateVariant(i, "imageFile", null);
                              updateVariant(i, "imagePreview", "");
                              updateVariant(i, "imageError", "");
                            }}
                            className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4 text-white" />
                          </button>
                        </>
                      ) : (
                        <label
                          htmlFor={`variant-image-${i}`}
                          className="cursor-pointer p-2 text-muted-foreground hover:text-primary flex items-center justify-center w-full h-full"
                        >
                          <UploadCloud className="w-5 h-5" />
                        </label>
                      )}
                      <input
                        type="file"
                        id={`variant-image-${i}`}
                        onChange={(e) => handleVariantImageSelect(i, e)}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {v.imagePreview
                        ? "Image uploaded"
                        : "Click icon to upload variant image"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
