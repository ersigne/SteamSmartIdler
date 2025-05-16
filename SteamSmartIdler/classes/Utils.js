/** @typedef {import('../types/types').TimeTable} TimeTable */

const useragents = require('../constants/useragents');

class Utils {
    /**
     * Generates a random TimeTable with a session that lasts between HoursMin and HoursMax hours and between MinutesMin and MinutesMax minutes.
     * @param {Number} HoursMin - The minimum time range between the start hour and the end hour of the session
     * @param {Number} HoursMax - The maximum time range between the start hour and the end hour of the session
     * @param {Number} MinutesMin - The minimum time range between the start minutes and the end minutes of the session (0-60)
     * @param {Number} MinutesMax - The maximum time range between the start minutes and the end minutes of the session (0-60)
     * @returns {TimeTable} - A list of 4 numbers representing [ playStartHour, playStartMinute, playEndHour, playEndMinute ]
     */
    static getRandomTimeTable(HoursMin, HoursMax, MinutesMin, MinutesMax) {
        if (HoursMin > HoursMax || MinutesMin > MinutesMax || MinutesMin < 0 || MinutesMin > 59 || MinutesMax < 0 || MinutesMax > 59) return [];

        const playStartHour = Math.floor(Math.random() * 24); // Random hour (0-23)
        const playStartMinute = Math.floor(Math.random() * 60); // Random minute (0-59)
        
        let playEndHour = (playStartHour + Math.floor(Math.random() * (HoursMax - HoursMin + 1)) + HoursMin) % 24;
        let playEndMinute = playStartMinute + Math.floor(Math.random() * (MinutesMax - MinutesMin + 1)) + MinutesMin;
        //let playEndHour = playStartHour + Math.floor(Math.random() * 2) + 1; // 1-2 hours later
        //let playEndMinute = playStartMinute + Math.floor(Math.random() * 11); // 0-10 minutes later

        if (playEndMinute > 59) {
            playEndMinute -= 60;
            playEndHour = (playEndHour + 1) % 24;
        }

        return [playStartHour, playStartMinute, playEndHour, playEndMinute];
    }

    /**
     * @param {TimeTable} timetable - A list of 4 numbers representing [ playStartHour, playStartMinute, playEndHour, playEndMinute ]
     * @param {Number} timediff - A number representing the time difference to add/subntract to the timetable. Useful for when you host on a server in a different timezone than yours.
     */
    static printTimeTable(username, timetable, timediff = 0) {
        if (!timetable || timetable.length != 4) return;
        const playStartHour = (timetable[0] + timediff) % 24
        const playEndHour = (timetable[2] + timediff) %24;
        const playStartMinute = timetable[1];
        const playEndMinute = timetable[3];
        const playStartHourString = (playStartHour < 10 && playStartHour >= 0) ? "0" + playStartHour : playStartHour;
        const playEndHourString = (playEndHour < 10 && playEndHour >= 0) ? "0" + playEndHour : playEndHour;
        const playStartMinString = (playStartMinute < 10 && playStartMinute >= 0) ? "0" + playStartMinute : playStartMinute;
        const playEndMinString = (playEndMinute < 10 && playEndMinute >= 0) ? "0" + playEndMinute : playEndMinute;
        console.log(`${username} - Timetable: [ Start: ${playStartHourString}:${playStartMinString} | End: ${playEndHourString}:${playEndMinString} ]`);
    }

    /**
     * Returns a list of *random appIDs (* appIDs[0] is ALWAYS INCLUDED)
     * @param {Number[]} appIDs - A list containing the AppID's of the games to idle. The game at index 0 will be always played along with another randomly selected AppID.
     * @returns {Number[]} - A list containing at index 0 the appIDs[0] element, and another randomly selected appID.
     */
    static getRandomGamesToPlay(appIDs) {
        return [appIDs[0], appIDs[Math.floor(Math.random() * (appIDs.length - 1)) + 1]]
    }

    /**
     * Returns a random platform with os, browser, useragent taken from useragents.js
     */
    static generatePlatform() {
        const oss = Object.keys(useragents);
        const os = oss[Math.floor(Math.random() * oss.length)];
        const browsers = Object.keys(useragents[os]);
        const browser = browsers[Math.floor(Math.random() * browsers.length)];
        const usragents = useragents[os][browser];
        const useragent = usragents[Math.floor(Math.random() * usragents.length)];

        const userAgentParts = useragent.match(/(Chrome|Firefox|Edge|Safari|Internet Explorer)\/?(\s?(\d+)\.(\d+)(\.(\d+))?)?/);
        let browserVersionForCHUA;
        if (userAgentParts && userAgentParts[3]) {
            browserVersionForCHUA = userAgentParts[3];
        }
        let secChUABrand = "";
        switch (browser) {
            case "Chrome":
                secChUABrand = `"Google Chrome";v="${browserVersionForCHUA || '135'}", "Not-A.Brand";v="8", "Chromium";v="${browserVersionForCHUA || '135'}"`;
                break;
            case "Firefox":
                secChUABrand = `"Firefox";v="${browserVersionForCHUA || '88'}"`;
                break;
            case "Edge":
                secChUABrand = `"Microsoft Edge";v="${browserVersionForCHUA || '86'}"`;
                break;
            case "Safari":
                secChUABrand = `"Safari";v="${browserVersionForCHUA || '14'}"`; // Approximate Safari version
                break;
            case "Internet Explorer":
                secChUABrand = `"IE";v="${browserVersionForCHUA || '11'}"`; // Approximate IE version
                break;
            default:
                secChUABrand = `"Unknown";v="1"`;
        }

        const isMobile = os === "Android" || os === "iOS" ? "?1" : "?0";
        
        return {
            os: os,
            browser: browser,
            useragent: useragent,
            secChUABrand: secChUABrand,
            secChUAMobile: isMobile
        };
    }
}

module.exports = Utils;