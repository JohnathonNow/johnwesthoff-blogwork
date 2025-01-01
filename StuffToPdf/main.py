#!/bin/env python3
import requests
import xml.etree.ElementTree as ET

# https://lemmy.world/api/v3/post/list?type_=All&sort=Hot&page=1

feed = requests.get("https://lemmy.world/feeds/all.xml?sort=Hot")

print("""
<style>
img {
    width: 900px;
    height: auto;
    margin-left: auto;
    margin-right: auto;
}
.container {
    text-align: center;
    width: 1000px;
    margin-left: auto;
    margin-right: auto;
}
body {
    text-align: center;
}
</style>
<div class=\"container\">
""")
if feed.status_code == 200:
    root = ET.fromstring(feed.content)

    for entry in root.findall(".//item"):  # This looks for <entry> tags inside the XML structure
        title = entry.find("title").text if entry.find("title") is not None else "No title"
        link = entry.find("link").text if entry.find("link") is not None else "No link"
        

        print(f"<h1>{title}</h1>")
        print(f"<img src=\"{link}\"/>")
        print(f"<br/><div style=\"page-break-after: always;\"></div>")
print("</div>")
