import os
import urllib.request
import xml.etree.ElementTree as ET
from flask import Flask, render_template, jsonify, request

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def fetch_and_parse_feed():
    req = urllib.request.Request(
        FEED_URL,
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    )
    # Fetch content with a 10 second timeout
    with urllib.request.urlopen(req, timeout=10) as response:
        xml_data = response.read()
    
    root = ET.fromstring(xml_data)
    
    # Detect Atom namespace
    ns = ""
    if root.tag.startswith("{"):
        ns = root.tag.split("}")[0] + "}"
    
    entries = []
    for entry in root.findall(f"{ns}entry"):
        title_el = entry.find(f"{ns}title")
        id_el = entry.find(f"{ns}id")
        updated_el = entry.find(f"{ns}updated")
        link_el = entry.find(f"{ns}link")
        content_el = entry.find(f"{ns}content")
        
        title = title_el.text if title_el is not None else ""
        entry_id = id_el.text if id_el is not None else ""
        updated = updated_el.text if updated_el is not None else ""
        
        link = ""
        if link_el is not None:
            link = link_el.get("href", "")
            
        content = content_el.text if content_el is not None else ""
        
        entries.append({
            "title": title,
            "id": entry_id,
            "updated": updated,
            "link": link,
            "content": content
        })
        
    return entries

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    try:
        entries = fetch_and_parse_feed()
        return jsonify({
            "success": True,
            "data": entries
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == '__main__':
    # Running on port 5000 in debug mode
    app.run(host='127.0.0.1', port=5000, debug=True)
