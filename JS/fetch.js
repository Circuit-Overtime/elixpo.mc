const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const path = require('path');
const start = Date.now();

// Setup Chrome options to run in headless mode
const chromeOptions = new chrome.Options();
chromeOptions.addArguments('--headless');  // Run in headless mode
chromeOptions.addArguments('--disable-gpu');  // Disable GPU acceleration
chromeOptions.addArguments('--no-sandbox');  // Recommended for Linux systems
chromeOptions.addArguments('--disable-dev-shm-usage');  // Overcome limited resource problems

// Replace with the path to your downloaded WebDriver
const service = new chrome.ServiceBuilder('D:\\chromedriver-win64\\chromedriver.exe');

async function fetchData(sparkURL) {
    let driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(chromeOptions)
        .setChromeService(service)  // Set the service here instead of setDefaultService
        .build();

    try {
        // Open the URL
        await driver.get(sparkURL);

        // Wait until the elements are present in the DOM
        const wait = driver.wait.bind(driver);

        const infoButton = await wait(until.elementLocated(By.xpath('//*[@id="__next"]/main/div/div[1]/div[3]')), 90000);
        await infoButton.click();

        // Waiting for the elements to be present
        const tpsElement = await wait(until.elementLocated(By.xpath('//*[@id="__next"]/main/div/div[2]/div[1]/div[1]/div/div[1]/div[1]')), 90000);
        const cpuUsageElement = await wait(until.elementLocated(By.xpath('//*[@id="__next"]/main/div/div[2]/div[1]/div[3]/div/div[1]/div[1]')), 90000);
        const memoryUsageElement = await wait(until.elementLocated(By.xpath('//*[@id="__next"]/main/div/div[2]/div[1]/div[4]/div/div/div[1]/span[1]')), 90000);
        const physicalMemoryElement = await wait(until.elementLocated(By.xpath('//*[@id="__next"]/main/div/div[2]/div[1]/div[6]/div/div/div[1]/span[1]')), 90000);
        const diskUsageElement = await wait(until.elementLocated(By.xpath('//*[@id="__next"]/main/div/div[2]/div[1]/div[8]/div/div/div[1]/span[1]')), 90000);
        const uptimeUsageCheck = await wait(until.elementLocated(By.xpath('//*[@id="__next"]/main/div/div[2]/div[2]/div/p[7]/span')), 90000);

        // Fetching the text
        const tpsText = await tpsElement.getText(); // out of 20
        const cpuUsageText = await cpuUsageElement.getAttribute('innerHTML'); // out of 100%
        const memoryUsageText = await memoryUsageElement.getAttribute('innerHTML');  // out of 6gb
        const physicalMemoryUsage = await physicalMemoryElement.getAttribute('innerHTML');  // out of 8gb
        const diskUsage = await diskUsageElement.getAttribute('innerHTML');  // out of 28gb
        const uptime = await uptimeUsageCheck.getAttribute('innerHTML');

        console.log("TPS: ", tpsText);
        console.log("CPU Usage: ", cpuUsageText);
        console.log("Memory Usage: ", memoryUsageText);
        console.log("Physical Memory Usage: ", physicalMemoryUsage);
        console.log("Disk Usage: ", diskUsage);
        console.log("Uptime: ", uptime);

    } catch (e) {
        console.error(e);
    } finally {
        // Close the browser
        await driver.quit();
        const end = Date.now();
        console.log("Time taken to fetch data = ", (end - start) / 1000, "seconds");  // Print the time taken to fetch the data
        process.exit();
    }
};

fetchData("https://spark.lucko.me/PqXU3dYUs0");