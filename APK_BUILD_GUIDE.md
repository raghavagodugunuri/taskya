# TASKYA — APK BUILD GUIDE
## From Code to Android APK in 3 Ways

---

## ✅ PREREQUISITE: Push to GitHub First

```bash
# Clone your repo
git clone https://github.com/GPRaghava99/taskya.git
cd taskya

# Copy all files from this bundle into the folder
# (drag and drop everything from the downloaded zip)

git add .
git commit -m "Initial commit: Taskya app with PWA support"
git push origin main
```

---

## 🚀 OPTION A: PWABuilder (Easiest — No installs needed)

**Best for:** Quick APK, no coding, no Android Studio

### Step 1: Deploy to Vercel (Free)

1. Go to https://vercel.com → Sign in with GitHub
2. Click **"Add New Project"**
3. Import `GPRaghava99/taskya`
4. Click **Deploy** (no config needed)
5. Your app is live at: `https://taskya.vercel.app` (or similar)

### Step 2: Generate APK via PWABuilder

1. Go to https://www.pwabuilder.com
2. Enter your Vercel URL: `https://taskya.vercel.app`
3. Click **Start** → wait for analysis
4. Click **Package for stores**
5. Choose **Android**
6. Click **Download Package**
7. You get a `.apk` file — install it on Android! ✅

**Install the APK on your phone:**
- Transfer APK to phone via USB or Google Drive
- On phone: Settings → Security → Allow Unknown Sources
- Tap the APK file to install

---

## 🛠️ OPTION B: Capacitor (Proper native APK)

**Best for:** Production app, Play Store submission, native features

### Requirements
- Node.js 18+ → https://nodejs.org
- Android Studio → https://developer.android.com/studio
- Java JDK 17+ → https://adoptium.net

### Step 1: Install dependencies

```bash
cd taskya
npm install

# Install Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android
npm install -D @capacitor/assets

# Install PWA plugin
npm install -D vite-plugin-pwa workbox-window
```

### Step 2: Build the web app

```bash
npm run build
```

You should see a `dist/` folder created.

### Step 3: Initialize Capacitor (already configured)

The `capacitor.config.json` is already set up. Just run:

```bash
npx cap add android
npx cap sync
```

### Step 4: Generate app icons (optional — already done)

```bash
# Icons are already in public/ folder
# If you want to regenerate:
npx @capacitor/assets generate --iconBackgroundColor '#D97706' --iconBackgroundColorDark '#D97706'
```

### Step 5: Open in Android Studio

```bash
npx cap open android
```

Android Studio opens automatically.

### Step 6: Build APK in Android Studio

1. Wait for Gradle sync to finish (2-5 mins first time)
2. Menu: **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
3. Wait for build (~2 mins)
4. Click **"locate"** in the success notification
5. APK is at: `android/app/build/outputs/apk/debug/app-debug.apk`

### Step 7: Install on Android

```bash
# Via ADB (phone connected via USB with USB Debugging enabled)
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Or manually transfer the APK file to your phone
```

---

## 📦 OPTION C: Command Line Build (No Android Studio UI)

```bash
cd taskya
npm run build
npx cap sync android

cd android
./gradlew assembleDebug

# APK location:
# android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🏪 BONUS: Submit to Google Play Store

Once you have a working APK:

### Step 1: Create a signed release APK

```bash
cd android

# Generate keystore (do this ONCE, save the keystore file safely!)
keytool -genkey -v -keystore taskya-release.keystore \
  -alias taskya -keyalg RSA -keysize 2048 -validity 10000

# Build release APK
./gradlew assembleRelease
```

### Step 2: Upload to Play Store

1. Go to https://play.google.com/console
2. Create developer account ($25 one-time fee)
3. Create new app → Upload your signed APK/AAB
4. Fill in app details, screenshots, description
5. Submit for review (usually 1-3 days)

---

## 📁 PROJECT STRUCTURE

```
taskya/
├── public/
│   ├── icon-192.png          ← App icon (192x192)
│   ├── icon-512.png          ← App icon (512x512)
│   ├── apple-touch-icon.png  ← iOS icon
│   └── favicon.ico           ← Browser favicon
├── src/
│   ├── components/
│   │   └── TaskManager.jsx   ← Your main app
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── vite.config.js            ← PWA config
├── capacitor.config.json     ← Android config
├── package.json
└── .gitignore
```

---

## 🐛 TROUBLESHOOTING

### "Gradle build failed"
```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

### "SDK not found"
- Open Android Studio → SDK Manager
- Install Android SDK 33 or 34
- Set `ANDROID_HOME` env variable:
  ```bash
  export ANDROID_HOME=$HOME/Android/Sdk
  export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
  ```

### "App not installing on phone"
- Enable: Settings → Developer Options → Install via USB
- Enable: Settings → Security → Unknown sources
- Check: `adb devices` shows your phone

### "PWABuilder score too low"
- Make sure your Vercel URL uses HTTPS (it does by default)
- Check the manifest loads: `https://your-app.vercel.app/manifest.webmanifest`

---

## 💡 QUICK SUMMARY

| Method | Time | Difficulty | Best For |
|--------|------|------------|----------|
| PWABuilder | 10 min | ⭐ Easy | Quick test APK |
| Capacitor | 30 min | ⭐⭐ Medium | Production app |
| Command line | 15 min | ⭐⭐⭐ Hard | CI/CD pipeline |

**Recommended path:**
1. Push to GitHub → Deploy to Vercel → PWABuilder APK (10 mins)
2. If you need Play Store → Capacitor + Android Studio (30 mins)

---

## 📞 HELP

- Capacitor docs: https://capacitorjs.com/docs/android
- PWABuilder: https://docs.pwabuilder.com
- Vercel deploy: https://vercel.com/docs
