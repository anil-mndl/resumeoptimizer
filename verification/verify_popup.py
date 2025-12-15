from playwright.sync_api import sync_playwright

def verify_popup():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:8000/popup.html")

        # Check if the title is correct
        assert page.title() == "Shell Extension"

        # Check if text is present
        assert page.locator("h3").inner_text() == "Hello World!"

        # Take a screenshot
        page.screenshot(path="verification/popup.png")

        browser.close()

if __name__ == "__main__":
    verify_popup()
