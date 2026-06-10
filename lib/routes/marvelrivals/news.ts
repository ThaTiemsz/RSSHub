import { load } from 'cheerio';

import type { Data, DataItem, Route } from '@/types';
import ofetch from '@/utils/ofetch';
import { parseDate } from '@/utils/parse-date';

export const route: Route = {
    path: '/news',
    categories: ['blog'],
    example: '/marvelrivals/news',
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
            source: ['marvelrivals.com/news/'],
            target: '/news',
        },
    ],
    name: 'News Feed',
    maintainers: ['Tiemen'],
    handler,
};

const FEED_URL = 'https://www.marvelrivals.com/news/';
const FAVICON = 'https://www.marvelrivals.com/pc/gw/20241128194803/691ca74fc8dfda4c11d8.ico';

function parseCategory(category?: string): string | undefined {
    switch (category) {
        case 'announcements':
            return 'Announcements';
        case 'devdiaries':
            return 'Dev Diaries';
        case 'gameupdate':
            return 'Game Update';
        case 'balancepost':
            return 'Balance Post';
        default:
            return category;
    }
}

async function handler(): Promise<Data> {
    const response = await ofetch(FEED_URL);
    const $ = load(response);

    const items = $('.page-list .cont-box a.list-item')
        .toArray()
        .map((item) => {
            const $item = $(item);
            const link = $item.attr('href');
            const title = $item.find('.text h2')?.text();
            const description = $item.find('.text p')?.text();
            const image = $item.find('img')?.attr('src');

            const match = link?.match(/\.com\/(\w+)\/(\d{8})\//);
            const category = parseCategory(match?.[1]);
            const pubDate = match?.[2] ? parseDate(match[2]) : undefined;

            return {
                title,
                link,
                description,
                pubDate,
                category: category ? [category] : undefined,
                image,
            } satisfies DataItem;
        });

    return {
        title: 'Marvel Rivals News',
        link: 'https://www.marvelrivals.com/news',
        description: 'Marvel Rivals News',
        language: 'en',
        item: items,
        image: FAVICON,
    };
}
