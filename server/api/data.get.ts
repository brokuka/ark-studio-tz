import type { RestaurantData } from '~~/shared/types';


export default defineEventHandler(async () => {
	const data = await useStorage('assets:server').getItem<RestaurantData>(`data.json`)

	return data
})