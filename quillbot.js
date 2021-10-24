const puppeteer = require('puppeteer');
const axios = require('axios');


class QuillBot {
    constructor(debugPort) {
        this.browser = false;
        this.page = false;
        this.debugWsUrl = null;
        this.debugPort = debugPort;
    }

    async paraphrase(query, lang = 'en') {
        try {
            this.page = await this.connect();
            const type = query.type;

            let result = {};

            switch (type) {
                case 'standard':
                    result = this.standard(query.text);
                    break;
                case 'fluency':
                    result = this.fluency(query.text);
                    break;
                case 'creative':
                    result = this.creative(query.text);
                    break;
                case 'creativeplus':
                    result = this.creativePlus(query.text);
                    break;
                case 'formal':
                    result = this.formal(query.text);
                    break;
                case 'shorten':
                    result = this.shorten(query.text);
                    break;
                case 'expand':
                    result = this.expand(query.text);
                    break;
            }

            return result;
        } catch (err) {
            console.log(err);
        }

        return [];
    }

    async standard(text) {
        const paraTypeSelector = '#quillTopControls > div:nth-child(2) > div > div:nth-child(2) > div > div:nth-child(1) > button';

        const summarizedText = await this.summarize(text);
        console.log('Summarized Text: \n', summarizedText, '\n\n');

        const result = await this.executeParaType(summarizedText, paraTypeSelector);

        return result;
    }

    async fluency(text) {
        const paraTypeSelector = '#quillTopControls > div:nth-child(2) > div > div:nth-child(2) > div > div:nth-child(2) > button';

        const result = await this.executeParaType(text, paraTypeSelector);

        return result;
    }

    async creative(text) {
        const paraTypeSelector = '#quillTopControls > div:nth-child(2) > div > div:nth-child(2) > div > div:nth-child(3) > button';

        const result = await this.executeParaType(text, paraTypeSelector);

        return result;
    }

    async creativePlus(text) {
        const paraTypeSelector = '#quillTopControls > div:nth-child(2) > div > div:nth-child(2) > div > div:nth-child(4) > button';

        const result = await this.executeParaType(text, paraTypeSelector);

        return result;
    }

    async formal(text) {
        const paraTypeSelector = '#quillTopControls > div:nth-child(2) > div > div:nth-child(2) > div > div:nth-child(5) > button';

        const result = await this.executeParaType(text, paraTypeSelector);

        return result;
    }

    async shorten(text) {
        const paraTypeSelector = '#quillTopControls > div:nth-child(2) > div > div:nth-child(2) > div > div:nth-child(6) > button';

        const result = await this.executeParaType(text, paraTypeSelector);

        return result;
    }

    async expand(text) {
        const paraTypeSelector = '#quillTopControls > div:nth-child(2) > div > div:nth-child(2) > div > div:nth-child(7) > button';

        const result = await this.executeParaType(text, paraTypeSelector);

        return result;
    }

    async executeParaType(text, paraTypeSelector) {
        const paraSelector = '#__next > div:nth-child(2) > div.MuiGrid-root.MuiGrid-item > header > div > div:nth-child(1) > div > div > button:nth-child(1)';
        const inputSelector = '#inputText';
        const btnSelector = '#InputBottomQuillControl > div > div > div > div:nth-child(2) > div > div > div > div > button';
        const resultSelector = '#outputText';

        console.log('Text: \n', text, '\n\n');

        await this.navigateToFunction(paraSelector);
        await this.navigateToFunction(paraTypeSelector);
        const paraphrasedText = await this.executeFunction(text, inputSelector, btnSelector, resultSelector);
        const result = this.grammerCheck(paraphrasedText);

        return result;
    }

    async summarize(text) {

        const sumSelector = '#__next > div:nth-child(2) > div.MuiGrid-root.MuiGrid-item > header > div > div:nth-child(1) > div > div > button:nth-child(3)';
        const inputSelector = '#inputBoxSummarizer';
        const btnSelector = '#__next > div:nth-child(2) > div:nth-child(2) > div > div > div.MuiContainer-root > div > div > div > div:nth-child(2) > div.MuiGrid-container > div:nth-child(1) > div > div > div:nth-child(2) > div > div > div > button';
        const resultSelector = '#outputBoxSummarizer';

        await this.navigateToFunction(sumSelector);
        const result = await this.executeFunction(text, inputSelector, btnSelector, resultSelector);
        console.log('sumirize result', result)

        return result;
    }

    async grammerCheck(text) {
        console.log('grammerChkText', text)
        const gramSelector = '#__next > div:nth-child(2) > div.MuiGrid-root.MuiGrid-item > header > div > div:nth-child(1) > div > div > button:nth-child(2)';
        const inputSelector = '#grammarbot';
        const spinnerSelector = '#__next > div:nth-child(2) > div:nth-child(2) > div > div > div.MuiContainer-root > div > div > div > div > div:nth-child(3) > div > div:nth-child(1) > p';
        const btnSelector = '#__next > div:nth-child(2) > div:nth-child(2) > div > div > div.MuiContainer-root > div > div > div > div > div:nth-child(3) > div > div:nth-child(2) > div > button';
        const resultSelector = inputSelector;

        await this.navigateToFunction(gramSelector);

        // Wait for load then type text
        console.log('Grammer Check: ', text, '\n');

        // wait for element to render
        await this.page.waitForSelector(inputSelector);
        // wait for content to load
        await this.page.waitForFunction((inputSelector) =>
            document.querySelector(inputSelector).hasChildNodes() &&
            document.querySelector(inputSelector)
            .firstElementChild.tagName.toLowerCase() == 'p', {
                timeout: 60000
            }, inputSelector);

        await this.clearAndTypeContent(text, inputSelector);

        // Wait for GrammerChecker to finish
        await this.page.waitForFunction(btnSelector => {
            return document.querySelector(btnSelector).firstElementChild.children[1].style.visibility === 'hidden';
        }, {
            timeout: 60000
        }, btnSelector);

        const fixErrorsElm = await this.page.$(btnSelector);
        const hasErrors = await fixErrorsElm.evaluate(btn => btn.getAttribute('disabled'));
        if (hasErrors === null || hasErrors === '') {
            // Click to fix errors
            await this.page.evaluate(btnSelector => document.querySelector(btnSelector).click(), btnSelector);
        }

        const result = await this.extractResult(resultSelector);

        return result;
    }

    async navigateToFunction(selector) {
        // Navigate to function
        await this.page.evaluate(selector => document.querySelector(selector).click(), selector);
        console.log('backToNavigate')
    }

    async clearAndTypeContent(text, inputSelector) {
        console.log('clearAndTypeContent', text);
        await this.page.waitForTimeout(500);
        const inputElm = await this.page.$(inputSelector);
        await inputElm.hover(inputSelector);

        // Clear text content
        await this.page.evaluate((inputSelector) => document.querySelector(inputSelector).innerText = '', inputSelector);
        await inputElm.type(text);
    }

    async extractResult(resultSelector) {
        // Extract result
        const resultElm = await this.page.$(resultSelector);
        return await resultElm.evaluate(res => res.textContent);
    }

    async executeFunction(text, inputSelector, btnSelector, resultSelector) {
        console.log('executefunctionText', text)
        // Wait for load then type text
        await this.page.waitForSelector(inputSelector);

        await this.clearAndTypeContent(text, inputSelector);

        // Click to start function
        await this.page.evaluate(btnSelector => document.querySelector(btnSelector).click(), btnSelector);

        // Wait for function finish
        await this.page.waitForFunction((btnSelector, resultSelector) => {
            return document.querySelector(btnSelector).classList.contains('Mui-disabled') == false &&
                document.querySelector(resultSelector).textContent !== '';
        }, {
            timeout: 60000
        }, btnSelector, resultSelector);
        await this.page.waitForTimeout(500);

        const result = await this.extractResult(resultSelector);

        return result;
    }

    async connect() {
        const res = await axios.get(`http://127.0.0.1:9222/json/version`);
        this.debugWsUrl = res.data.webSocketDebuggerUrl;


        this.browser = await puppeteer.connect({
            browserWSEndpoint: this.debugWsUrl
        });
        console.log(await this.browser.version(), '\n');

        const pages = await this.browser.pages();
        if (pages.length > 0) {
            const page = pages[0];
            await page.setViewport({
                width: 1366,
                height: 768
            });

            return page;
        }


        return null;
    }

    async disconnect() {
        if (this.browser)
            this.browser.disconnect();
    }
}

module.exports = QuillBot;