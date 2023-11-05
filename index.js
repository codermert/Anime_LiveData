const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const seriesUrl = 'https://cizgimax.online/simpsonlar-turkce-izle/';

// Tüm bölümlerin ana video URL'lerini almak için
async function getAllEpisodeVideoLinks() {
    try {
        const response = await axios.get(seriesUrl);
        const $ = cheerio.load(response.data);

        const episodeLinks = [];

        // Ana URL
        const mainLink = seriesUrl;
        episodeLinks.push(mainLink);

        // Diğer bölümleri al
        const otherEpisodes = $('a.post-page-numbers');
        for (let i = 0; i < otherEpisodes.length; i++) {
            const episodeLink = $(otherEpisodes[i]).attr('href');
            const episodePage = await axios.get(episodeLink);
            const episodePageData = episodePage.data;
            const episode$ = cheerio.load(episodePageData);
            const iframeUrl = episode$('div.video-content iframe').attr('src');
            const iframeResponse = await axios.get(iframeUrl);
            const iframeSource = iframeResponse.data;
            let m3uLink = null;

            if (iframeUrl.includes("sibnet.ru")) {
                const regexResult = /player.src\(\[\{src: "([^"]+)"/.exec(iframeSource);
                if (regexResult) {
                    m3uLink = "https://video.sibnet.ru" + regexResult[1];
                }
            }

            if (m3uLink) {
                episodeLinks.push(m3uLink);
            }
        }

        return episodeLinks;
    } catch (error) {
        console.error(error);
        return [];
    }
}

getAllEpisodeVideoLinks()
    .then((links) => {
        fs.writeFile('video_links.json', JSON.stringify(links, null, 2), (err) => {
            if (err) {
                console.error('Hata:', err);
            } else {
                console.log('Linkler JSON dosyasına kaydedildi: video_links.json');
            }
        });
    })
    .catch((error) => {
        console.error(error);
    });
