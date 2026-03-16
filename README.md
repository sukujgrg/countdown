# Countdown Timer

A GSAP-native countdown lab built with React and Vite. The app now ships with a cinematic configure screen, multiple animation personalities, live typography selection, persisted browser-side configuration, and persisted local background audio.

Live demo: [https://sukujgrg.github.io/countdown/](https://sukujgrg.github.io/countdown/)

## Setup

```bash
npm install
npm run dev
```

## URL Parameters

Customize the timer via query parameters:

| Parameter | Description | Default |
|-----------|-------------|---------|
| `minutes` | Countdown duration in minutes | `15` |
| `messages` | Comma- or line-separated message phrases | church-themed defaults |
| `font`    | Hosted font family loaded at runtime | `Rajdhani` |
| `messageFx` | Message transition style | `crossfade` |
| `style`   | GSAP animation profile | `pulse-grid` |
| `sound`   | `local-file` when a browser-selected audio file is attached | not set |

## Browser Persistence

- The app saves `minutes`, `font`, `style`, `messages`, and `messageFx` in browser `localStorage`.
- The uploaded local audio file is stored separately in `IndexedDB`.
- On startup, the app restores the last saved config automatically when the URL has no query parameters.
- If the URL does include query parameters, the URL takes precedence over the saved config.
- Saved config is shared across tabs for the same site origin, and setup-screen changes sync across tabs.
- Live countdown state is not shared across tabs. Running/paused status, remaining seconds, and current playback position stay per tab.

## Examples

### Basic usage

```
http://localhost:5173/
```

### Custom duration

```
# 10-minute countdown
http://localhost:5173/?minutes=10

# 1-minute countdown
http://localhost:5173/?minutes=1

# 30-minute countdown
http://localhost:5173/?minutes=30

# 90-minute countdown
http://localhost:5173/?minutes=90
```

### Hosted fonts

The configure screen uses hosted web fonts so every visitor gets the same result. These are loaded at runtime from [Google Fonts](https://fonts.google.com/):

```
# Orbitron - geometric, space-age
http://localhost:5173/?font=Orbitron

# Chakra Petch - cyberpunk, angular
http://localhost:5173/?font=Chakra Petch

# Audiowide - retro-futuristic
http://localhost:5173/?font=Audiowide

# Oxanium - digital, gaming
http://localhost:5173/?font=Oxanium

# Rajdhani - clean, techy
http://localhost:5173/?font=Rajdhani

# Michroma - wide, space-age
http://localhost:5173/?font=Michroma

# Press Start 2P - pixel/retro
http://localhost:5173/?font=Press Start 2P

# Share Tech Mono - monospace, terminal
http://localhost:5173/?font=Share Tech Mono

# Black Ops One - military/tactical
http://localhost:5173/?font=Black Ops One

# Bungee - bold, display
http://localhost:5173/?font=Bungee
```

### Animation styles

The countdown stage includes multiple GSAP-native motion systems:

```
# elastic neon pulses
http://localhost:5173/?minutes=15&style=pulse-grid

# rotational vault transitions
http://localhost:5173/?minutes=15&style=orbit-vault

# scanline/glitch motion
http://localhost:5173/?minutes=15&style=glitch-scan

# calm sanctuary halo
http://localhost:5173/?minutes=15&style=sanctuary-glow
```

### Default font

```
# Rajdhani (default) - clean, techy
http://localhost:5173/

# JetBrains Mono - monospace, no digit jitter
http://localhost:5173/?font=JetBrains Mono
```

### Combining parameters

```
# 15-minute timer with Orbitron font
http://localhost:5173/?minutes=15&font=Orbitron

# 2-minute timer with pixel font
http://localhost:5173/?minutes=2&font=Press Start 2P

# 45-minute timer with monospace font
http://localhost:5173/?minutes=45&font=JetBrains Mono

# 10-minute timer with cyberpunk font
http://localhost:5173/?minutes=10&font=Chakra Petch

# 25-minute timer with message sequence
http://localhost:5173/?minutes=25&messages=Welcome,Service%20Begins%20Soon,Prepare%20Your%20Heart

# 25-minute countdown with Orbit Vault motion
http://localhost:5173/?minutes=25&style=orbit-vault

# 45-minute countdown with custom font and motion
http://localhost:5173/?minutes=45&font=Orbitron&style=glitch-scan
```

### Message sequence

The configure screen can add short church-facing lines that transform in place beneath the countdown.

- Enter them as comma-separated items or one phrase per line.
- They are saved in browser storage and restored automatically on the next visit.
- They can also be passed through the URL with `messages=...`.
- The transition behavior can be chosen with `messageFx=crossfade`, `word-build`, `glow-swap`, or `vertical-lift`.

### Local audio file

Choose an audio file from your machine before starting the timer if you want local playback during the countdown.

- The file is stored in your browser so the countdown page can play it.
- The file is shared across tabs for the same browser profile and origin.
- The saved file is restored when you refresh or return to the setup page in the same browser.
- The playback object URL is recreated from the stored blob whenever the app restores the track.
- If a file is selected, the app adds `sound=local-file` to the URL.
- The actual file is not embedded in the URL, so that link is not portable to other devices or browsers.
- The local file loops while the countdown is running and stops when the timer ends.

## Build

```bash
npm run build
```

Output is generated in the `dist/` directory for static deployment.

## GitHub Pages deployment

This repo includes a GitHub Actions workflow at `.github/workflows/deploy.yml` that builds and deploys the site to GitHub Pages on every push to `main`.

For the first deployment, enable GitHub Pages in the repository settings and set the source to `GitHub Actions`.

## Tech Stack

- React 18
- Vite 6
- GSAP
- Tailwind CSS 4
- TypeScript

## Attribution

Originally generated from [Figma Make](https://www.figma.com/design/kahpRoVRYtnFZn6rrx6SuA/Countdown-Timer-Animation). See [ATTRIBUTIONS.md](ATTRIBUTIONS.md) for third-party licenses.

## License

MIT
