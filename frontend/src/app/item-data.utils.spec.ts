import { ItemDto, Shop } from './game-data.service';
import { calculateTotalItemCost, itemShopNames, shouldShowItemDescription } from './item-data.utils';

describe('item data helpers', () => {
  it('calculates nested total costs with quantities', () => {
    const base = item('base', 100);
    const component = item('component', 50, [{ itemId: 'base', quantity: 2 }]);
    const finalItem = item('final', 200, [{ itemId: 'component', quantity: 3 }]);
    const items = new Map([base, component, finalItem].map((entry) => [entry.id, entry]));

    expect(calculateTotalItemCost(finalItem, items)).toBe(950);
  });

  it('stops recursive cycles safely', () => {
    const first = item('first', 100, [{ itemId: 'second', quantity: 1 }]);
    const second = item('second', 200, [{ itemId: 'first', quantity: 1 }]);
    const items = new Map([first, second].map((entry) => [entry.id, entry]));

    expect(calculateTotalItemCost(first, items)).toBe(300);
  });

  it('maps shop ids to readable shop names', () => {
    const selectedItem = { ...item('item', 100), shopIds: ['shop-one', 'missing'] };
    const shops = new Map<string, Shop>([
      ['shop-one', { id: 'shop-one', name: 'Arcane Vault' }]
    ]);

    expect(itemShopNames(selectedItem, shops)).toEqual(['Arcane Vault']);
  });

  it('hides descriptions whenever bonus chips are available', () => {
    const selectedItem = {
      ...item('figurine', 100),
      bonuses: ['+5 Intelligence'],
      description: 'Grants stats. Backstab also reduces enemy armor.'
    };

    expect(shouldShowItemDescription(selectedItem)).toBe(false);
  });

  it('shows descriptions for items without bonus chips', () => {
    const selectedItem = {
      ...item('special', 100),
      bonuses: [],
      description: 'A unique item description.'
    };

    expect(shouldShowItemDescription(selectedItem)).toBe(true);
  });
});

function item(
  id: string,
  price: number,
  requirements: ItemDto['requirements'] = []
): ItemDto {
  return {
    id,
    name: id,
    itemClass: 'Test',
    price,
    bonuses: [],
    description: '',
    range: null,
    stats: {},
    requirements,
    shopIds: [],
    iconUrl: ''
  };
}
