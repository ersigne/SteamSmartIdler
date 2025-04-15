/** @typedef {import('../types/types').SteamAccount} SteamAccount */

const SteamUser = require("steam-user");
const SteamTotp = require('steam-totp');
const SteamStore = require('steamstore');

class SteamSmartIdler {
    /**
     * Creates a new instance of SteamIdler
     * @param {SteamAccount} account - Steam Account
     * @param {Number[]} freeLicenses - SubID's of free Steam Limited Time Free to Keep packages
     */
    constructor(account, freeLicenses) {
        this.username = account.username;
        this.password = account.password;
        this.shared_secret = account.shared_secret;
        this.limited = account.limited;
        this.status = account.status;
        this.games = account.games;
        this.freeLicenses = freeLicenses;
        this.sessionID = null;
        this.cookies = null;
        this.client = new SteamUser();
        this.store = new SteamStore();
        this.toIdle = this.getRandomGamesToPlay();
        this.timetable = this.getRandomTimeTable();
        this.isPlaying = false;
        this.isConnected = false;
    }

    #setEvents() {
        this.client.on('disconnected', (eresult, msg) => {
            this.isConnected = false;
            console.error(`${this.username} - Disconnected. Error: ${msg}`);
        });
        this.client.on('loggedOn', (details, parental) => {
            this.isConnected = true;
            console.log(`${this.username} - Reconnected`);
        });
    }

    async #waitForLoggedOn() {
        return new Promise((resolve, reject) => {
            this.client.once('loggedOn', async () => {
                console.log(`${this.username} - Logged in`);
                await this.client.setPersona(this.status);
                this.isConnected = true;
                resolve();
            });
            this.client.once('error', (err) => reject(err));
        })
    }

    async #waitForWebSession() {
        return new Promise((resolve, reject) => {
            this.client.once('webSession', (sessionID, cookies) => {
                this.sessionID = sessionID;
                this.cookies = cookies;
                this.store.setCookies(this.cookies);
                resolve();
            });
            this.client.once('error', (err) => reject(err));
        })
    }

    async #login() {
        this.client.on('error', (err) => console.error(`${this.username} - Error: ${err?.message}`));

        if (this.shared_secret) this.client.logOn({ accountName: this.username, password: this.password, twoFactorCode: SteamTotp.generateAuthCode(this.shared_secret)});
        else this.client.logOn({ accountName: this.username, password: this.password });
        
        try { 
            await this.#waitForLoggedOn();
            await this.#waitForWebSession();
        }
        catch (error) { console.error(`${this.username} - Login error: ${error?.message}`); }
    }

    #addFreeLicenses() {
        for (const subID of this.freeLicenses) {
            this.store.addFreeLicense(subID, (err) => {
                if (err) console.error(`${this.username} - Add Free License error: ${err}`);
                else console.log(`${this.username} - Added Free License`);
            });
        }
    }

    async updateGameStatus() {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        //console.log(`Current Time -> ${currentHour}:${currentMinute}`);
        if (this.isConnected) {
            const isWithinPlayTime =
                (currentHour > this.timetable[0] || (currentHour === this.timetable[0] && currentMinute >= this.timetable[1])) &&
                (currentHour < this.timetable[2] || (currentHour === this.timetable[2] && currentMinute < this.timetable[3]));

            if (isWithinPlayTime && !this.isPlaying) {
                // Start playing if inside the playtime
                console.log(`${this.username} - Gaming Session started. Playing <${this.toIdle}>.`);
                this.isPlaying = true;
                await this.client.gamesPlayed(this.toIdle);
                
            } else if (!isWithinPlayTime && this.isPlaying) {
                // Stop playing if outside the playtime
                await this.client.gamesPlayed([]);
                this.isPlaying = false;
                this.timetable = this.getRandomTimeTable();
                this.toIdle = this.getRandomGamesToPlay();
                console.log(`${this.username} - Gaming Session ended, waiting for the next session.`);
            }
        }
    }

    getRandomTimeTable() {
        const playStartHourUTC = Math.floor(Math.random() * 24); // Random hour (0-23)
        const playStartMinute = Math.floor(Math.random() * 60); // Random minute (0-59)
        let playEndHourUTC = playStartHourUTC + Math.floor(Math.random() * 2) + 1; // 1-2 hours later
        let playEndMinute = playStartMinute + Math.floor(Math.random() * 11); // 0-10 minutes later

        if (playEndMinute >= 60) {
            playEndMinute -= 60;
            playEndHourUTC = (playEndHourUTC + 1) % 24;
        }
        
        /*const timeDiff = 6;
        const playStartHourCET = (playStartHourUTC + timeDiff ) % 24;
        const playEndHourCET = (playEndHourUTC + timeDiff) % 24;
        const playStartHourString = (playStartHourCET < 10 && playStartHourCET >= 0) ? "0"+playStartHourCET : playStartHourCET;
        const playEndHourString = (playEndHourCET < 10 && playEndHourCET >= 0) ? "0"+playEndHourCET : playEndHourCET;
        const playStartMinString = (playStartMinute < 10 && playStartMinute >= 0) ? "0"+playStartMinute : playStartMinute;
        const playEndMinString = (playEndMinute < 10 && playEndMinute >= 0) ? "0"+playEndMinute : playEndMinute;
        console.log(`${this.username} Timetable -> Start: ${playStartHourString}:${playStartMinString} | End: ${playEndHourString}:${playEndMinString}`);
        */
        return [playStartHourUTC, playStartMinute, playEndHourUTC, playEndMinute];
    }

    getRandomGamesToPlay() {
        //Games between 1 to Last since at index 0 there is cs2 which we already selected
        return [this.games[0], this.games[Math.floor(Math.random() * (this.games.length - 1)) + 1]]
    }

    async #idle() {
        if (!this.limited) {
            await this.client.gamesPlayed(730);
        } else {
            console.log(`[${this.username}] - Games to play next: ${this.toIdle}`);
            setInterval(async () => {
                await this.updateGameStatus();
            }, 30 * 1000); // Runs every 30 seconds
        }
    }

    async start() {
        await this.#login();
        this.#setEvents();
        await this.#addFreeLicenses();
        await this.#idle();
    }
}

module.exports = SteamSmartIdler;