import type { Data, DataItem, Route } from '@/types';
import ofetch from '@/utils/ofetch';
import { parseDate } from '@/utils/parse-date';

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

async function handler(): Promise<Data> {
    const urls = [
        'https://www.starwars.com/_grill/more/news?r=1-4&l=24&o=0', // Featured News section
        'https://www.starwars.com/_grill/more/news?r=1-5&l=24&o=0', // Latest News section
        'https://www.starwars.com/_grill/more/news?r=1-6&l=24&o=0', // More News section
    ];

    const data = (
        await Promise.all(
            urls.map((url) =>
                ofetch(url, {
                    headers: {
                        accept: 'application/json',
                    },
                })
            )
        )
    ).flat();

    const items = data.map((item): DataItem & { summary?: string } => ({
        guid: item.id,
        title: item.title,
        link: item.href,
        summary: item.description,
        description: item.text_content?.main_content,
        pubDate: parseDate(item.content_date),
        author: item.authors?.map((author) => ({
            name: author.display_title || author.title,
            url: author.href,
            avatar: author.profile_image?.thumb_1x1?.src,
        })),
        category: item.category_labels ? Object.values<{ title: string; url: string }>(item.category_labels).map((label) => label.title) : undefined,
        image: item.featured_image?.base_src,
    }));

    return {
        title: 'StarWars.com News',
        link: 'https://www.starwars.com/news',
        description: 'Star Wars News, Articles & Quizzes',
        language: 'en',
        item: items,
    };
}
