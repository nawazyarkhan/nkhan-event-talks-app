# BigQuery Release Notes Explorer 🚀

A modern, high-end web application that fetches the latest BigQuery release notes, parses them into individual updates, and features a built-in mock Tweet composer to easily share updates on X (formerly Twitter).

---

## 🌟 Key Features

*   **Live XML Feed Parser**: Backend parsing of the official Google Cloud BigQuery Atom feed.
*   **Granular Update Splitting**: Automatically divides grouped date entries into individual, select-able cards (Features, Fixes, Changes, and Deprecated updates).
*   **Modern Glassmorphism UI**: High-end dark theme designed with backdrop filters, glowing states, and fluid micro-animations.
*   **Interactive Tweet Composer**: Recreates a simulated Twitter Web Card preview. Calculates character counts dynamically, warns you when approaching limits, and facilitates sharing.
*   **Utilities**:
    *   **Auto-Shortener**: Instantly fits the tweet layout within the 280-character limit.
    *   **Hashtag Generator**: Appends relevant hashtags (`#BigQuery #GoogleCloud #GCP`).
    *   **One-Click Copy**: Copies the draft to your clipboard with animated toast validation.
    *   **Direct Post Redirect**: Opens a pre-filled Twitter sharing dialog in a new tab.

---

## 📁 Repository Structure

```tree
├── app.py                  # Flask Web Server & API Feed Parser
├── templates/
│   └── index.html          # SPA Structural Layout
├── static/
│   ├── css/
│   │   └── style.css       # Custom Glassmorphic CSS Styling
│   └── js/
│       └── app.js          # Interactive JavaScript Engine (DOMParser, Filter, Composer)
├── requirements.txt        # Backend dependencies (Flask)
└── .gitignore              # Standard ignore configurations
```

---

## 🛠️ Technology Stack

*   **Backend**: Python, Flask (standard `urllib` & `xml.etree.ElementTree` parsing).
*   **Frontend**: Plain Vanilla HTML5, Vanilla JavaScript (ES6+), FontAwesome Icons, Google Fonts (Outfit & Inter).
*   **Styling**: Pure CSS3 (featuring custom variables, flexbox, grid, backdrop blurs, keyframe animations).

---

## 🚀 Installation & Running

Follow these steps to run the application locally:

### 1. Prerequisites
Ensure you have Python 3.8+ installed on your computer.

### 2. Install Dependencies
Clone this repository, navigate to the folder, and run:
```bash
pip install -r requirements.txt
```

### 3. Run the Flask Server
Launch the development server:
```bash
python app.py
```

### 4. View the App
Open your web browser and navigate to:
👉 **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## 🔄 How the Data Flows

```
[Browser UI] ──(1. Get Releases API Request)──> [Flask Server]
                                                    │
                                         (2. Fetch Live XML Feed)
                                                    │
                                                    ▼
[Browser UI] <──(4. Parse JSON & Render)─── [Google Feed API]
```

1.  **Request API**: The client makes a cache-bypassed call to `/api/releases`.
2.  **Fetch & Parse**: The Flask server requests the raw XML feed from Google, uses Python's native XML ElementTree to map the namespaces, and returns structured JSON.
3.  **Dynamic DOM Splitting**: The frontend Javascript utilizes `DOMParser` to parse the feed's inner HTML, separating updates by `<h3>` tags to make each individual point selectable.
4.  **Composition & Share**: Clicking any card loads the details into the tweet builder, evaluates lengths, and links out via Web Intent to post.
