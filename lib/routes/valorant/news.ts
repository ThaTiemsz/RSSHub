import { load } from 'cheerio';

import type { Data, DataItem, Route } from '@/types';
import ofetch from '@/utils/ofetch';
import { parseDate } from '@/utils/parse-date';

export const route: Route = {
    path: '/news',
    categories: ['blog'],
    example: '/valorant/news',
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
            source: ['playvalorant.com/news'],
            target: '/news',
        },
    ],
    name: 'News Feed',
    maintainers: ['Tiemen'],
    handler,
};

const FEED_URL = 'https://playvalorant.com/news';
const FAVICON = 'https://cmsassets.rgpub.io/sanity/images/dsfx7636/news/cbf4460132cdfeb2a97fad5f9dd25ba0bc058f76-128x128.png?accountingTag=VAL';

async function handler(): Promise<Data> {
    const response = await ofetch(FEED_URL, { responseType: 'text' });
    const $ = load(response);

    const data = JSON.parse($('script#__NEXT_DATA__')?.text() ?? '{}');
    const pageItems = data?.props?.pageProps?.page?.blades?.find((blade) => blade?.type === 'articleCardGrid')?.items;

    const newsItems = pageItems?.map((item) => {
        const action = item?.action;
        let url = action?.payload?.url;
        if (url && url.startsWith('/')) {
            url = `https://playvalorant.com${url}`;
        }

        const categories: string[] = [];
        if (item.category?.title) {
            categories.push(item.category.title);
        }
        if (item.action?.type) {
            categories.push(item.action.type);
        }
        if (url.includes('youtube.com') && !categories.includes('youtube_video')) {
            categories.push('youtube_video');
            if (categories.includes('weblink')) {
                categories.splice(categories.indexOf('weblink'), 1);
            }
        }

        return {
            title: item.title,
            description: item.description?.body,
            link: url,
            pubDate: parseDate(item.publishedAt),
            image: item.imageMedia?.url,
            category: categories.length > 0 ? categories : undefined,
        } satisfies DataItem;
    });

    return {
        title: 'Valorant News',
        link: 'https://playvalorant.com/news',
        description: 'Valorant News',
        language: 'en',
        item: newsItems,
        image: FAVICON,
    };
}
