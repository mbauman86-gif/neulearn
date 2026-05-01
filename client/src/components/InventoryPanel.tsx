import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shirt, Sparkles, Image, PawPrint, Trophy, Package, Check, Crown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface InventoryItem {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  rarity: string;
  equipSlot?: string | null;
}

interface ChildInventoryItem {
  id: string;
  itemId: string;
  obtainedAt: string;
  obtainedVia: string;
  item: InventoryItem;
}

interface InventoryPanelProps {
  inventory: ChildInventoryItem[];
  equippedItems: Record<string, string | null>;
  onEquip?: (slot: string, itemSlug: string | null) => Promise<void>;
  compact?: boolean;
  className?: string;
}

const categoryIcons: Record<string, any> = {
  AVATAR_ACCESSORY: Shirt,
  STICKER: Sparkles,
  BACKGROUND: Image,
  PET: PawPrint,
  TROPHY: Trophy,
};

const categoryLabels: Record<string, string> = {
  AVATAR_ACCESSORY: "Accessories",
  STICKER: "Stickers",
  BACKGROUND: "Backgrounds",
  PET: "Pets",
  TROPHY: "Trophies",
};

const rarityColors: Record<string, string> = {
  COMMON: "border-slate-300 bg-slate-50 dark:bg-slate-800",
  UNCOMMON: "border-green-400 bg-green-50 dark:bg-green-900/20",
  RARE: "border-blue-400 bg-blue-50 dark:bg-blue-900/20",
  EPIC: "border-purple-400 bg-purple-50 dark:bg-purple-900/20",
  LEGENDARY: "border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20",
};

const rarityTextColors: Record<string, string> = {
  COMMON: "text-slate-600 dark:text-slate-400",
  UNCOMMON: "text-green-600 dark:text-green-400",
  RARE: "text-blue-600 dark:text-blue-400",
  EPIC: "text-purple-600 dark:text-purple-400",
  LEGENDARY: "text-amber-600 dark:text-amber-400",
};

function ItemCard({ 
  inventoryItem, 
  isEquipped, 
  onSelect,
  compact = false,
}: { 
  inventoryItem: ChildInventoryItem; 
  isEquipped: boolean;
  onSelect: () => void;
  compact?: boolean;
}) {
  const Icon = categoryIcons[inventoryItem.item.category] || Package;
  const rarityClass = rarityColors[inventoryItem.item.rarity] || rarityColors.COMMON;
  const rarityTextClass = rarityTextColors[inventoryItem.item.rarity] || rarityTextColors.COMMON;

  return (
    <motion.button
      className={cn(
        "relative rounded-xl border-2 transition-all hover-elevate active-elevate-2",
        rarityClass,
        isEquipped && "ring-2 ring-teal-500 ring-offset-2",
        compact ? "p-2" : "p-3"
      )}
      onClick={onSelect}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      data-testid={`item-${inventoryItem.item.slug}`}
    >
      {isEquipped && (
        <div className="absolute -top-2 -right-2 w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center shadow-md">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}
      
      <div className="flex flex-col items-center gap-2">
        <div className={cn(
          "rounded-full flex items-center justify-center",
          compact ? "w-10 h-10 bg-white/50 dark:bg-slate-700/50" : "w-14 h-14 bg-white/80 dark:bg-slate-700/80"
        )}>
          {inventoryItem.item.rarity === "LEGENDARY" ? (
            <Crown className={cn(compact ? "w-5 h-5" : "w-7 h-7", rarityTextClass)} />
          ) : (
            <Icon className={cn(compact ? "w-5 h-5" : "w-7 h-7", rarityTextClass)} />
          )}
        </div>
        
        {!compact && (
          <>
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300 text-center line-clamp-2">
              {inventoryItem.item.name}
            </span>
            <Badge variant="outline" className={cn("text-[10px]", rarityTextClass)}>
              {inventoryItem.item.rarity}
            </Badge>
          </>
        )}
      </div>
    </motion.button>
  );
}

export function InventoryPanel({
  inventory,
  equippedItems,
  onEquip,
  compact = false,
  className,
}: InventoryPanelProps) {
  const [selectedItem, setSelectedItem] = useState<ChildInventoryItem | null>(null);
  const [isEquipping, setIsEquipping] = useState(false);
  
  const categories = Array.from(new Set(inventory.map(i => i.item.category)));
  const itemsByCategory = categories.reduce((acc, cat) => {
    acc[cat] = inventory.filter(i => i.item.category === cat);
    return acc;
  }, {} as Record<string, ChildInventoryItem[]>);

  const handleEquip = async () => {
    if (!selectedItem || !onEquip || !selectedItem.item.equipSlot) return;
    
    setIsEquipping(true);
    try {
      const isCurrentlyEquipped = equippedItems[selectedItem.item.equipSlot] === selectedItem.itemId;
      await onEquip(
        selectedItem.item.equipSlot, 
        isCurrentlyEquipped ? null : selectedItem.item.slug
      );
      setSelectedItem(null);
    } finally {
      setIsEquipping(false);
    }
  };

  const isItemEquipped = (item: ChildInventoryItem) => {
    if (!item.item.equipSlot) return false;
    return equippedItems[item.item.equipSlot] === item.itemId;
  };

  if (inventory.length === 0) {
    return (
      <div className={cn("text-center py-8", className)} data-testid="inventory-empty">
        <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <p className="text-slate-500 dark:text-slate-400">No items collected yet!</p>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
          Complete lessons to earn rewards
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={cn("flex flex-wrap gap-2", className)} data-testid="inventory-compact">
        {inventory.slice(0, 6).map((item) => (
          <ItemCard
            key={item.id}
            inventoryItem={item}
            isEquipped={isItemEquipped(item)}
            onSelect={() => setSelectedItem(item)}
            compact
          />
        ))}
        {inventory.length > 6 && (
          <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              +{inventory.length - 6}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className={className} data-testid="inventory-panel">
        <Tabs defaultValue={categories[0] || "all"} className="w-full">
          <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-transparent p-0 mb-4">
            {categories.map((cat) => {
              const Icon = categoryIcons[cat] || Package;
              return (
                <TabsTrigger
                  key={cat}
                  value={cat}
                  className="gap-1.5 data-[state=active]:bg-teal-100 data-[state=active]:text-teal-700 dark:data-[state=active]:bg-teal-900/30 dark:data-[state=active]:text-teal-400"
                >
                  <Icon className="w-4 h-4" />
                  {categoryLabels[cat] || cat}
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">
                    {itemsByCategory[cat].length}
                  </Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>
          
          {categories.map((cat) => (
            <TabsContent key={cat} value={cat} className="mt-0">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                <AnimatePresence mode="popLayout">
                  {itemsByCategory[cat].map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <ItemCard
                        inventoryItem={item}
                        isEquipped={isItemEquipped(item)}
                        onSelect={() => setSelectedItem(item)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
      
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-sm">
          {selectedItem && (
            <>
              <DialogHeader className="items-center">
                <div className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center border-2",
                  rarityColors[selectedItem.item.rarity]
                )}>
                  {(() => {
                    const Icon = categoryIcons[selectedItem.item.category] || Package;
                    return selectedItem.item.rarity === "LEGENDARY" 
                      ? <Crown className={cn("w-10 h-10", rarityTextColors[selectedItem.item.rarity])} />
                      : <Icon className={cn("w-10 h-10", rarityTextColors[selectedItem.item.rarity])} />;
                  })()}
                </div>
                <DialogTitle className="text-center mt-3">
                  {selectedItem.item.name}
                </DialogTitle>
              </DialogHeader>
              
              <div className="text-center space-y-3">
                <p className="text-slate-600 dark:text-slate-400">
                  {selectedItem.item.description}
                </p>
                
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="capitalize">
                    {categoryLabels[selectedItem.item.category] || selectedItem.item.category}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={rarityTextColors[selectedItem.item.rarity]}
                  >
                    {selectedItem.item.rarity}
                  </Badge>
                </div>
                
                <p className="text-xs text-slate-500">
                  Obtained {new Date(selectedItem.obtainedAt).toLocaleDateString()}
                  {selectedItem.obtainedVia && ` via ${selectedItem.obtainedVia.replace('_', ' ').toLowerCase()}`}
                </p>
              </div>
              
              {selectedItem.item.equipSlot && onEquip && (
                <DialogFooter>
                  <Button
                    className="w-full"
                    onClick={handleEquip}
                    disabled={isEquipping}
                    variant={isItemEquipped(selectedItem) ? "outline" : "default"}
                  >
                    {isEquipping ? "..." : (
                      isItemEquipped(selectedItem) ? "Unequip" : "Equip"
                    )}
                  </Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
