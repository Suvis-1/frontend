# The Best Afterschool Lessons Booking App

A Vue 3 + Vite frontend for browsing and booking after school lessons.  
This project connects to an Express + MongoDB backend and demonstrates a full stack coursework solution.

---

## ✨ Features

- 🔍 **Search & Filter** lessons by subject, location, or price  
- 📊 **Sort** lessons by subject, location, price, or availability  
- 🛒 **Basket system** with quantity controls and persistence (localStorage)  
- ✅ **Validation** for names, phone numbers, and notes  
- 📦 **Order placement** with automatic availability updates  
- 📱 **Responsive design** using Bootstrap 5  
- 🔔 **Toast notifications** for success/error feedback  

---

## 🛠️ Tech Stack

- **Frontend:** Vue 3, Vite, Bootstrap 5, Font Awesome  
- **Backend:** Express.js, Node.js  
- **Database:** MongoDB Atlas  
- **Deployment:** GitHub Pages (frontend), Render/Heroku/Node server (backend)  

---

## 📂 Project Structure

```
.
├── index.html              # Entry HTML file
├── vite.config.js          # Vite configuration
├── package.json            # Dependencies & scripts
├── public/                 # Static assets (served as-is)
│   └── logo.png
├── src/                    # Application source code
│   ├── main.js             # JS entry point (router setup)
│   ├── App.vue             # Root Vue component (state + layout)
│   └── views/              # Page-level components
│       ├── LessonsView.vue # Lessons listing/search
│       └── CartView.vue    # Basket & checkout
└── dist/                   # Production build output
```

---

## 🔄 How It Works

`(index.html) → (main.js) → (App.vue) → <router-view> → LessonsView / CartView`

1. **index.html**  
   - Base HTML with `<div id="app"></div>`.  
   - Loads `main.js`.

2. **main.js**  
   - Creates Vue app.  
   - Configures Vue Router with `/` → `LessonsView` and `/cart` → `CartView`.

3. **App.vue**  
   - Root component with navbar, toast system, and global state.  
   - Provides lessons, cart, and checkout logic to child components.

4. **LessonsView.vue**  
   - Displays lessons with search, sort, and add to basket functionality.  
   - Persists preferences and cart in localStorage.

5. **CartView.vue**  
   - Shows basket contents, allows quantity updates/removals.  
   - Handles checkout form with validation and order submission.

---

## 🚀 Project Setup

### Install Dependencies

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

### Deploy to GitHub Pages

```sh
npm run deploy
```

---

## 🌐 Deployment

- **Frontend:** Deployed via GitHub Pages (served from `/frontend/` base path).  
- **Backend:** Runs on Express.js with MongoDB Atlas connection.  

---

## 📖 Environment Variables

Create a `.env` file in the project root to configure the backend API URL:

```
VITE_API_URL=https://your-backend-server.com/api
```

This variable is used throughout the app to connect to the backend for fetching lessons, searching, and submitting orders. Replace the URL with your deployed backend server link.

---

## 📖 Recommended IDE Setup

- **VS Code**  
- **Extensions:** Volar (Vue 3), ESLint, Prettier  

---

## 📜 License

This project is licensed under the MIT License.  
See the [LICENSE](LICENSE) file for details.