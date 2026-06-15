import unittest
import os
import time
import json
import socket
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException

# Configuration
BASE_URL = "http://127.0.0.1:5173"  # Frontend
BACKEND_URL = "http://127.0.0.1:5000" # Backend
ARTIFACTS_DIR = "test_artifacts"
SCREENSHOTS_DIR = os.path.join(ARTIFACTS_DIR, "screenshots")
LOGS_DIR = os.path.join(ARTIFACTS_DIR, "logs")

# Credentials
CREDENTIALS = {
    "admin": {"id": "ADM-26-001", "password": "123456"},
    "faculty": {"id": "FAC-26-001", "password": "123456"},
    "student": {"id": "CSE-26-101", "password": "123456"}
}

class CampusHubE2E(unittest.TestCase):
    driver = None

    @classmethod
    def setUpClass(cls):
        # Pre-flight check: Frontend
        print(f"--- Checking connectivity to Frontend: {BASE_URL} ---")
        try:
            with socket.create_connection(("127.0.0.1", 5173), timeout=2):
                print("Frontend is UP.")
        except (socket.timeout, ConnectionRefusedError):
            print("\n" + "!"*60)
            print(f"ERROR: Frontend Connection refused at {BASE_URL}")
            print("Please run: npm run dev")
            print("!"*60 + "\n")
            raise RuntimeError(f"Frontend server not found at {BASE_URL}")

        # Pre-flight check: Backend
        print(f"--- Checking connectivity to Backend: {BACKEND_URL} ---")
        try:
            with socket.create_connection(("127.0.0.1", 5000), timeout=2):
                print("Backend is UP.")
        except (socket.timeout, ConnectionRefusedError):
            print("\n" + "!"*60)
            print(f"ERROR: Backend Connection refused at {BACKEND_URL}")
            print("Please run (in a separate terminal): cd server && npm run dev")
            print("!"*60 + "\n")
            raise RuntimeError(f"Backend server not found at {BACKEND_URL}")

        # Ensure artifact directories exist
        os.makedirs(SCREENSHOTS_DIR, exist_ok=True)
        os.makedirs(LOGS_DIR, exist_ok=True)

        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--window-size=1920,1080")
        
        try:
            cls.driver = webdriver.Chrome(options=chrome_options)
        except Exception as e:
            print(f"Failed to initialize Chrome Driver: {e}")
            raise

    @classmethod
    def tearDownClass(cls):
        if cls.driver:
            cls.driver.quit()

    def setUp(self):
        self.driver.get(f"{BASE_URL}/auth")
        self.wait = WebDriverWait(self.driver, 15) # Increased timeout for login

    def tearDown(self):
        # Capture screenshot and logs on failure
        test_method_name = self._testMethodName
        
        # Python 3.14 compatibility fix for failure detection
        failed = False
        outcome = getattr(self, '_outcome', None)
        if outcome:
            result = getattr(outcome, 'result', None)
            if result:
                if any(error for test, error in getattr(result, 'errors', []) if test == self) or \
                   any(failure for test, failure in getattr(result, 'failures', []) if test == self):
                    failed = True
            else:
                if getattr(outcome, 'errors', None) or getattr(outcome, 'failures', None):
                    failed = True

        if failed and self.driver:
            timestamp = int(time.time())
            screenshot_path = os.path.join(SCREENSHOTS_DIR, f"{test_method_name}_{timestamp}.png")
            try:
                self.driver.save_screenshot(screenshot_path)
                logs_path = os.path.join(LOGS_DIR, f"{test_method_name}_{timestamp}.log")
                browser_logs = self.driver.get_log('browser')
                with open(logs_path, 'w') as f:
                    for entry in browser_logs:
                        f.write(json.dumps(entry) + "\n")
            except Exception:
                pass

    # Helpers
    def login(self, username, password):
        email_field = self.wait.until(EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Enter your ID or Email']")))
        pass_field = self.driver.find_element(By.XPATH, "//input[@placeholder='Enter your password']")
        submit_btn = self.driver.find_element(By.CSS_SELECTOR, "button.auth-submit")

        email_field.clear()
        email_field.send_keys(username)
        pass_field.clear()
        pass_field.send_keys(password)
        submit_btn.click()
        
        # Wait for dashboard to load
        self.wait.until(EC.url_contains("/dashboard"))

    def navigate_sidebar(self, label):
        # NavLinks are within nav.sidebar-nav
        sidebar_item = self.wait.until(EC.element_to_be_clickable((By.XPATH, f"//nav[contains(@class, 'sidebar-nav')]//a[contains(., '{label}')]")))
        sidebar_item.click()

    # --- Admin Tests ---
    def test_admin_flow(self):
        """Tests Admin login and dashboard navigation."""
        self.login(CREDENTIALS["admin"]["id"], CREDENTIALS["admin"]["password"])
        header = self.wait.until(EC.presence_of_element_located((By.XPATH, "//h1[contains(text(), 'Admin Control Panel')]")))
        self.assertIn("Admin Control Panel", header.text)

        users_tab = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Users Directory')]")
        users_tab.click()
        # Verify tab switch by presence of role toggle buttons
        self.wait.until(EC.presence_of_element_located((By.XPATH, "//button[contains(text(), 'Students')]")))

        courses_tab = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Courses')]")
        courses_tab.click()
        self.wait.until(EC.presence_of_element_located((By.XPATH, "//h2[contains(text(), 'Academic Course List')]")))

    # --- Faculty Tests ---
    def test_faculty_course_management(self):
        """Tests Faculty teaching courses management (Attendance, Assignments, Results)."""
        self.login(CREDENTIALS["faculty"]["id"], CREDENTIALS["faculty"]["password"])
        self.navigate_sidebar("Teaching Courses")
        course_card = self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "article.course-card")))
        course_card.click()
        self.wait.until(EC.presence_of_element_located((By.XPATH, "//button[contains(., 'Back to Teaching Courses')]")))

        attendance_tab = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Attendance')]")
        attendance_tab.click()
        self.wait.until(EC.presence_of_element_located((By.XPATH, "//h2[contains(text(), 'Mark Attendance')]")))

        results_tab = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Results')]")
        results_tab.click()
        self.wait.until(EC.presence_of_element_located((By.XPATH, "//h2[contains(text(), 'Publish Student Results')]")))

    # --- Student Tests ---
    def test_student_profile_and_messages(self):
        """Tests Student profile viewing and messaging."""
        self.login(CREDENTIALS["student"]["id"], CREDENTIALS["student"]["password"])
        self.navigate_sidebar("Profile")
        self.wait.until(EC.presence_of_element_located((By.XPATH, "//h1[contains(text(), 'My Profile')]")))
        
        edit_btn = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Edit Profile')]")
        edit_btn.click()
        # Check if form appeared
        self.wait.until(EC.presence_of_element_located((By.XPATH, "//label[contains(text(), 'Phone Number')]")))
        
        # Verify result section exists in profile
        self.wait.until(EC.presence_of_element_located((By.XPATH, "//h2[contains(text(), 'Result Summary:')]")))

        self.navigate_sidebar("Messages")
        self.wait.until(EC.url_contains("/messages"))

        # Search for a user to message
        search_dir_input = self.wait.until(EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Search student/faculty...']")))
        search_dir_input.send_keys("Faculty")
        
        # Select first result from search dropdown
        # The buttons are inside the user search results panel
        first_result = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//div[contains(@style, 'maxHeight: 180px')]//button[1]")))
        first_result.click()

        # Type message in footer input
        msg_input = self.wait.until(EC.presence_of_element_located((By.XPATH, "//footer[contains(@class, 'chat-input')]//input[@type='text']")))
        msg_input.send_keys("Hello from E2E Test!")
        
        # Send message
        send_btn = self.driver.find_element(By.CSS_SELECTOR, "button.chat-send")
        send_btn.click()

    def test_logout(self):
        """Tests Logout functionality."""
        self.login(CREDENTIALS["student"]["id"], CREDENTIALS["student"]["password"])
        logout_btn = self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button.sidebar-logout")))
        logout_btn.click()
        self.wait.until(EC.url_contains("/auth"))

if __name__ == "__main__":
    unittest.main()
