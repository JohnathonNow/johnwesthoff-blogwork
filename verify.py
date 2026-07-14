from playwright.sync_api import sync_playwright
import os

def run_cuj(page):
    filepath = f"file://{os.path.abspath('photobooth.html')}"
    page.goto(filepath)
    page.wait_for_timeout(500)

    # Click take photo
    page.get_by_role("button", name="Take Photo").click()

    # Wait for countdown
    for i in range(6):
        page.wait_for_timeout(1000)

    # Take screenshot at the key moment
    page.screenshot(path="/home/jules/verification/screenshots/verification.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    os.makedirs("/home/jules/verification/videos", exist_ok=True)
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--use-fake-ui-for-media-stream",
                "--use-fake-device-for-media-stream"
            ]
        )
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos",
            accept_downloads=True # Make sure downloads are accepted
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
