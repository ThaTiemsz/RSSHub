import { load } from 'cheerio';

import type { Data, DataItem, Route } from '@/types';
import cache from '@/utils/cache';
import ofetch from '@/utils/ofetch';
import { parseDate } from '@/utils/time';

export const route: Route = {
    path: '/news',
    categories: ['blog'],
    example: '/starwars/news',
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
            source: ['starwars.com/news'],
            target: '/news',
        },
    ],
    name: 'News Feed',
    maintainers: ['Tiemen'],
    handler,
};

type StarWarsAuthor = {
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

type StarWarsCategory = {
    title?: string;
};

type StarWarsNewsItem = {
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
    authors?: StarWarsAuthor[];
    inc_categories?: {
        primary?: StarWarsCategory[];
        secondary?: StarWarsCategory[];
    };
    inc_tags?: StarWarsCategory[];
    category_labels?: Record<string, StarWarsCategory>;
};

type StarWarsNewsResponse = {
    home: {
        classicModuleApi: {
            data: StarWarsNewsItem[];
        };
    };
};

function getNewsLink(item: StarWarsNewsItem): string | undefined {
    if (item.content_url || item.url || item.href) {
        return item.content_url || item.url || item.href;
    }
    return item.content_path ? `https://www.starwars.com${item.content_path.startsWith('/') ? item.content_path : `/${item.content_path}`}` : undefined;
}

function getNewsCategories(item: StarWarsNewsItem): string[] | undefined {
    const categories = [
        ...(item.inc_categories?.primary?.map((category) => category.title) || []),
        ...(item.inc_categories?.secondary?.map((category) => category.title) || []),
        ...(item.inc_tags?.map((category) => category.title) || []),
        ...(item.category_labels ? Object.values(item.category_labels).map((category) => category.title) : []),
    ].filter((category): category is string => Boolean(category));

    return categories.length ? [...new Set(categories)] : undefined;
}

async function getFavicon() {
    return await cache.tryGet(
        'starwars-news-favicon',
        async () => {
            const response = await ofetch('https://www.starwars.com');
            const $ = load(response);
            const faviconUrl = $('link[rel="shortcut icon"], link[rel="icon"]')?.attr('href');
            if (faviconUrl) {
                return faviconUrl.startsWith('http') ? faviconUrl : '';
            }
            return '';
        },
        60 * 60 * 24 * 30
    ); // Cache for 30 days
}

async function handler(): Promise<Data> {
    const urls = [
        'https://www.starwars.com/news?filter=&mod=4&limit=24&offset=0&_xhr=pageContent', // Featured News section
        'https://www.starwars.com/news?filter=&mod=5&limit=24&offset=0&_xhr=pageContent', // Latest News section
        'https://www.starwars.com/news?filter=&mod=6&limit=24&offset=0&_xhr=pageContent', // More News section
    ];

    const responses = await Promise.all(
        urls.map((url) =>
            ofetch<StarWarsNewsResponse>(url, {
                headers: {
                    accept: 'application/json',
                },
            })
        )
    );
    const data = responses.flatMap((response) => response.home.classicModuleApi.data);

    const items = new Map(data.map((item) => [item.id, item]))
        .values()
        .toArray()
        .map((item): DataItem => ({
            guid: item.id,
            title: item.title,
            link: getNewsLink(item),
            description: item.description,
            pubDate: item.content_date ? parseDate(item.content_date) : undefined,
            author: item.authors?.map((author) => ({
                name: author.display_title || author.title || 'StarWars.com',
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
        title: 'StarWars.com News',
        link: 'https://www.starwars.com/news',
        description: 'Star Wars News, Articles & Quizzes',
        language: 'en',
        item: items,
        image: await getFavicon(),
    };
}
