<!-- markdownlint-configure-file {
  "MD013": {
    "code_blocks": false,
    "tables": false
  },
  "MD033": false,
  "MD041": false
} -->

# Traveller Way

Table of contents

- [Clone the repository](#clone-the-repository)
- [Getting started](#getting-started)
  - [1. Start the API](#1-start-the-api)
  - [2. Start the client](#2-start-the-client)
  - [3. Open the browser](#3-open-the-browser)
- [Testing](#testing)
- [Accessing the API](#accessing-the-api)
  - [Search for a location](#search-for-a-location)
- [Problems?](#problems)


## Clone the repository

```bash
git clone https://github.com/gabrieldeavila/playground.git
```

Access the project folder

```bash
cd ./playground/src/stories/traveller
```

## Getting started

![Tutorial][assets_1]

### 1. Start the API

```bash
cd ./api

pnpm install # or npm install

npm run dev # this will start the API server on http://localhost:3000
```

### 2. Start the client

```bash
cd ./front

pnpm install # or npm install

npm run dev # this will start the client on http://localhost:3004
```

### 3. Open the browser

Open your browser and go to [http://localhost:3004](http://localhost:3004)

## Testing

```bash
cd ./api

npm run test
```

## Accessing the API

### Search for a location

If you want to search for a location, you can use the following endpoint:

```bash
method: POST
"http://localhost:3000/search"

# Available parameters:
{
	"checkin": "2024-06-04",
	"checkout": "2024-06-07",
	"adults": "1",
	"rooms": "2",
	"kids": [],
	"promocode": null
}
```

![Tutorial][assets_2]
![Tutorial][assets_3]

## Problems?

### Puppeteer

If you don't have puppeteer installed, the install might take a while.

If you want to install it globally, you can run the following command:

```bash
pnpm install -g puppeteer
```

And if you want to install a browser, you can run the following command:

```bash
npx @puppeteer/browsers install chrome@stable
```

[assets_1]: assets/1.gif
[assets_2]: assets/2.png
[assets_3]: assets/3.png
