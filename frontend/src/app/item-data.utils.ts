import { ItemDto, Shop } from './game-data.service';

export function calculateTotalItemCost(
  item: ItemDto,
  itemById: ReadonlyMap<string, ItemDto>,
  memo = new Map<string, number>(),
  visiting = new Set<string>()
): number {
  const cached = memo.get(item.id);
  if (cached !== undefined) {
    return cached;
  }
  if (visiting.has(item.id)) {
    return 0;
  }

  const nextVisiting = new Set(visiting).add(item.id);
  const requirementsCost = item.requirements.reduce((total, requirement) => {
    const requiredItem = itemById.get(requirement.itemId);
    return requiredItem
      ? total + calculateTotalItemCost(requiredItem, itemById, memo, nextVisiting) * requirement.quantity
      : total;
  }, 0);
  const totalCost = item.price + requirementsCost;
  memo.set(item.id, totalCost);
  return totalCost;
}

export function itemShopNames(item: ItemDto, shopById: ReadonlyMap<string, Shop>): string[] {
  return item.shopIds
    .map((shopId) => shopById.get(shopId)?.name)
    .filter((name): name is string => name !== undefined);
}

export function shouldShowItemDescription(item: ItemDto): boolean {
  return item.bonuses.length === 0 && item.description.trim().length > 0;
}
