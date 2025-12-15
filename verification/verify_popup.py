from playwright.sync_api import sync_playwright, expect
import threading
import http.server
import socketserver
import os
import sys

# Serve the current directory to load popup.html
PORT = 8000
DIRECTORY = os.getcwd()

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def run_server():
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at port {PORT}")
        httpd.serve_forever()

def verify_popup():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # We need to simulate the chrome.storage API since it's not available in a regular page
        context = browser.new_context()
        page = context.new_page()

        # Mock chrome.storage.local
        page.add_init_script("""
            window.chrome = {
                storage: {
                    local: {
                        get: function(keys, callback) {
                            const data = JSON.parse(localStorage.getItem('mock_chrome_storage') || '{}');
                            const result = {};
                            if (Array.isArray(keys)) {
                                keys.forEach(key => result[key] = data[key]);
                            } else if (typeof keys === 'string') {
                                result[keys] = data[keys];
                            } else {
                                Object.assign(result, data);
                            }
                            callback(result);
                        },
                        set: function(items, callback) {
                            const data = JSON.parse(localStorage.getItem('mock_chrome_storage') || '{}');
                            Object.assign(data, items);
                            localStorage.setItem('mock_chrome_storage', JSON.stringify(data));
                            if (callback) callback();
                        }
                    }
                }
            };
        """)

        try:
            page.goto(f"http://localhost:{PORT}/popup.html")

            # Check for elements
            expect(page.locator("#resumeText")).to_be_visible()
            expect(page.locator("#saveResume")).to_be_visible()

            # Type in resume
            resume_content = "My Name\nSoftware Engineer\nExperience..."
            page.locator("#resumeText").fill(resume_content)

            # Save
            page.locator("#saveResume").click()

            # Verify status message
            expect(page.locator("#status")).to_have_text("Resume saved!")

            # Verify data persistence (simulated)
            # Reload page to check if data loads
            page.reload()
            expect(page.locator("#resumeText")).to_have_value(resume_content)

            # Take screenshot
            page.screenshot(path="verification/popup_verified.png")
            print("Verification successful, screenshot saved.")

        except Exception as e:
            print(f"Verification failed: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    server_thread = threading.Thread(target=run_server)
    server_thread.daemon = True
    server_thread.start()

    # Give server a moment to start
    import time
    time.sleep(1)

    verify_popup()
