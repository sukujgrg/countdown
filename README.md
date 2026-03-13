# Countdown Timer

A cyberpunk-themed countdown timer built with React, Vite, and Tailwind CSS. Features animated flip digits, glowing backgrounds, and rotating rings.

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
| `minutes` | Countdown duration in minutes | `5` |
| `title`   | Main heading text shown on the timer | `COUNTDOWN` |
| `font`    | Hosted font family loaded at runtime | `Rajdhani` |
| `sound`   | `local-file` when a browser-selected audio file is attached | not set |

## Examples

### Basic usage (5-minute default)

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

The built-in font picker uses hosted web fonts so every visitor gets the same result. These are loaded at runtime from [Google Fonts](https://fonts.google.com/):

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

# 5-minute timer with a custom title
http://localhost:5173/?minutes=5&title=Focus%20Sprint
```

### Local audio file

Choose an audio file from your machine before starting the timer if you want local playback during the countdown.

- The file is stored in your browser so the countdown page can play it.
- The saved file is restored when you refresh or return to the setup page in the same browser.
- If a file is selected, the app adds `sound=local-file` to the URL.
- The actual file is not embedded in the URL, so that link is not portable to other devices or browsers.
- The local file loops while the countdown is running and stops when the timer ends.

## Build-time configuration

Set the default minutes via the `MINUTES` environment variable at build time:

```bash
MINUTES=10 npm run build
```

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
- Tailwind CSS 4
- TypeScript

## Attribution

Originally generated from [Figma Make](https://www.figma.com/design/kahpRoVRYtnFZn6rrx6SuA/Countdown-Timer-Animation). See [ATTRIBUTIONS.md](ATTRIBUTIONS.md) for third-party licenses.

## License

MIT
