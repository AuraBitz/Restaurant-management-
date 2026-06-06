import { RouteConfig } from "../../types/route";
import Home from "../../pages/Home";
import Restaurants from "../../pages/find-restaurants/Restaurants";
import RestaurantDetail from "../../pages/restaurant-detail/RestaurantDetail";
import CurrentRestaurant from "../../pages/current-restaurant/CurrentRestaurant";

export const routes: RouteConfig[] = [
  {
    path: '/',
    key: 'home',
    element: Home,
    islayout: false,
    isProtected: false,
  },
  {
    path: '/restaurants',
    key: 'restaurants',
    element: Restaurants,
    islayout: false,
    isProtected: false,
  },
  {
    path: '/restaurant/:id',
    key: 'restaurant-detail',
    element: RestaurantDetail,
    islayout: false,
    isProtected: false,
  },
  {
    path: '/current-restaurant',
    key: 'current-restaurant',
    element: CurrentRestaurant,
    islayout: false,
    isProtected: false,
  },
];

export default routes;
