import type { Data, DataItem, Route } from '@/types';
import ofetch from '@/utils/ofetch';
import { parseDate } from '@/utils/parse-date';

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

type MatterhornPage = {
    title: string;
    href: string;
    stack: Array<Record<string, any>>;
} & Record<string, any>;

const FEED_URL = 'https://press.disneyplus.com/_grill/json/news';
const FAVICON = 'https://static-mh.content.disney.io/matterhorn/assets/favicon-94e3862e7fb9.ico';

async function handler(): Promise<Data> {
    const data = await ofetch<MatterhornPage>(FEED_URL, {
        headers: {
            accept: 'application/json',
        },
    });

    const stacks = data?.stack?.filter((stack) => stack.type === 'articlepage')?.flatMap((stack) => stack.data);

    const items = stacks?.map(
        (item): DataItem => ({
            guid: item.id,
            title: item.title,
            link: item.href,
            description: item.description,
            pubDate: parseDate(item.content_date),
            author: item.authors?.map((author) => ({
                name: author.display_title || author.title,
                url: author.href,
                avatar: author.profile_image?.thumb_1x1?.src,
            })),
            category: item.category_labels ? Object.values<{ title: string; url: string }>(item.category_labels).map((label) => label.title) : undefined,
            image: item.featured_image?.base_src,
        })
    );

    return {
        title: 'Disney+ Press News',
        link: 'https://press.disneyplus.com/news',
        description: 'Disney+ Press News',
        language: 'en',
        item: items,
        image: FAVICON,
    };
}
