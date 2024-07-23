const { Builder, By } = require('selenium-webdriver');
const crypto = require('crypto');
const fs = require('fs');

const algorithm = 'aes-256-cbc';
const iv = crypto.randomBytes(16);

// Load or generate encryption key
let key;
if (!fs.existsSync('/tmp/key.key')) {
    key = crypto.randomBytes(32);
    fs.writeFileSync('/tmp/key.key', key);
} else {
    key = fs.readFileSync('/tmp/key.key');
}

function encrypt(text) {
    let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

async function createAccount(username, password, email) {
    let driver = await new Builder().forBrowser('chrome').build();

    try {
        await driver.get('https://scratch.mit.edu/join');

        await driver.findElement(By.name('username')).sendKeys(username);
        await driver.findElement(By.name('password')).sendKeys(password);
        await driver.findElement(By.name('password-confirmation')).sendKeys(password);
        await driver.findElement(By.name('birth-month')).sendKeys('January');
        await driver.findElement(By.name('birth-year')).sendKeys('2000');
        await driver.findElement(By.name('email')).sendKeys(email);
        await driver.findElement(By.className('button')).click();

        // Wait for some time to ensure the form is submitted
        await driver.sleep(5000);

        return { message: 'Account created successfully!' };
    } finally {
        await driver.quit();
    }
}

export default async function handler(req, res) {
    const { username, password, email } = req.body;

    try {
        await createAccount(username, password, email);
        res.status(200).json({ message: 'Account created successfully!' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
