const axios = require('axios');
const cheerio = require('cheerio');
const Utils = require('./Utils');
const { QueryRewardItems } = require('../types/enum');

let instance = null;

class Requester {
    constructor() {
        if (!instance) {
            instance = this;
            this.platform = Utils.generatePlatform();
        }
        return instance;
    }

    getInstance() {
        return this;
    }

    async fetchFreeSteamGames() {
        try {
            const response = await axios.get('https://store.steampowered.com/search/results/', {
                params: {
                    specials: 1,
                    maxprice: 'free',
                    category1: 998
                },
                headers: {
                    'Accept': 'text/ javascript, text/ html, application / xml, text / xml, */*',
                    'Accept-Language': 'en-US,en;q=0.9,en;q=0.8',
                    'Cache-Control': 'max-age=0',
                    'Connection': 'keep-alive',
                    'Cookie': 'bGameHighlightAudioEnabled=true; wants_mature_content=1; mature_content=1; lastagecheckage=1-January-1900; birthtime=-729000000; timezoneName=; timezoneOffset=; flGameHighlightPlayerVolume=1.25; steamCountry=; sessionid=; steamLoginSecure=; deep_dive_carousel_focused_app=; deep_dive_carousel_method=cluster_playtime',
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'same-origin',
                    'Sec-Fetch-User': '?1',
                    'Upgrade-Insecure-Requests': '1',
                    'User-Agent': this.platform.useragent,
                    'sec-ch-ua': this.platform.secChUABrand,
                    'sec-ch-ua-mobile': this.platform.secChUAMobile,
                    'sec-ch-ua-platform': `"${this.platform.os}"`
                }
            });
            const html = cheerio.load(response.data);
            const freeGames = this.#parseFreeSteamGames(html);
            const freeGamesSubIDs = await this.fetchFreeSteamGameSubIDs(freeGames);
            return freeGamesSubIDs;
        }
        catch (error) {
            console.error('Error while fetching Free To Keep for a limited time games TEST:', error);
            return null;
        }
    }

    #parseFreeSteamGames(cheeriohtml) {
        const searchResultRows = cheeriohtml('.search_result_row');
        const gameDictionary = {};

        searchResultRows.each((i, element) => {
            const $element = cheeriohtml(element);
            const titleElement = $element.find('.title');
            const title = titleElement.text().trim();
            const appid = $element.attr('data-ds-appid');

            if (title && appid) {
                gameDictionary[title] = appid;
            }
        });

        return gameDictionary;
    }

    async fetchFreeSteamGameSubIDs(games) {
        let freeGameSubIDs = {};
        for (const [name, AppId] of Object.entries(games)) {
            try {
                const response = await axios.get(`https://store.steampowered.com/app/${AppId}`, {
                    headers: {
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Cache-Control': 'max-age=0',
                        'Connection': 'keep-alive',
                        'Cookie': 'bGameHighlightAudioEnabled=true; wants_mature_content=1; mature_content=1; lastagecheckage=1-January-1900; birthtime=-729000000; timezoneName=; timezoneOffset=; flGameHighlightPlayerVolume=1.25; steamCountry=; sessionid=; steamLoginSecure=; deep_dive_carousel_focused_app=; deep_dive_carousel_method=cluster_playtime',
                        'Sec-Fetch-Dest': 'document',
                        'Sec-Fetch-Mode': 'navigate',
                        'Sec-Fetch-Site': 'same-origin',
                        'Sec-Fetch-User': '?1',
                        'Upgrade-Insecure-Requests': '1',
                        'User-Agent': this.platform.useragent,
                        'sec-ch-ua': this.platform.secChUABrand,
                        'sec-ch-ua-mobile': this.platform.secChUAMobile,
                        'sec-ch-ua-platform': `"${this.platform.os}"`
                    }
                });
                const html = cheerio.load(response.data);
                const freeGameSubID = this.#parseFreeSteamGameSubID(html);
                if (freeGameSubID > 0) freeGameSubIDs[name] = freeGameSubID;
            }
            catch (error) {
                console.error('Error fetching Free To Keep game SubID:', error);
            }
        }
        return freeGameSubIDs;
    }

    #parseFreeSteamGameSubID(cheeriohtml) {
        let ret = -1;
        cheeriohtml('.game_area_purchase_game_wrapper').each((i, elem) => {
            const wrapper = cheeriohtml(elem);
            const discountPctElement = wrapper.find('.discount_pct');

            if (discountPctElement.text() === "-100%") {
                const subIdElement = Number(wrapper.find('input[name="subid"]').attr('value'));
                if (subIdElement) ret = subIdElement;
                return false; //break out of .each
            }
        });
        return ret;
    }

    async fetchFreePointsShopItems() {
        let cursor = '';
        let allfreeItems = [];
        //let counter = 1;
        do {
            try {
                const response = await axios.get('https://api.steampowered.com/ILoyaltyRewardsService/QueryRewardItems/v1/', {
                    params: {
                        cursor: cursor,
                        language: 'en',
                        // Usually all free bundles come with a free avatar frame, so to optimize the search 
                        // we filter for avatar frames and then search for other free items in the same bundle as the frame(same AppID)
                        ['community_item_classes[0]']: QueryRewardItems.CommunityItemClasses.AVATAR_FRAMES,
                        //['community_item_classes[1]']: QueryRewardItems.CommunityItemClasses.ANIMATED_STICKERS,
                        //['community_item_classes[2]']: QueryRewardItems.CommunityItemClasses.ANIMATED_AVATAR
                    },
                    headers: {
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                        'Accept-Language': 'en-US,en;q=0.9,en;q=0.8',
                        'Cache-Control': 'max-age=0',
                        'Connection': 'keep-alive',
                        'Cookie': 'bGameHighlightAudioEnabled=true; wants_mature_content=1; mature_content=1; lastagecheckage=1-January-1900; birthtime=-729000000; timezoneName=; timezoneOffset=; flGameHighlightPlayerVolume=1.25; steamCountry=; sessionid=; steamLoginSecure=; deep_dive_carousel_focused_app=; deep_dive_carousel_method=cluster_playtime',
                        'Sec-Fetch-Dest': 'document',
                        'Sec-Fetch-Mode': 'navigate',
                        'Sec-Fetch-Site': 'same-origin',
                        'Sec-Fetch-User': '?1',
                        'Upgrade-Insecure-Requests': '1',
                        'User-Agent': this.platform.useragent,
                        'sec-ch-ua': this.platform.secChUABrand,
                        'sec-ch-ua-mobile': this.platform.secChUAMobile,
                        'sec-ch-ua-platform': `"${this.platform.os}"`
                    }
                });
                const data = response.data?.response;
                if (data && data.definitions && data.definitions.length > 0) {
                    const items = data.definitions;
                    const freeitems = items.filter(item => item.point_cost === '0' && !allfreeItems.includes(item));
                    cursor = data.next_cursor || '';
                    //const total_items = data.total_count;
                    allfreeItems.push(...freeitems);
                    //console.log(`${counter}. Fetched ${freeitems.length} free items from ${items.length} items, cursor: ${cursor}, total: ${total_items}`);
                    //counter++;
                }
                else break;

            }
            catch (error) {
                console.error('Error while fetching Free Points Shop Items:', error);
                return null;
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        while (cursor);
        const uniqueAppIds = new Set();
        allfreeItems.forEach(item => uniqueAppIds.add(item.appid));
        const appIDs = [...uniqueAppIds];
        for (const appID of appIDs) {
            let cursor2 = '';
            do {
                try {
                    const response = await axios.get('https://api.steampowered.com/ILoyaltyRewardsService/QueryRewardItems/v1/', {
                        params: {
                            cursor: cursor2,
                            language: 'en',
                            ['appids[0]']: appID
                        },
                        headers: {
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                            'Accept-Language': 'en-US,en;q=0.9,en;q=0.8',
                            'Cache-Control': 'max-age=0',
                            'Connection': 'keep-alive',
                            'Cookie': 'bGameHighlightAudioEnabled=true; wants_mature_content=1; mature_content=1; lastagecheckage=1-January-1900; birthtime=-729000000; timezoneName=; timezoneOffset=; flGameHighlightPlayerVolume=1.25; steamCountry=; sessionid=; steamLoginSecure=; deep_dive_carousel_focused_app=; deep_dive_carousel_method=cluster_playtime',
                            'Sec-Fetch-Dest': 'document',
                            'Sec-Fetch-Mode': 'navigate',
                            'Sec-Fetch-Site': 'same-origin',
                            'Sec-Fetch-User': '?1',
                            'Upgrade-Insecure-Requests': '1',
                            'User-Agent': this.platform.useragent,
                            'sec-ch-ua': this.platform.secChUABrand,
                            'sec-ch-ua-mobile': this.platform.secChUAMobile,
                            'sec-ch-ua-platform': `"${this.platform.os}"`
                        }
                    });
                    const data = response.data?.response;
                    if (data && data.definitions && data.definitions.length > 0) {
                        const items = data.definitions;
                        const freeitems = items.filter(item => item.point_cost === '0' && !allfreeItems.includes(item));
                        cursor2 = data.next_cursor || '';
                        //const total_items = data.total_count;
                        allfreeItems.push(...freeitems);
                        //console.log(`Fetched ${freeitems.length} free items from ${items.length} items, cursor: ${cursor2}, total: ${total_items}, AppID: ${appID}`);
                    }
                    else break;

                }
                catch (error) {
                    console.error('Error while fetching Free Points Shop Items from AppIDs:', error);
                    return null;
                }
            }
            while (cursor2);
        }
        return allfreeItems;
    }

    async addFreeSteamPointsShopItems(freeitems, access_token, cookies) {
        const cookieObject = Object.fromEntries(
            cookies.map(cookie => cookie.split('='))
        );
        let redeemedItems = [];
        for (const defid of freeitems) {
            try {
                const response = await axios.post('https://api.steampowered.com/ILoyaltyRewardsService/RedeemPoints/v1/', null, {
                    params: {
                        access_token: access_token,
                        defid: defid
                    },
                    headers: {
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                        'Accept-Language': 'en-US,en;q=0.9,en;q=0.8',
                        'Cache-Control': 'max-age=0',
                        'Connection': 'keep-alive',
                        'Cookie': `bGameHighlightAudioEnabled=true; wants_mature_content=1; mature_content=1; lastagecheckage=1-January-1900; birthtime=-729000000; timezoneName=; timezoneOffset=; flGameHighlightPlayerVolume=1.25; steamCountry=; sessionid=${cookieObject.sessionid}; steamLoginSecure=${cookieObject.steamLoginSecure}; deep_dive_carousel_focused_app=; deep_dive_carousel_method=cluster_playtime`,
                        'Sec-Fetch-Dest': 'document',
                        'Sec-Fetch-Mode': 'navigate',
                        'Sec-Fetch-Site': 'cross-site',
                        'Origin': null,
                        'Sec-Fetch-User': '?1',
                        'Upgrade-Insecure-Requests': '1',
                        'User-Agent': this.platform.useragent,
                        'sec-ch-ua': this.platform.secChUABrand,
                        'sec-ch-ua-mobile': this.platform.secChUAMobile,
                        'sec-ch-ua-platform': `"${this.platform.os}"`
                    }
                });
                const data = response.data.response;
                //if (response.headers['x-eresult'] === '29') console.log('Already owned');
                //if (response.headers['x-eresult'] === '1') console.log('Added successfully!');
                if (data && data.communityitemid) {
                    redeemedItems.push(defid);
                }
            }
            catch (error) {
                console.error('Error while fetching Free Points Shop Items from AppIDs:', error.response?.data);
                return null;
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        return redeemedItems;
    }

    async fetchAccessToken(cookies) {
        const cookieObject = Object.fromEntries(
            cookies.map(cookie => cookie.split('='))
        );
        try {
            const response = await axios.get('https://store.steampowered.com/pointssummary/ajaxgetasyncconfig', {
                headers: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                    'Accept-Language': 'en-US,en;q=0.9,en;q=0.8',
                    'Cache-Control': 'max-age=0',
                    'Connection': 'keep-alive',
                    'Cookie': `bGameHighlightAudioEnabled=true; wants_mature_content=1; mature_content=1; lastagecheckage=1-January-1900; birthtime=-729000000; timezoneName=; timezoneOffset=; flGameHighlightPlayerVolume=1.25; steamCountry=; sessionid=${cookieObject.sessionid}; steamLoginSecure=${cookieObject.steamLoginSecure}; deep_dive_carousel_focused_app=; deep_dive_carousel_method=cluster_playtime`,
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'none',
                    'Sec-Fetch-User': '?1',
                    'Upgrade-Insecure-Requests': '1',
                    'User-Agent': this.platform.useragent,
                    'sec-ch-ua': this.platform.secChUABrand,
                    'sec-ch-ua-mobile': this.platform.secChUAMobile,
                    'sec-ch-ua-platform': `"${this.platform.os}"`
                }
            });
            const rdata = response.data;
            if (rdata.success && rdata.data.webapi_token) {
                return rdata.data.webapi_token;
            }
        }
        catch (error) {
            console.error('Error while fetching Steam Web API Access Token:', error);
            return null;
        }
        return null;
    }

    //Requester class end
}

module.exports = new Requester();