import { load } from 'cheerio';

import type { Data, DataItem, Route } from '@/types';
import ofetch from '@/utils/ofetch';
import { parseDate } from '@/utils/parse-date';

export const route: Route = {
    path: '/news',
    categories: ['blog'],
    example: '/kineticgames/news',
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
            source: ['kineticgames.co.uk/news'],
            target: '/news',
        },
    ],
    name: 'News Feed',
    maintainers: ['Tiemen'],
    handler,
};

const FEED_URL = 'https://www.kineticgames.co.uk/news';
const FAVICON = 'https://www.kineticgames.co.uk/apple-touch-icon.png';

async function handler(): Promise<Data> {
    const response = await ofetch(FEED_URL, { responseType: 'text' });
    const $ = load(response);

    const items = $('.latest-post-grid a.post-preview')
        .toArray()
        .map((item) => {
            const $item = $(item);
            const link = $item.attr('href');
            const title = $item.find('.post-title')?.text();
            const image = $item.find('img')?.attr('src');

            const date = $item.find('.published-date')?.attr('datetime');
            const pubDate = date ? parseDate(date) : undefined;
            const category = $item.find('.game span')?.text();

            return {
                title,
                link,
                pubDate,
                image,
                category: category ? [category] : undefined,
            } satisfies DataItem;
        });

    return {
        title: 'Kinetic Games News',
        link: 'https://www.kineticgames.co.uk/news',
        description: 'Kinetic Games and Phasmophobia News',
        language: 'en',
        item: items,
        image: FAVICON,
    };
}
