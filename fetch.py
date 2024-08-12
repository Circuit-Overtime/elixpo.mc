from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
import time



start = time.time()

# Setup Chrome options to run in headless mode
chrome_options = Options()
chrome_options.add_argument("--headless")  # Run in headless mode
chrome_options.add_argument("--disable-gpu")  # Disable GPU acceleration
chrome_options.add_argument("--no-sandbox")  # Recommended for Linux systems
chrome_options.add_argument("--disable-dev-shm-usage")  # Overcome limited resource problems

# Replace '/path/to/chromedriver' with the path to your downloaded WebDriver
service = Service('D:\\chromedriver-win64\\chromedriver.exe')
driver = webdriver.Chrome(service=service, options=chrome_options)

try:
    # Open the URL
    driver.get('https://spark.lucko.me/PqXU3dYUs0')

    # Wait until the elements are present in the DOM
    wait = WebDriverWait(driver, 90)  # Adjust the timeout if needed

    info_button = wait.until(EC.element_to_be_clickable((By.XPATH, '//*[@id="__next"]/main/div/div[1]/div[3]')))
    info_button.click()
    # Waiting for the elements to be present
    tps_element = wait.until(EC.presence_of_element_located((By.XPATH, '//*[@id="__next"]/main/div/div[2]/div[1]/div[1]/div/div[1]/div[1]')))
    cpu_usage_element = wait.until(EC.presence_of_element_located((By.XPATH, '//*[@id="__next"]/main/div/div[2]/div[1]/div[3]/div/div[1]/div[1]')))
    memory_usage_element = wait.until(EC.presence_of_element_located((By.XPATH, '//*[@id="__next"]/main/div/div[2]/div[1]/div[4]/div/div/div[1]/span[1]')))
    physical_memory_element = wait.until(EC.presence_of_element_located((By.XPATH, '//*[@id="__next"]/main/div/div[2]/div[1]/div[6]/div/div/div[1]/span[1]')))
    disk_usage_element = wait.until(EC.presence_of_element_located((By.XPATH, '//*[@id="__next"]/main/div/div[2]/div[1]/div[8]/div/div/div[1]/span[1]')))
    uptime_usage_check = wait.until(EC.presence_of_element_located((By.XPATH, '//*[@id="__next"]/main/div/div[2]/div[2]/div/p[7]/span')))

    # Fetching the text
    tps_text = tps_element.text # out of 20
    cpu_usage_text = cpu_usage_element.get_attribute("innerHTML") # out of 100%x
    memory_usage_text = memory_usage_element.get_attribute("innerHTML")  # out of 6gb
    physical_memory_usage = physical_memory_element.get_attribute("innerHTML")  # out of 8gb
    disk_usage = disk_usage_element.get_attribute("innerHTML")  # out of 28gb
    uptime = uptime_usage_check.get_attribute("innerHTML")

    print("TPS: ", tps_text)
    print("CPU Usage: ", cpu_usage_text)
    print("Memory Usage: ", memory_usage_text)
    print("Physical Memory Usage: ", physical_memory_usage)
    print("Disk Usage: ", disk_usage)
    print("Uptime: ", uptime)

    end = time.time()
except Exception as e:
    print(e)
    end = time.time()
finally:
    # Close the browser
    driver.quit()
    print("time taken to fetch data = ", end - start)  # Print the time taken to fetch the data
    exit()
