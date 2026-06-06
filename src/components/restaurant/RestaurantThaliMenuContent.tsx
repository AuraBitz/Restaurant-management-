import React, { useEffect, useState } from 'react';
import { countThaliItems, parseMenuCategories, thaliCoverImage } from '../../lib/menu-utils';
import { getPublicRestaurantMenus } from '../../services/api/menu.api';
import type { MenuItemRow, RestaurantThaliRow } from '../../types/menu';

interface RestaurantThaliMenuContentProps {
  restaurantId: number;
  onAddToCart: (item: { name: string; price: number; veg: boolean; image?: string }) => void;
}

const RestaurantThaliMenuContent: React.FC<RestaurantThaliMenuContentProps> = ({
  restaurantId,
  onAddToCart,
}) => {
  const [thalis, setThalis] = useState<RestaurantThaliRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedThali, setSelectedThali] = useState<RestaurantThaliRow | null>(null);

  useEffect(() => {
    setLoading(true);
    getPublicRestaurantMenus(restaurantId)
      .then((rows) => setThalis(rows))
      .catch(() => setThalis([]))
      .finally(() => setLoading(false));
  }, [restaurantId]);

  const handleAddItem = (item: MenuItemRow) => {
    onAddToCart({
      name: item.name,
      price: item.amount,
      veg: true,
      image: item.image || undefined,
    });
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-10 text-gray-500">
        Loading menu...
      </div>
    );
  }

  if (!thalis.length) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-10 text-center">
        <div className="text-5xl mb-3">🍽️</div>
        <p className="font-semibold text-gray-800">Menu not added yet</p>
        <p className="mt-1 text-sm text-gray-500">
          Restaurant owner can add thalis in Admin Panel → Menu Master
        </p>
      </div>
    );
  }

  if (!selectedThali) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6 rounded-xl border border-orange-200 bg-orange-50 p-4">
          <p className="font-semibold text-orange-900">Select a thali to explore dishes</p>
          <p className="text-sm text-orange-800 mt-1">Pehle thali choose karein, phir uske andar ka menu dekhein</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {thalis.map((thali) => {
            const cover = thaliCoverImage(thali);
            const itemCount = countThaliItems(thali);
            const categories = parseMenuCategories(thali.menu_items);
            return (
              <button
                key={thali.id}
                type="button"
                onClick={() => setSelectedThali(thali)}
                className="group overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-md transition hover:-translate-y-1 hover:border-orange-300 hover:shadow-xl"
              >
                <div className="relative h-44 overflow-hidden bg-gradient-to-br from-orange-100 to-amber-50">
                  {cover ? (
                    <img
                      src={cover}
                      alt={thali.restaurant_thali_name}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-6xl">🍱</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-lg font-bold text-white drop-shadow">
                      {thali.restaurant_thali_name}
                    </h3>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-600">
                    {categories.length} categories • {itemCount} dishes
                  </p>
                  <p className="mt-2 text-sm font-semibold text-orange-600 group-hover:text-orange-700">
                    View menu →
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const categories = parseMenuCategories(selectedThali.menu_items);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <button
          type="button"
          onClick={() => setSelectedThali(null)}
          className="mb-2 text-sm font-semibold text-orange-600 hover:text-orange-700"
        >
          ← All Thalis
        </button>
        <h3 className="text-2xl font-bold text-gray-900">{selectedThali.restaurant_thali_name}</h3>
        <p className="text-sm text-gray-600">{countThaliItems(selectedThali)} dishes available</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {categories.length === 0 ? (
          <p className="text-center text-gray-500 py-10">No dishes in this thali yet.</p>
        ) : (
          categories.map((category) => (
            <section key={`${category.id ?? category.title}`}>
              <h4 className="mb-4 border-b-2 border-orange-400 pb-2 text-xl font-bold text-gray-800">
                {category.title}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(category.items ?? []).map((item) => (
                  <div
                    key={`${item.id ?? item.name}`}
                    className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                  >
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-orange-50">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl">🍛</div>
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="font-bold text-gray-900">{item.name}</h5>
                          <span className="shrink-0 font-bold text-orange-600">₹{item.amount}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddItem(item)}
                        className="mt-2 w-full rounded-lg bg-orange-600 py-2 text-sm font-semibold text-white hover:bg-orange-700 transition"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
};

export default RestaurantThaliMenuContent;
