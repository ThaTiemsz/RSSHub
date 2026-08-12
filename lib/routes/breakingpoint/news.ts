import type { Data, DataItem, Route } from '@/types';
import ofetch from '@/utils/ofetch';
import { parseDate } from '@/utils/parse-date';

export const route: Route = {
    path: '/news',
    categories: ['blog'],
    example: '/breakingpoint/news',
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    radar: [
        {
            source: ['breakingpoint.gg/news'],
            target: '/news',
        },
    ],
    name: 'News Feed',
    maintainers: ['Tiemen'],
    handler,
};

type BreakingPointNewsItem = {
    id: number;
    title: string;
    slug: string;
    published_at?: string;
    image?: string;
    icon_image?: string;
    post_categories_category?: Array<{
        post_categories?: {
            category_name?: string;
        };
    }>;
    post_tags_tag?: Array<{
        post_tags?: {
            tag_name?: string;
        };
    }>;
} & Record<string, any>;

const FEED_URL = 'https://breakingpoint.gg/api/news/get-news-by-month';

async function handler(): Promise<Data> {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    const [currentMonthItems, previousMonthItems] = await Promise.all([getMonthItems(currentMonth, currentYear), getMonthItems(previousMonth, previousYear)]);

    const items = [...new Map([...currentMonthItems, ...previousMonthItems].map((item) => [item.id, item])).values()]
        .toSorted((left, right) => new Date(right.published_at ?? 0).getTime() - new Date(left.published_at ?? 0).getTime())
        .map((item) => mapItem(item));

    return {
        title: 'Breaking Point News',
        link: 'https://breakingpoint.gg/news',
        description: 'Breaking Point news feed',
        language: 'en',
        item: items,
    };
}

function getMonthItems(month: number, year: number): Promise<BreakingPointNewsItem[]> {
    return ofetch<BreakingPointNewsItem[]>(`${FEED_URL}?month=${month}&year=${year}`, {
        headers: {
            accept: 'application/json',
        },
    });
}

function mapItem(item: BreakingPointNewsItem): DataItem {
    const categories = [
        ...(item.post_categories_category?.map((category) => category.post_categories?.category_name).filter(Boolean) ?? []),
        ...(item.post_tags_tag?.map((tag) => tag.post_tags?.tag_name).filter(Boolean) ?? []),
    ] as string[];

    return {
        guid: item.id.toString(),
        title: item.title,
        link: `https://breakingpoint.gg/posts/${item.slug}`,
        pubDate: parseDate(item.published_at!),
        category: [...new Set(categories)],
        image: item.image,
    };
}
