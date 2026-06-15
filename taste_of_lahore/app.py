import os
from flask import Flask, render_template, jsonify

app = Flask(__name__)

# Sample Lahori Menu Data
MENU_ITEMS = [
    {
        "id": "biryani",
        "name": "Special Chicken Biryani",
        "description": "Fragrant long-grain basmati rice cooked with succulent chicken marinated in yogurt, saffron, caramelised onions, mint, and fresh spices. A Taste of Lahore signature.",
        "price": 650,
        "category": "mains",
        "image": "/static/images/biryani.jpg"
    },
    {
        "id": "mutton_karahi",
        "name": "Lahori Mutton Karahi",
        "description": "Tender pieces of mutton slow-cooked in a traditional iron wok with fresh tomatoes, ginger, garlic, green chilies, and freshly crushed spices.",
        "price": 1450,
        "category": "mains",
        "image": "/static/images/hero_bg.jpg"
    },
    {
        "id": "seekh_kabab",
        "name": "Beef Seekh Kabab Platter",
        "description": "Four flame-grilled skewers of tender beef mince blended with onions, fresh coriander, green chilies, and our secret blend of garam masala.",
        "price": 750,
        "category": "sides",
        "image": "/static/images/kabab.jpg"
    },
    {
        "id": "shahi_kheer",
        "name": "Shahi Lahori Kheer",
        "description": "Traditional slow-cooked thick rice pudding flavored with green cardamom, saffron, and rose water, garnished with slivered almonds and pistachios.",
        "price": 300,
        "category": "desserts",
        "image": "/static/images/kheer.jpg"
    }
]

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/menu')
def get_menu():
    return jsonify({
        "success": True,
        "menu": MENU_ITEMS
    })

if __name__ == '__main__':
    # Run Taste of Lahore on port 5001 to avoid conflicting with the BigQuery Release Notes server (port 5000)
    app.run(host='127.0.0.1', port=5001, debug=True)
