import type { Data, DataItem, Route } from '@/types';
import ofetch from '@/utils/ofetch';
import { parseDate } from '@/utils/time';

export const route: Route = {
    path: '/news',
    categories: ['blog'],
    example: '/disneyplus-press/news',
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
            source: ['press.disneyplus.com/news'],
            target: '/news',
        },
    ],
    name: 'News Feed',
    maintainers: ['Tiemen'],
    handler,
};

type DisneyPlusAuthor = {
    display_title?: string;
    title?: string;
    href?: string;
    content_url?: string;
    url?: string;
    profile_image?: {
        thumb_1x1?: {
            src?: string;
        };
    };
    image_assets?: {
        thumb_images?: {
            thumb_1x1?: string;
            thumb_1x1_https?: string;
        };
    };
};

type DisneyPlusCategory = {
    title?: string;
};

type DisneyPlusNewsItem = {
    id: string;
    title: string;
    description?: string;
    content_date?: string;
    href?: string;
    content_url?: string;
    content_path?: string;
    url?: string;
    featured_image?: {
        base_src?: string;
    };
    primary_image_url?: string;
    secure_image_url?: string;
    image_assets?: {
        featured_image_16x9?: string;
        featured_image_16x9_https?: string;
        desktop_16x9?: string;
        desktop_16x9_https?: string;
    };
    authors?: DisneyPlusAuthor[];
    inc_categories?: {
        primary?: DisneyPlusCategory[];
        secondary?: DisneyPlusCategory[];
    };
    inc_tags?: DisneyPlusCategory[];
    category_labels?: Record<string, string>;
};

type DisneyPlusNewsResponse = {
    home: {
        stack: Array<{
            type: string;
            module_data: {
                data?: DisneyPlusNewsItem[];
            };
        }>;
    };
};

const FEED_URL = 'https://press.disneyplus.com/news?filter=&limit=24&offset=0&_xhr=pageContent';
const FAVICON = 'https://static-mh.content.disney.io/matterhorn/assets/favicon-94e3862e7fb9.ico';

function getNewsLink(item: DisneyPlusNewsItem): string | undefined {
    const url = item.content_url || item.url || item.href;
    if (url) {
        return url.replace('https://press.disneyplus.com/https:/', 'https://');
    }
    return item.content_path?.startsWith('/news/') ? `https://press.disneyplus.com${item.content_path}` : item.content_path?.startsWith('/https:/') ? `https://${item.content_path.slice('/https:/'.length)}` : undefined;
}

function getNewsCategories(item: DisneyPlusNewsItem): string[] | undefined {
    const categories = [
        ...(item.category_labels ? Object.values(item.category_labels).map((category) => category.trim()) : []),
        ...(item.inc_categories?.primary?.map((category) => category.title) || []),
        ...(item.inc_categories?.secondary?.map((category) => category.title) || []),
        ...(item.inc_tags?.map((category) => category.title) || []),
    ].filter((category): category is string => Boolean(category));

    return categories.length ? [...new Set(categories)] : undefined;
}

async function handler(): Promise<Data> {
    const data = await ofetch<DisneyPlusNewsResponse>(FEED_URL, {
        headers: {
            accept: 'application/json',
        },
    });

    const newsItems = new Map(data.home.stack.flatMap((section) => section.module_data.data ?? []).map((item) => [item.id, item])).values().toArray();

    const items = newsItems.map((item): DataItem => ({
        guid: item.id,
        title: item.title,
        link: getNewsLink(item),
        description: item.description,
        pubDate: item.content_date ? parseDate(item.content_date) : undefined,
        author: item.authors?.map((author) => ({
            name: author.display_title || author.title || 'Disney+',
            url: author.content_url || author.url || author.href,
            avatar: author.image_assets?.thumb_images?.thumb_1x1_https || author.image_assets?.thumb_images?.thumb_1x1 || author.profile_image?.thumb_1x1?.src,
        })),
        category: getNewsCategories(item),
        image:
            item.featured_image?.base_src ||
            item.primary_image_url ||
            item.secure_image_url ||
            item.image_assets?.featured_image_16x9_https ||
            item.image_assets?.featured_image_16x9 ||
            item.image_assets?.desktop_16x9_https ||
            item.image_assets?.desktop_16x9,
    }));

    return {
        title: 'Disney+ Press News',
        link: 'https://press.disneyplus.com/news',
        description: 'Disney+ Press News',
        language: 'en',
        item: items,
        image: FAVICON,
    };
}
