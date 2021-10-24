const express = require('express');
const bodyParser = require('body-parser');

const QuillBot = require('./quillbot');

const validateAuthKey = require('./auth');
const config = require('./config.json');

const PORT = config.serverPort || 5200;

(async () => {
    try {
        // Start the server
        console.log('Starting the server...\n');

        const app = express();
        app.use(express.json());
        app.use(express.urlencoded({ extended: false }));

        const bot = new QuillBot(config.debugPort);
        process.on('exit', () => {
            console.log('Exit');
        });


        app.post('/api/v1/paraphrase', async (req, res) => {
            console.log('Request: ', req.body, '\n\n');

            try {
                const value = await bot.paraphrase(req.body);
                return res.status(200).send({
                    success: 'true',
                    type: req.body.type,
                    text: req.body.text,
                    result: value
                });
            } catch (err) {
                console.log(err);
                return res.status(500).send({
                    success: 'false'
                });
            }
        });

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`, '\n');
        });
    } catch (err) {
        console.log(err);
    }
})();

