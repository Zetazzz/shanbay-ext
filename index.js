const puppeteer = require('puppeteer');

//please create user's own config file {user:'', pass:''} and import here
const config = require('./config.js')
const readline = require('readline-promise');
const {
    getCollection,
    initDB,
    getDB
} = require('lokijs-promise')

// await initDB('english.json', 1000)

const rlp = readline.default.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true
});

puppeteer.launch({
    headless: false
}).then(async browser => {
    const page = await browser.newPage();
    await page.goto('https://web.shanbay.com/web/account/login/');

    console.log('connected.')

    await page.waitForSelector('#input-account')
    await page.type('#input-account', config.user, {
        // delay: 100
    });
    await page.waitForSelector('#input-password')
    await page.type('#input-password', config.pass, {
        // delay: 100
    });
    await page.waitForSelector('#button-login')
    await page.click('#button-login')

    await page.waitForNavigation()

    let keepChecking = true;

    while (keepChecking) {
        await page.goto('https://www.shanbay.com/bdc/spotcheck/');

        await page.waitForSelector('#spotcheck-test > ul')
        let words = await page.$$('#spotcheck-test > ul > li')

        let currentCount = 0;

        while (true) {
            if (currentCount < 0) {
                currentCount = 0;
            }

            let wordEl = words[currentCount];
            let wordText = await wordEl.$eval('label', node => node.innerText)

            let checked = await wordEl.$eval('label > input', c => c.checked)

            //make the font of checking words green.
            console.log('\x1b[32m%s\x1b[0m', `${wordText.trim()}`);
            let answer = await rlp.questionAsync(`Remember? [y]es or (n)o or (d)ictionary or (p)revious : `)
            if (answer.trim() === 'n') {
                if (!checked) {
                    await wordEl.click();
                }
            } else if (answer.trim() === 'd') {
                console.log('webster maybe.')
                continue;
            } else if (answer.trim() === 'p') {
                currentCount -= 1;
                continue;
            }

            currentCount++;

            if (currentCount >= words.length) {
                let answer = await rlp.questionAsync(`One set more? (y)es or [n]o or (p)revious : `);

                if (answer.trim() === 'y') {
                    break;
                } else if (answer.trim() === 'p') {
                    currentCount -= 1;
                    continue;
                }

                keepChecking = false;
                break;
            }
        }

        //submit and save word list
        let remembered = [];
        let forgotten = [];

        for (n in words) {
            let wordEl = words[n];
            let wordText = await wordEl.$eval('label', node => node.innerText)

            let checked = await wordEl.$eval('label > input', c => c.checked)

            if (checked) {
                forgotten.push(wordText.trim());
            } else {
                remembered.push(wordText.trim());
            }
        }

        //save word list
        

        //submit
        if (forgotten.length != 0) {
            await page.waitForSelector('#submit-spotcheck');
            await page.click('#submit-spotcheck');

            await page.waitForNavigation()
        }
    }

    // await browser.close();
});
